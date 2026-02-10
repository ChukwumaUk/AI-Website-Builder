import express, { Request, Response } from 'express';
import 'dotenv/config';
import cors from "cors";
import { toNodeHandler } from 'better-auth/node';
import { auth } from './lib/auth.js';
import userRouter from './routes/userRoutes.js';
import projectRouter from './routes/projectRoutes.js';
import { paystackWebhook } from './controllers/paystackWebhook.js';

const app = express();
const port = 3000;

const corsOptions = {
  origin: process.env.TRUSTED_ORIGINS?.split(',') || [],
  credentials: true,
};

app.use(cors(corsOptions));

/**
 * Paystack webhook — MUST come before global body parser
 */
app.post(
  "/api/paystack/webhook",
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf; // ✅ keep as Buffer
    },
  }),
  paystackWebhook
);

/**
 * Global body parser for normal routes
 */
app.use(express.json({ limit: '50mb' }));

app.all('/api/auth/{*any}', toNodeHandler(auth));

app.get('/', (req: Request, res: Response) => {
  res.send('Server is Live!');
});

app.use('/api/user', userRouter);
app.use('/api/project', projectRouter);

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
