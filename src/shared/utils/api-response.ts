import { Context } from 'hono';
import { ContentfulStatusCode } from 'hono/utils/http-status';

/**
 * Interface for additional metadata.
 * Very useful for providing additional information in responses,
 * especially for data in list or collection format.
 * The most common example is for pagination.
 *
 * @example
 * const paginationMeta = {
 * totalItems: 100,
 * totalPages: 10,
 * currentPage: 1,
 * itemsPerPage: 10,
 * };
 */
interface Meta {
    [key: string]: unknown;
}

/**
 * Helper function to send standardized success responses.
 *
 * Generated JSON structure:
 * {
 * "success": true,
 * "message": "Descriptive message...",
 * "data": { ... } or [ ... ] or null,
 * "meta": { ... } // (Optional)
 * }
 *
 * @template T - Generic data type for the `data` payload. This allows TypeScript
 * to recognize the data type you're sending, providing type-safety.
 *
 * @param {Context} c - Hono context required to send responses.
 * @param {number} statusCode - Appropriate HTTP status code (e.g., 200 for OK, 201 for Created).
 * @param {string} message - Clear and concise message to describe the request result.
 * @param {T | null} [data=null] - Payload (data) to be sent. Optional, defaults to null.
 * @param {Meta} [meta] - Additional metadata like pagination information. Optional.
 *
 * @returns {Response} Formatted JSON Response object.
 */
export const sendSuccess = <T>(
    c: Context,
    statusCode: ContentfulStatusCode,
    message: string,
    data: T | null = null,
    meta?: Meta
) => {
    const responseBody: {
        success: boolean;
        message: string;
        data: T | null;
        meta?: Meta;
    } = {
        success: true,
        message,
        data,
    };

    if (meta) {
        responseBody.meta = meta;
    }

    return c.json(responseBody, statusCode);
};

/*
 * ===================================================================================
 * USAGE EXAMPLES IN CONTROLLERS
 * ===================================================================================
 *
 * Assume we have a controller `product.controller.ts`.
 *
 * import { Context } from 'hono';
 * import { sendSuccess } from '@/utils/base-response';
 * import { ProductService } from '@/services/product.service';
 *
 * export class ProductController {
 * private productService = new ProductService();
 *
 * // Example 1: Getting a single item (e.g., product details)
 * public getProductById = async (c: Context) => {
 * const { id } = c.req.param();
 * const product = await this.productService.findById(id);
 * // 'product' is an object
 * return sendSuccess(c, 200, 'Product details fetched successfully', product);
 * };
 *
 * // Example 2: Getting a list of items (e.g., all products)
 * public getAllProducts = async (c: Context) => {
 * const products = await this.productService.findAll();
 * // 'products' is an array of objects
 * return sendSuccess(c, 200, 'All products fetched successfully', products);
 * };
 *
 * // Example 3: Getting a list of items with PAGINATION
 * public getProductsWithPagination = async (c: Context) => {
 * const page = c.req.query('page') || 1;
 * const limit = c.req.query('limit') || 10;
 * const { data, meta } = await this.productService.findWithPagination(page, limit);
 *
 * // 'data' is an array of products for the current page
 * // 'meta' is an object containing pagination info { totalItems, totalPages, currentPage }
 * return sendSuccess(c, 200, 'Products fetched successfully', data, meta);
 * };
 *
 * // Example 4: Response without data (e.g., after successfully deleting an item)
 * public deleteProduct = async (c: Context) => {
 * const { id } = c.req.param();
 * await this.productService.deleteById(id);
 *
 * // 'data' parameter is not filled (or filled with null), as no data needs to be returned.
 * return sendSuccess(c, 200, 'Product deleted successfully');
 * };
 *
 * // Example 5: Creating a new item (using 201 Created status)
 * public createProduct = async (c: Context) => {
 * const body = await c.req.json();
 * const newProduct = await this.productService.create(body);
 *
 * // Return the newly created item data with 201 status.
 * return sendSuccess(c, 201, 'Product created successfully', newProduct);
 * };
 * }
 */