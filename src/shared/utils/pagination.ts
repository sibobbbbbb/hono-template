import type { Context } from "hono";

export type Pagination = { page: number; limit: number; offset: number };

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/** Parses `?page` and `?limit` query params into safe pagination values. */
export const getPagination = (c: Context): Pagination => {
	const page = Math.max(1, Number(c.req.query("page")) || 1);
	const rawLimit = Number(c.req.query("limit")) || DEFAULT_LIMIT;
	const limit = Math.min(MAX_LIMIT, Math.max(1, rawLimit));
	return { page, limit, offset: (page - 1) * limit };
};

/** Builds pagination metadata for the `meta` field of the response envelope. */
export const paginationMeta = (page: number, limit: number, total: number) => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit) || 1,
});
