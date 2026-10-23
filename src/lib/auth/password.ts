import bcrypt from 'bcryptjs';

const ROUNDS = 12;
let dummyHash: Promise<string> | null = null;

export const hashPassword = (password: string) => bcrypt.hash(password, ROUNDS);
export const verifyPassword = (password: string, hash: string) => bcrypt.compare(password, hash);

/** Spends the same time as a real check so response time does not reveal which emails exist. */
export async function burnPasswordCheck(password: string): Promise<false> {
  dummyHash ??= bcrypt.hash('folio-timing-equalizer', ROUNDS);
  await bcrypt.compare(password, await dummyHash);
  return false;
}
