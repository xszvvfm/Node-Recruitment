import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.util.js';
import dotenv from 'dotenv';

dotenv.config();

export default async function (req, res, next) {
  try {
    const { authorization } = req.cookies;

    if (!authorization) throw new Error('인증 정보가 없습니다.');

    const [tokenType, token] = authorization.split(' ');
    if (tokenType !== 'Bearer') throw new Error('지원하지 않는 인증 방식입니다.');

    const decodedToken = jwt.verify(token, process.env.ACCESSTOKEN_SECRET_KEY);
    const user_id = decodedToken.user_id;

    const user = await prisma.user.findFirst({
      where: { user_id: +user_id },
    });
    if (!user) {
      res.clearCookie('authorization');
      throw new Error('인증 정보와 일치하는 사용자가 없습니다.');
    }

    req.user = user;

    next();
  } catch (error) {
    res.clearCookie('authorization');

    switch (error.name) {
      case 'TokenExpiredError':
        return res.status(401).json({ message: '인증 정보가 만료되었습니다.' });
      case 'JsonWebTokenError':
        return res.status(401).json({ message: '인증 정보가 유효하지 않습니다.' });
      default:
        return res.status(401).json({ message: error.message ?? '비정상적인 요청입니다.' });
    }
  }
}
