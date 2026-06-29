const logger = {
  info(message) {
    // eslint-disable-next-line no-console
    console.log(`[INFO] ${message}`);
  },
  warn(message) {
    // eslint-disable-next-line no-console
    console.warn(`[WARN] ${message}`);
  },
  error(message) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] ${message}`);
  },
};

export default logger;
