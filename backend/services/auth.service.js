import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config/index.js';
import authRepository from '../repositories/auth.repository.js';
import { loginSchema } from '../validators/auth.validator.js';

const AuthService = {
  async login(payload) {
    const data = loginSchema.parse(payload);

    const student = await authRepository.findStudentByRegistration(data.registrationNumber);
    if (!student) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const isPasswordValid = await bcrypt.compare(data.password, student.passwordHash);
    if (!isPasswordValid) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const accessToken = jwt.sign({ sub: student.id, role: student.role.name }, config.jwtAccessSecret, {
      expiresIn: config.accessTokenExpiry,
    });
    const refreshToken = jwt.sign({ sub: student.id }, config.jwtRefreshSecret, {
      expiresIn: config.refreshTokenExpiry,
    });

    return {
      accessToken,
      refreshToken,
      profile: {
        id: student.id,
        registrationNumber: student.registrationNumber,
        email: student.email,
        firstName: student.firstName,
        lastName: student.lastName,
      },
    };
  },

  async logout(refreshToken) {
    if (!refreshToken) {
      return;
    }
    await authRepository.revokeRefreshToken(refreshToken);
  },

  async refreshToken(refreshToken) {
    const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    const session = await authRepository.findSessionByToken(refreshToken);
    if (!session || session.expiresAt < new Date()) {
      const error = new Error('Invalid refresh token');
      error.status = 401;
      throw error;
    }

    const accessToken = jwt.sign({ sub: decoded.sub }, config.jwtAccessSecret, {
      expiresIn: config.accessTokenExpiry,
    });
    const newRefreshToken = jwt.sign({ sub: decoded.sub }, config.jwtRefreshSecret, {
      expiresIn: config.refreshTokenExpiry,
    });

    await authRepository.rotateRefreshToken(session.id, newRefreshToken);

    return { accessToken: accessToken, refreshToken: newRefreshToken };
  },

  async forgotPassword(_payload) {
    // TODO: implement email reset flow
  },

  async resetPassword(_payload) {
    // TODO: implement password reset flow
  },

  async getProfile(user) {
    if (!user) {
      const error = new Error('Unauthorized');
      error.status = 401;
      throw error;
    }
    return authRepository.getStudentProfile(user.sub);
  },
};

export default AuthService;
