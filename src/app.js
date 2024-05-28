import express from 'express';
import dotenv from 'dotenv';
import cookieParser from 'cookie-parser';
import { errorHandler } from './middlewares/error-handler.middleware.js';
import userRouter from './routers/users.router.js';
import resumeRouter from './routers/resume.router.js';
// import { prisma } from './utils/prisma.util.js';
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

app.use(express.json());

app.use(cookieParser);
app.use('/api', [userRouter, resumeRouter]);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
