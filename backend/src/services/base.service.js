/**
 * Base Supabase service.
 *
 * Provides a thin, reusable data-access layer over Supabase's JS client.
 * Domain services (product.service, order.service, etc.) will extend or
 * consume this to keep database interaction patterns consistent.
 *
 * Two clients are available:
 *   - supabase     (anon key) — respects RLS, used with user JWTs
 *   - supabaseAdmin (service role) — bypasses RLS, server-side only
 */

import { supabase, supabaseAdmin } from '../config/supabase.js';
import AppError from '../utils/AppError.js';
import { HTTP } from '../constants/index.js';
import logger from '../utils/logger.js';

class BaseService {
  /**
   * @param {string} tableName - The Supabase table this service operates on.
   */
  constructor(tableName) {
    this.tableName = tableName;
    this.client = supabaseAdmin; // default to admin for server-side ops
  }

  // ── Read operations ────────────────────────────────────────────────

  /**
   * Find a single row by ID.
   * @param {string} id - UUID primary key.
   * @param {string} [select='*'] - Columns to return.
   * @returns {Promise<object>}
   */
  async findById(id, select = '*') {
    const { data, error } = await this.client
      .from(this.tableName)
      .select(select)
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Row not found
        throw new AppError(
          `${this.tableName} not found.`,
          HTTP.NOT_FOUND,
        );
      }
      logger.error(`BaseService.findById [${this.tableName}]`, { id, error: error.message });
      throw new AppError('A database error occurred.', HTTP.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Find multiple rows with optional filters, pagination, and sorting.
   * @param {object} options
   * @param {string} [options.select='*']
   * @param {object} [options.filters={}] - { column: value } equality filters.
   * @param {number} [options.page=1]
   * @param {number} [options.limit=20]
   * @param {string} [options.sortBy='created_at']
   * @param {string} [options.sortOrder='desc']
   * @returns {Promise<{ data: object[], count: number }>}
   */
  async findMany({
    select = '*',
    filters = {},
    page = 1,
    limit = 20,
    sortBy = 'created_at',
    sortOrder = 'desc',
  } = {}) {
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = this.client
      .from(this.tableName)
      .select(select, { count: 'exact' });

    // Apply equality filters
    for (const [column, value] of Object.entries(filters)) {
      if (value !== undefined && value !== null) {
        query = query.eq(column, value);
      }
    }

    query = query
      .order(sortBy, { ascending: sortOrder === 'asc' })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      logger.error(`BaseService.findMany [${this.tableName}]`, { error: error.message });
      throw new AppError('A database error occurred.', HTTP.INTERNAL_SERVER_ERROR);
    }

    return { data: data || [], count: count || 0 };
  }

  // ── Write operations ───────────────────────────────────────────────

  /**
   * Insert a new row.
   * @param {object} payload - Column/value pairs.
   * @returns {Promise<object>} The created row.
   */
  async create(payload) {
    const { data, error } = await this.client
      .from(this.tableName)
      .insert(payload)
      .select()
      .single();

    if (error) {
      logger.error(`BaseService.create [${this.tableName}]`, { error: error.message });

      // Handle unique-constraint violations
      if (error.code === '23505') {
        throw new AppError('A record with that value already exists.', HTTP.CONFLICT);
      }
      throw new AppError('A database error occurred.', HTTP.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Update a row by ID.
   * @param {string} id - UUID primary key.
   * @param {object} payload - Column/value pairs to update.
   * @returns {Promise<object>} The updated row.
   */
  async updateById(id, payload) {
    const { data, error } = await this.client
      .from(this.tableName)
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        throw new AppError(`${this.tableName} not found.`, HTTP.NOT_FOUND);
      }
      logger.error(`BaseService.updateById [${this.tableName}]`, { id, error: error.message });
      throw new AppError('A database error occurred.', HTTP.INTERNAL_SERVER_ERROR);
    }

    return data;
  }

  /**
   * Delete a row by ID.
   * @param {string} id - UUID primary key.
   * @returns {Promise<void>}
   */
  async deleteById(id) {
    const { error } = await this.client
      .from(this.tableName)
      .delete()
      .eq('id', id);

    if (error) {
      logger.error(`BaseService.deleteById [${this.tableName}]`, { id, error: error.message });
      throw new AppError('A database error occurred.', HTTP.INTERNAL_SERVER_ERROR);
    }
  }
}

export default BaseService;
