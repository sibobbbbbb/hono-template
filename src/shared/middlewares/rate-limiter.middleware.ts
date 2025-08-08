import { rateLimiter } from 'hono-rate-limiter';
import { Context } from 'hono';

/**
 * Key generator function to extract the client's IP address.
 * @param c - Hono context
 * @returns User's IP address or 'unknown' string if not found.
 */
const keyGenerator = (c: Context) => {
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip');
    
    return ip || 'unknown_ip'; 
};


/**
 * Rate limiter configuration for sensitive endpoints like login and register.
 */
export const authLimiter = rateLimiter({
    windowMs: 15 * 60 * 1000,
    limit: 5,
    message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
    keyGenerator: keyGenerator,
});

/**
 * General rate limiter configuration for most APIs.
 */
export const generalApiLimiter = rateLimiter({
    windowMs: 60 * 1000,
    limit: 100,
    message: 'Too many requests, please slow down.',
    keyGenerator: keyGenerator,
});