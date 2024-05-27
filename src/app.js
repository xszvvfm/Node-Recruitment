import express from 'express';
import dotenv from 'dotenv';
import { errorHandler } from './middlewares/error-handler.middleware';
import { prisma } from './utils/prisma.util';
dotenv.config();

const app = express();
const PORT = process.env.SERVER_PORT;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(PORT, '포트로 서버가 열렸어요!');
});
