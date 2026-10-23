import { z } from 'zod';

const email = z.string().trim().toLowerCase().email('Enter a valid email address.').max(254);

export const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use 72 characters or fewer.')
  .regex(/[A-Za-z]/, 'Include at least one letter.')
  .regex(/\d/, 'Include at least one number.');

export const registerSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name.').max(80, 'Name is too long.'),
  email,
  password: passwordSchema,
});

export const loginSchema = z.object({ email, password: z.string().min(1, 'Enter your password.').max(72) });

export const profileSchema = z.object({ name: z.string().trim().min(1, 'Enter your name.').max(80, 'Name is too long.') });

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Enter your current password.').max(72),
  newPassword: passwordSchema,
});

export const deleteAccountSchema = z.object({ password: z.string().min(1, 'Enter your password to confirm.').max(72) });

const title = z
  .string()
  .trim()
  .max(200, 'Title must be 200 characters or fewer.')
  .transform((t) => t || 'Untitled document');

export const docSettingsSchema = z.object({
  pageSize: z.enum(['a4', 'letter']),
  margins: z.enum(['narrow', 'normal', 'wide']),
  pageNumbers: z.boolean(),
});

export const createDocumentSchema = z.object({
  title: title.optional(),
  templateId: z.string().max(60).optional(),
});

export const updateDocumentSchema = z
  .object({
    title: title.optional(),
    content: z.unknown().optional(),
    settings: docSettingsSchema.partial().optional(),
    starred: z.boolean().optional(),
    trashed: z.boolean().optional(),
  })
  .refine((v) => Object.keys(v).length > 0, 'Nothing to update.');

export const listQuerySchema = z.object({
  view: z.enum(['all', 'recent', 'starred', 'trash']).default('all'),
  q: z.string().trim().max(100).optional(),
  sort: z.enum(['title', 'created', 'modified']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
