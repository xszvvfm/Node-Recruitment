import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../utils/prisma.util.js';
import authMiddleware from '../middlewares/auth.middleware.js';

dotenv.config();
const router = express.Router();

/*** 이력서 생성 ***/
router.post('/resume', authMiddleware, async (req, res, next) => {
  // 1. 요청 : 사용자 정보 => req.user / 제목, 자기소개 => req.body
  const { user_id } = req.user;
  const { title, content } = req.body;

  // 2. 유효성 검증 및 에러 처리
  // 제목, 자기소개 중 하나라도 빠진 경우 / 자기소개 글자 수가 150자 보다 짧은 경우
  if (!title) {
    return res.status(400).json({ message: '제목을 입력해 주세요.' });
  } else if (!content) {
    return res.status(400).json({ message: '자기소개를 입력해 주세요.' });
  } else if (content.length < 150) {
    return res.status(400).json({ message: '자기소개는 150자 이상 작성해야 합니다.' });
  }

  // 3. 비즈니스 로직(데이터 처리)
  // 이력서 ID, 지원 상태, 생성일시, 수정일시는 자동 생성 / 데이터 저장
  const resume = await prisma.resume.create({
    data: {
      user_id: +user_id,
      title,
      content,
    },
  });

  // 4. 반환 : 이력서 ID, 작성자 ID, 제목, 자기소개, 지원 상태, 생성일시, 수정일시
  return res.status(201).json({ message: '이력서 생성이 완료되었습니다.', data: resume });
});

export default router;
