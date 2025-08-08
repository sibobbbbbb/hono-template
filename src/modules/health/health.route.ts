import { Hono } from 'hono';

/**
 * @file Health check route.
 *
 * This file defines a simple health check endpoint that responds with
 * a JSON object indicating the API's status. It can be used to monitor
 * the API's availability and basic functionality.
 */

const healthRouter = new Hono();

healthRouter.get('/', (c) => {
  return c.json({ status: 'ok', message: 'API is healthy!' });
});

export default healthRouter;