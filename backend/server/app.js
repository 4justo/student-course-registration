import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import authRouter from '../routes/auth.route.js';
import { securityMiddleware } from '../middleware/security.middleware.js';
import { errorHandler } from '../middleware/error.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Resolve swagger YAML path: prefer backend/docs, fall back to project-level docs/
let swaggerPath = path.join(__dirname, '../docs/swagger.yaml');
if (!fs.existsSync(swaggerPath)) {
  swaggerPath = path.join(__dirname, '../../docs/swagger.yaml');
}
const swaggerDocument = yaml.load(fs.readFileSync(swaggerPath, 'utf8'));

const app = express();

app.use(helmet());
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan('dev'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 120 }));
app.use(securityMiddleware);

app.use('/api/auth', authRouter);
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.get('/health', (_req, res) => res.json({ status: 'ok' }));

app.use(errorHandler);

export default app;
