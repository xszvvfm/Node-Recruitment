import express from 'express';
import dotenv from 'dotenv';
import { prisma } from '../utils/prisma.util.js';
import authMiddleware from '../middlewares/auth.middleware.js';

dotenv.config();
const router = express.Router();

/*** 이력서 생성 ***/
router.post('/resume', authMiddleware, async (req, res, next) => {
  try {
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
  } catch (err) {
    next(err);
  }
});

/*** 이력서 목록 조회 ***/
router.get('/resume', authMiddleware, async (req, res, next) => {
  try {
    // 1. 요청 : 사용자 정보 => req.user / 정렬 조건 => req.query
    // 생성일시 기준 정렬은 과거순(ASC), 최신순(DESC)으로 전달. 값이 없는 경우 최신순(DESC) 정렬을 기본. 대소문자 구분 없이
    const { user_id } = req.user;
    const { sort } = req.query;

    // 3. 비즈니스 로직(데이터 처리)
    // 현재 로그인 한 사용자가 작성한 이력서 목록만 조회
    // DB에서 이력서 조회 시 작성자 ID가 일치
    // 정렬 조건에 따라 다른 결과 값을 조회
    // 작성자 ID가 아닌 작성자 이름을 반환하기 위해 스키마에 정의 한 Relation을 활용해 조회
    const resumes = await prisma.resume.findMany({
      select: {
        resume_id: true,
        user: {
          select: {
            user_info: {
              select: {
                name: true,
              },
              where: {
                user_id: +user_id,
              },
            },
          },
        },
        title: true,
        content: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: {
        created_at: sort ? sort.toLowerCase() : 'desc',
      },
    });

    // 2. 유효성 검증 및 에러 처리
    // 일치하는 값이 없는 경우 - 빈 배열([]) 반환
    if (!resumes) {
      return res.status(200).json({ message: '[ ]' });
    }

    // 4. 반환 : 이력서 ID, 작성자 이름, 제목, 자기소개, 지원 상태, 생성일시, 수정일시
    return res.status(200).json({ message: '이력서 목록 조회가 완료되었습니다.', data: resumes });
  } catch (err) {
    next(err);
  }
});

/*** 이력서 상세 조회 ***/
router.get('/resume/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 요청 : 사용자 정보 => req.user / 이력서 ID => req.params
    const { user_id } = req.user;
    const { resume_id } = req.params;

    // 3. 비즈니스 로직(데이터 처리)
    // 현재 로그인 한 사용자가 작성한 이력서 목록만 조회
    // DB에서 이력서 조회 시 이력서 ID, 작성자 ID가 모두 일치
    // 작성자 ID가 아닌 작성자 이름을 반환하기 위해 스키마에 정의 한 Relation을 활용해 조회
    const resume = await prisma.resume.findFirst({
      select: {
        resume_id: true,
        user: {
          select: {
            user_info: {
              select: {
                name: true,
              },
              where: {
                user_id: +user_id,
              },
            },
          },
        },
        title: true,
        content: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
      where: {
        user_id: +user_id,
        resume_id: +resume_id,
      },
    });

    // 2. 유효성 검증 및 에러 처리
    // 이력서 정보가 없는 경우
    if (!resume) {
      return res.status(404).json({ message: '이력서가 존재하지 않습니다.' });
    }

    // 4. 반환 : 이력서 ID, 작성자 이름, 제목, 자기소개, 지원 상태, 생성일시, 수정일시
    return res.status(200).json({ message: '이력서 상세 조회가 완료되었습니다', data: resume });
  } catch (err) {
    next(err);
  }
});

/*** 이력서 수정 ***/
router.patch('/resume/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 요청 : 사용자 정보 => req.user / 이력서 ID => req.params / 제목, 자기소개 => req.body
    const { user_id } = req.user;
    const { resume_id } = req.params;
    const { title, content } = req.body;

    // 3. 비즈니스 로직(데이터 처리)
    // DB에서 이력서 조회 시 이력서 ID, 작성자 ID가 모두 일치
    const resume = await prisma.resume.findFirst({
      where: {
        user_id: +user_id,
        resume_id: +resume_id,
      },
    });

    // 2. 유효성 검증 및 에러 처리
    // 2-1. 제목, 자기소개 둘 다 없는 경우
    if (!title && !content) {
      return res.status(400).json({ message: '수정할 정보를 입력해 주세요.' });
    }
    // 2-2. 이력서 정보가 없는 경우
    if (!resume) {
      return res.status(404).json({ message: '이력서가 존재하지 않습니다.' });
    }

    // 3. 비즈니스 로직(데이터 처리)
    // DB에서 이력서 정보를 수정
    // 제목, 자기소개는 개별 수정 가능
    const fixResume = await prisma.resume.update({
      data: {
        title,
        content,
      },
      where: {
        user_id: +user_id,
        resume_id: +resume_id,
      },
      select: {
        resume_id: true,
        user_id: true,
        title: true,
        content: true,
        status: true,
        created_at: true,
        updated_at: true,
      },
    });

    // 4. 반환 : 수정된 이력서 ID, 작성자 ID, 제목, 자기소개, 지원 상태, 생성일시, 수정일시
    return res.status(200).json({ message: '이력서 수정이 완료되었습니다.', data: fixResume });
  } catch (err) {
    next(err);
  }
});

/*** 이력서 삭제 ***/
router.delete('/resume/:resumeId', authMiddleware, async (req, res, next) => {
  try {
    // 1. 요청 : 사용자 정보 => req.user / 이력서 ID => req.params
    const { user_id } = req.user;
    const { resume_id } = req.params;

    // 3. 비즈니스 로직(데이터 처리)
    // DB에서 이력서 조회 시 이력서 ID, 작성자 ID가 모두 일치
    const resume = await prisma.resume.findFirst({
      where: {
        user_id: +user_id,
        resume_id: +resume_id,
      },
    });

    // 2. 유효성 검증 및 에러 처리
    // 이력서 정보가 없는 경우
    if (!resume) {
      return res.status(404).json({ message: '이력서가 존재하지 않습니다.' });
    }

    // 3. 비즈니스 로직(데이터 처리)
    // DB에서 이력서 정보를 삭제
    const deleteResume = await prisma.resume.delete({
      where: {
        user_id: +user_id,
        resume_id: +resume_id,
      },
    });

    // 4. 반환 : 삭제 된 이력서 ID를 반환
    return res.status(200).json({ message: '이력서 삭제가 완료되었습니다.', data: deleteResume });
  } catch (err) {
    next(err);
  }
});

export default router;
