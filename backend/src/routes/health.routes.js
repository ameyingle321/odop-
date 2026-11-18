import { Router } from 'express';
import { supabaseAdmin } from '../config/supabase.js';

const router = Router();

/**
 * GET /api/health
 * Health check endpoint.
 * Returns server status, database connectivity, and current timestamp.
 */
router.get('/health', async (req, res) => {
  let dbStatus = 'unknown';

  try {
    const { error } = await supabaseAdmin.from('districts').select('id').limit(1);
    dbStatus = error ? 'error' : 'connected';
  } catch {
    dbStatus = 'unreachable';
  }

  res.status(200).json({
    success: true,
    data: {
      status: 'ok',
      database: dbStatus,
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || 'development',
    },
  });
});

export default router;
