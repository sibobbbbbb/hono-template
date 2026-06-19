/**
 * HTTP helpers for integration tests.
 *
 * Each request carries a unique `x-forwarded-for` so it lands in its own
 * rate-limit bucket — otherwise repeated logins across tests would trip the
 * auth limiter. Tests that specifically assert rate limiting pass a fixed ip.
 */

/** The minimal app surface these helpers need (matches Hono's `.request`). */
export type TestApp = {
	request(input: string, init?: RequestInit): Response | Promise<Response>;
};

export const TEST_USER = {
	name: "Ada Lovelace",
	email: "ada@example.com",
	password: "supersecret",
};

let ipCounter = 0;
/** Returns a unique client IP so each call gets its own rate-limit bucket. */
export const uniqueIp = (): string => {
	const n = ipCounter++;
	return `10.0.${Math.floor(n / 256) % 256}.${n % 256}`;
};

const jsonHeaders = (ip: string): Record<string, string> => ({
	"content-type": "application/json",
	"x-forwarded-for": ip,
});

/** POST /api/v1/auth/register */
export const register = (
	app: TestApp,
	body: object = TEST_USER,
	ip: string = uniqueIp(),
) =>
	app.request("/api/v1/auth/register", {
		method: "POST",
		headers: jsonHeaders(ip),
		body: JSON.stringify(body),
	});

/** POST /api/v1/auth/login — returns the response, access token, and refresh cookie. */
export const login = async (
	app: TestApp,
	body: object = { email: TEST_USER.email, password: TEST_USER.password },
	ip: string = uniqueIp(),
) => {
	const res = await app.request("/api/v1/auth/login", {
		method: "POST",
		headers: jsonHeaders(ip),
		body: JSON.stringify(body),
	});
	const json = (await res.json().catch(() => ({}))) as {
		data?: { accessToken?: string };
	};
	const setCookie = res.headers.get("set-cookie") ?? "";
	return {
		res,
		accessToken: json.data?.accessToken,
		// The `name=value` portion, ready to send back as a Cookie header.
		refreshCookie: setCookie.split(";")[0] ?? "",
	};
};

/** Registers then logs in a fresh user, returning auth material for further requests. */
export const registerAndLogin = async (
	app: TestApp,
	user: typeof TEST_USER = TEST_USER,
) => {
	const ip = uniqueIp();
	await register(app, user, ip);
	return login(app, { email: user.email, password: user.password }, ip);
};

/** Headers for an authenticated request (Bearer + a fresh rate-limit bucket). */
export const authHeaders = (accessToken: string): Record<string, string> => ({
	authorization: `Bearer ${accessToken}`,
	"x-forwarded-for": uniqueIp(),
});
