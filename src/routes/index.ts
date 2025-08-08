import { Hono } from 'hono';
import authRouter from '@/modules/auth/auth.route';
import userRouter from '@/modules/user/user.route';
import healthRouter from '@/modules/health/health.route';

/**
 * @file Main API router.
 *
 * This file aggregates all the module-specific routers (auth, users, etc.)
 * and exposes them under a single `/api` prefix. This helps in organizing
 * the API routes and allows for easy versioning in the future.
 */

const api = new Hono();

api.route('/health', healthRouter);
api.route('/auth', authRouter);
api.route('/users', userRouter);

export default api;