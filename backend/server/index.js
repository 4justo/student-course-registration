import app from './app.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const port = config.port;

app.listen(port, '0.0.0.0', () => {
  logger.info(`Server is running on port ${port}`);
});
