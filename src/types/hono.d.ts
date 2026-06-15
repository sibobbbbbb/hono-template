export {};

/**
 * Augments Hono's context variable map so `c.get("jwtPayload")` is typed
 * across the app instead of `any`. The JWT middleware populates this at
 * runtime; this declaration gives it a compile-time shape.
 */
declare module "hono" {
	interface ContextVariableMap {
		jwtPayload: {
			sub: number;
			name: string;
		};
	}
}
