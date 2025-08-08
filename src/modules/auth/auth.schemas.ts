import { z } from 'zod';

/* 
 * Define schemas for user registration and login requests.
 * These schemas will be used to validate incoming request data.
 * 
 * The schemas ensure that:
 * - Registration requires a name, email, and password.
 * - Login requires an email and password.
 */
export const RegisterRequestSchema = z.object({
  name: z.string().min(3),
  email: z.email(),
  password: z.string().min(8),
});

export const LoginRequestSchema = z.object({
  email: z.email(),
  password: z.string(),
});

export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;