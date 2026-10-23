import dns from 'node:dns/promises';
import net from 'node:net';
import type { PMNode } from '../types';

export interface ResolvedImage {
  data: Buffer;
  kind: 'png' | 'jpg' | 'gif';
  width: number;
  height: number;
}

const MAX_BYTES = 8 * 1024 * 1024;
const FETCH_TIMEOUT_MS = 8000;

export function sniffImage(buf: Buffer): { kind: ResolvedImage['kind'] | 'unsupported'; width: number; height: number } {
  try {
    if (buf.length > 24 && buf.readUInt32BE(0) === 0x89504e47) {
      return { kind: 'png', width: buf.readUInt32BE(16), height: buf.readUInt32BE(20) };
    }
    if (buf.length > 10 && buf.toString('ascii', 0, 3) === 'GIF') {
      return { kind: 'gif', width: buf.readUInt16LE(6), height: buf.readUInt16LE(8) };
    }
    if (buf.length > 4 && buf[0] === 0xff && buf[1] === 0xd8) {
      let i = 2;
      while (i + 9 < buf.length) {
        if (buf[i] !== 0xff) {
          i += 1;
          continue;
        }
        const marker = buf[i + 1];
        if (marker === 0xff) {
          i += 1;
          continue;
        }
        if ((marker >= 0xd0 && marker <= 0xd9) || marker === 0x01) {
          i += 2;
          continue;
        }
        if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc) {
          return { kind: 'jpg', height: buf.readUInt16BE(i + 5), width: buf.readUInt16BE(i + 7) };
        }
        i += 2 + buf.readUInt16BE(i + 2);
      }
    }
  } catch {
    /* fall through */
  }
  return { kind: 'unsupported', width: 0, height: 0 };
}

function isPrivateIp(ip: string): boolean {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 0 ||
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127)
    );
  }
  const l = ip.toLowerCase();
  return l === '::1' || l === '::' || l.startsWith('fc') || l.startsWith('fd') || l.startsWith('fe80') || l.startsWith('::ffff:');
}

async function fetchRemote(url: string): Promise<Buffer | null> {
  const u = new URL(url);
  if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
  const addrs = await dns.lookup(u.hostname, { all: true });
  if (addrs.length === 0 || addrs.some((a) => isPrivateIp(a.address))) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: ctrl.signal, redirect: 'error' });
    if (!res.ok) return null;
    const declared = Number(res.headers.get('content-length') ?? 0);
    if (declared > MAX_BYTES) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    return buf.length > MAX_BYTES ? null : buf;
  } finally {
    clearTimeout(timer);
  }
}

async function loadOne(src: string): Promise<ResolvedImage | null> {
  try {
    let buf: Buffer | null = null;
    const m = /^data:image\/[a-z0-9.+-]+;base64,(.+)$/is.exec(src);
    if (m) buf = Buffer.from(m[1], 'base64');
    else if (/^https?:\/\//i.test(src)) buf = await fetchRemote(src);
    if (!buf || buf.length === 0) return null;
    const info = sniffImage(buf);
    if (info.kind === 'unsupported' || info.width <= 0 || info.height <= 0) return null;
    return { data: buf, kind: info.kind, width: info.width, height: info.height };
  } catch {
    return null;
  }
}

function collectSources(node: PMNode, out: Set<string>) {
  if (node.type === 'image' && typeof node.attrs?.src === 'string') out.add(node.attrs.src);
  node.content?.forEach((c) => collectSources(c, out));
}

/** Resolves every image in the document up-front so the exporters can stay synchronous. */
export async function resolveImages(doc: PMNode): Promise<Map<string, ResolvedImage | null>> {
  const sources = new Set<string>();
  collectSources(doc, sources);
  const entries = await Promise.all([...sources].map(async (s) => [s, await loadOne(s)] as const));
  return new Map(entries);
}
