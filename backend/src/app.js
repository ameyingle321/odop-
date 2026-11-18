import express from 'express';
import cors from 'cors';
import env from './config/env.js';
import healthRouter from './routes/health.routes.js';
import authRouter from './routes/auth.routes.js';
import sellerRouter from './routes/seller.routes.js';
import productRouter from './routes/product.routes.js';
import districtRouter from './routes/district.routes.js';
import categoryRouter from './routes/category.routes.js';
import cartRouter from './routes/cart.routes.js';
import orderRouter from './routes/order.routes.js';
import paymentRouter from './routes/payment.routes.js';
import reviewRouter from './routes/review.routes.js';
import errorMiddleware from './middleware/error.middleware.js';
import logger from './utils/logger.js';

const app = express();

// --- Core Middleware ---
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Request Logger ---
app.use((req, _res, next) => {
  logger.debug(`${req.method} ${req.originalUrl}`);
  next();
});

// --- Routes ---
app.use('/api', healthRouter);
app.use('/api', authRouter);
app.use('/api', sellerRouter);
app.use('/api', productRouter);
app.use('/api', districtRouter);
app.use('/api', categoryRouter);
app.use('/api', cartRouter);
app.use('/api', orderRouter);
app.use('/api', paymentRouter);
app.use('/api', reviewRouter);

// --- Central Error Handler ---
app.use(errorMiddleware);

// --- 404 Handler ---
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

export default app;
