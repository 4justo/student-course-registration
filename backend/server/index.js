import app from './app.js';
import config from '../config/index.js';
import logger from '../utils/logger.js';

const port = config.port;

app.listen(port, () => {
  logger.info(`Server is running on http://localhost:${port}`);
});
