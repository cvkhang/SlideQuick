// src/controllers/authController.js
const jwt = require('jsonwebtoken');
const emailService = require('../services/emailService');
const userService = require('../services/userService');
const { JWT_SECRET } = require('../config/env');

/**
 * Register new user
 */
async function register(req, res) {
  try {
    const { username, email, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'username と password は必須です' });
    }

    // Create user
    const user = userService.createUser({ username, email, password });

    // Send welcome email if email provided
    if (user.email) {
      await emailService.sendWelcomeEmail(user.email, user.username);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.created_at,
      },
      token,
    });
  } catch (error) {
    console.error('ユーザー作成エラー:', error);

    if (error.message === 'USER_EXISTS') {
      return res.status(409).json({ error: 'そのユーザー名は既に使用されています' });
    }

    res.status(500).json({ error: 'ユーザーの作成に失敗しました' });
  }
}

/**
 * Forgot password
 */
async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'メールアドレスは必須です' });
    }

    const user = userService.getUserByEmail(email);
    // Even if user not found, return 200 to prevent enumeration, but log it
    if (!user) {
      console.log(`[Forgot Password] User not found for email: ${email}`);
      return res.json({ message: 'メールアドレスが存在する場合、リセット手順を送信しました。' });
    }

    // Generate reset token
    const token = jwt.sign(
      { id: user.id, type: 'reset' },
      JWT_SECRET,
      { expiresIn: '1h' }
    );

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    // Send reset email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      await emailService.sendResetPasswordEmail(email, resetLink);
    } else {
      // Mock sending via service (if needed, or service handles it internally)
      await emailService.sendResetPasswordEmail(email, resetLink);
    }

    res.json({ message: 'メールアドレスが存在する場合、リセット手順を送信しました。' });
  } catch (error) {
    console.error('パスワードリセットエラー:', error);
    // Return a generic error to the client, but log the real one
    res.status(500).json({ error: '処理に失敗しました: ' + (error.message || 'Internal Server Error') });
  }
}

/**
 * Reset password
 */
async function resetPassword(req, res) {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'トークンと新しいパスワードが必要です' });
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.type !== 'reset') {
      return res.status(400).json({ error: '無効なトークンです' });
    }

    // Update password
    userService.updatePassword(decoded.id, newPassword);

    res.json({ message: 'パスワードが正常にリセットされました' });
  } catch (error) {
    console.error('パスワードリセット実行エラー:', error);
    if (error.name === 'TokenExpiredError') {
      return res.status(400).json({ error: 'トークンの有効期限が切れています' });
    }
    res.status(500).json({ error: 'パスワードのリセットに失敗しました' });
  }
}

/**
 * Login user
 */
async function login(req, res) {
  try {
    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({ error: 'username と password は必須です' });
    }

    // Verify credentials
    const user = userService.verifyUser(username, password);

    if (!user) {
      return res.status(401).json({ error: '認証に失敗しました' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        createdAt: user.createdAt,
      },
      token,
    });
  } catch (error) {
    console.error('ログインエラー:', error);
    res.status(500).json({ error: 'ログインに失敗しました' });
  }
}

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
};
