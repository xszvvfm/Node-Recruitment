import express from 'express';
import { prisma } from '../utils/prisma.util.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = express.Router();

/*** 회원가입 ***/
router.post('/sign-up', async (req, res, next) => {
  try {
    // 1. 요청 : 이메일, 비밀번호, 비밀번호 확인, 이름 => req.body
    const { email, password, passwordConfirm, name } = req.body;

    // 2. 유효성 검증 및 에러 처리
    // 2-1. 회원 정보 중 하나라도 빠진 경우
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해 주세요.' });
    } else if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해 주세요.' });
    } else if (!passwordConfirm) {
      return res.status(400).json({ message: '비밀번호 확인을 입력해 주세요.' });
    } else if (!name) {
      return res.status(400).json({ message: '이름을 입력해 주세요.' });
    }
    // 2-2. 이메일 형식에 맞지 않는 경우
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isValidEmail.test(email)) {
      return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' });
    }
    // 2-3. 이메일이 중복되는 경우
    const isExistEmail = await prisma.user.findFirst({
      where: { email },
    });
    if (isExistEmail) {
      return res.status(409).json({ message: '이미 가입된 사용자입니다.' });
    }
    // 2-4. 비밀번호가 6자리 미만인 경우
    if (password.length < 6) {
      return res.status(400).json({ message: '비밀번호는 6자리 이상이어야 합니다.' });
    }
    // 2-5. 비밀번호와 비밀번호 확인이 일치하지 않는 경우
    if (password !== passwordConfirm) {
      return res.status(400).json({ message: '입력한 두 비밀번호가 일치하지 않습니다.' });
    }

    // 3. 비즈니스 로직(데이터 처리)
    // 3-1. 비밀번호는 Hash 된 값을 저장
    const hashedPassword = await bcrypt.hash(password, 10);
    // 3-2. 사용자 ID, 역할, 생성일시, 수정일시는 자동 생성 / 데이터 저장
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    const user_info = await prisma.user_info.create({
      data: {
        user_id: user.user_id,
        email,
        name,
      },
    });

    // 4. 반환 : 사용자 ID, 이메일, 이름, 역할, 생성일시, 수정일시
    return res.status(201).json({ message: '회원가입이 완료되었습니다.', data: user_info });
  } catch (err) {
    next(err);
  }
});

/*** 로그인 ***/
router.post('/sign-in', async (req, res, next) => {
  try {
    // 1. 요청 : 이메일, 비밀번호 => req.body
    const { email, password } = req.body;

    // 2. 유효성 검증 및 에러 처리
    // 2-1. 로그인 정보 중 하나라도 빠진 경우
    if (!email) {
      return res.status(400).json({ message: '이메일을 입력해 주세요.' });
    } else if (!password) {
      return res.status(400).json({ message: '비밀번호를 입력해 주세요.' });
    }
    // 2-2. 이메일 형식에 맞지 않는 경우
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isValidEmail.test(email)) {
      return res.status(400).json({ message: '이메일 형식이 올바르지 않습니다.' });
    }
    // 2-3. 이메일로 조회되지 않거나 비밀번호가 일치하지 않는 경우
    const user = await prisma.user.findFirst({
      where: { email },
    });
    if (!user) {
      return res.status(404).json({ message: '회원 정보가 조회되지 않습니다.' });
    }
    if (!(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ message: '비밀번호가 일치하지 않습니다.' });
    }

    // 3. 비즈니스 로직(데이터 처리) : AccessToken(Payload에 사용자 ID 포함, 유효기한 12시간) 생성
    const accesstoken = jwt.sign({ user_id: user.user_id }, process.env.ACCESSTOKEN_SECRET_KEY, { expiresIn: '12h' });
    res.cookie('authorization', `Bearer ${accesstoken}`);

    // 4. 반환 : AccessToken
    return res.status(200).json({
      message: '로그인에 성공했습니다.',
    });
  } catch (err) {
    next(err);
  }
});

export default router;
