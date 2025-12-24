const nodemailer = require('nodemailer');
const { EMAIL_USER, EMAIL_PASS } = require('../config/env');

// Create reusable transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
});

/**
 * Send an email
 * @param {string} to - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Plain text body
 * @param {string} html - HTML body
 */
const sendEmail = async (to, subject, text, html) => {
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.log('===========================================================');
    console.log(`[MOCK EMAIL] To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text}`);
    console.log('Use EMAIL_USER and EMAIL_PASS env vars to enable real sending.');
    console.log('===========================================================');
    return;
  }

  try {
    await transporter.sendMail({
      from: '"SlideQuick" <noreply@slidequick.com>',
      to,
      subject,
      text,
      html,
    });
    console.log(`[Email Service] Sent email to ${to}`);
  } catch (error) {
    console.error(`[Email Service] Failed to send email to ${to}:`, error);
  }
};

/**
 * Send welcome email to new user
 * @param {string} to - User's email
 * @param {string} username - User's name
 */
const sendWelcomeEmail = async (to, username) => {
  const subject = 'SlideQuickへようこそ！';
  const text = `
    ${username} 様,

    SlideQuickにご登録いただきありがとうございます！
    私たちは、あなたが素晴らしいプレゼンテーションを作成するのを楽しみにしています。

    何かご質問があれば、お気軽にお問い合わせください。
    
    SlideQuickチーム
  `;
  const html = `
    <h2>${username} 様,</h2>
    <p>SlideQuickにご登録いただきありがとうございます！</p>
    <p>私たちは、あなたが素晴らしいプレゼンテーションを作成するのを楽しみにしています。</p>
    <br>
    <p>何かご質問があれば、お気軽にお問い合わせください。</p>
    <p>SlideQuickチーム</p>
  `;

  await sendEmail(to, subject, text, html);
};

/**
 * Send password reset email
 * @param {string} to - User's email
 * @param {string} resetLink - Password reset link
 */
const sendResetPasswordEmail = async (to, resetLink) => {
  const subject = 'SlideQuick パスワードリセット';
  const text = `以下のリンクをクリックしてパスワードをリセットしてください:\n\n${resetLink}\n\nこのリンクは1時間有効です。`;
  const html = `<p>以下のリンクをクリックしてパスワードをリセットしてください:</p><p><a href="${resetLink}">${resetLink}</a></p><p>このリンクは1時間有効です。</p>`;

  await sendEmail(to, subject, text, html);
};

module.exports = {
  sendWelcomeEmail,
  sendResetPasswordEmail,
};
