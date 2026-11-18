import app from './app.js';
import env from './config/env.js';
import logger from './utils/logger.js';

const PORT = env.PORT;

app.listen(PORT, () => {
  logger.info(`Backend server running on http://localhost:${PORT}`);
  logger.info(`Environment: ${env.NODE_ENV}`);
});
