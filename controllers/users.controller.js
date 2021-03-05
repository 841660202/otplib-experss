'use strict';

const db = require('../db');
const { createOTP, verifyOTP } = require('../lib/otplib');
const { createQRCode } = require('../lib/qrcode');
const { sendMail } = require('../lib/mailer');
const { createUser, createUserOTP, loginUser, getUserOTP } = require('../services/users.service');

module.exports = {
  async createUser(req, res, next) {
    try {
      const { id, password, name } = req.body;

      const { secretKey, otpURI } = await createOTP(id);
      const pngFile = await createQRCode(id, otpURI);

      // 开始事务
      await db.query('BEGIN');

      try {
        await createUser(id, password, name);
        await createUserOTP(id, secretKey);
        await sendMail(id, pngFile);

        // 如果一切顺利，则提交事务
        await db.query('COMMIT');
        res.sendStatus(201); // 201 Created
      } catch (error) {
        // 如果在事务中出现错误，则回滚
        console.log('Transaction Error:', error);
        await db.query('ROLLBACK');
        next(error); // 将错误传递给错误处理中间件
      }
    } catch (error) {
      // 如果在事务之外出现错误（如 createOTP 或 createQRCode），则这里捕获
      console.log('Outer Error:', error);
      next(error); // 将错误传递给错误处理中间件
    }
  },
  async loginUser(req, res, next) {
    try {
      const { id, password, otp } = req.body;
      console.log('req.body', req.body);
      const user = await loginUser(id, password);
      if (!user) throw new Error(401, 'Not Found User');

      const userOTP = await getUserOTP(id);
      if (!userOTP) throw new Error(401, 'Not Found User OTP');
      console.log('userOTP.secretKey', userOTP.secretKey);
      const otpVerify = await verifyOTP(otp, userOTP.secretKey);
      if (!otpVerify) throw new Error(403, 'OTP Verification failure');

      res.sendStatus(200);
    } catch (error) {
      next(error);
    }
  },
};
