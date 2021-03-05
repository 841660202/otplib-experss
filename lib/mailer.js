'use strict';

const path = require('path');
const config = require('config');
const nodemailer = require('nodemailer');

const _transporter = nodemailer.createTransport({
  service: config.get('mailer.service'),
  auth: {
    user: config.get('mailer.auth.user'),
    pass: config.get('mailer.auth.pass'),
  },
});

/**
 * @method sendMail
 * @description send user OTP QR code mail
 */
exports.sendMail = async (id, pngFile) => {
  return new Promise((resolve, reject) => {
    _transporter.sendMail(
      {
        from: {
          name: config.get('mailer.from.name'),
          address: config.get('mailer.from.address'),
        },
        to: {
          address: id,
        },
        subject: 'OTP Secret Reissued',
        html: `
                <html>
                    <img src="cid:myqrcode@nodemailer.com"/>
                    please scan QR code to get OTP secret
                </html>`,
        attachments: [
          {
            filename: path.parse(pngFile).base,
            path: path.resolve(pngFile),
            cid: 'myqrcode@nodemailer.com',
          },
        ],
      },
      (err, info) => {
        if (err) {
          reject(err);
        } else {
          resolve(info);
        }
      }
    );
  });
};
