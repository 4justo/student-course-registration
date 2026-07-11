import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config/index.js';
import authRepository from '../repositories/auth.repository.js';
import {
  loginSchema,
  registerSchema
} from '../validators/auth.validator.js';

const AuthService = {
  async register(payload) {
    const data = registerSchema.parse(payload);

    const existingRegistration =
      await authRepository.findStudentByRegistration(
        data.registrationNumber
      );

    if (existingRegistration) {
      const error = new Error('Registration number already exists');
      error.status = 409;
      throw error;
    }

    const existingEmail =
      await authRepository.findStudentByEmail(
        data.email
      );

    if (existingEmail) {
      const error = new Error('Email already exists');
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 10);

    const student =
      await authRepository.createStudent({
        ...data,
        passwordHash
      });

    const accessToken = jwt.sign(
      {
        sub: student.id,
        role: student.role.name
      },
      config.jwtAccessSecret,
      {
        expiresIn: config.accessTokenExpiry
      }
    );

    const refreshToken = jwt.sign(
      {
        sub: student.id
      },
      config.jwtRefreshSecret,
      {
        expiresIn: config.refreshTokenExpiry
      }
    );

    await authRepository.createSession(
      student.id,
      refreshToken
    );

    return {
      accessToken,
      refreshToken,
      profile: student
    };
  },

  async login(payload) {
    const data = loginSchema.parse(payload);

    const student =
      await authRepository.findStudentByRegistration(
        data.registrationNumber
      );

    if (!student) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const valid =
      await bcrypt.compare(
        data.password,
        student.passwordHash
      );

    if (!valid) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const accessToken = jwt.sign(
      {
        sub: student.id,
        role: student.role.name
      },
      config.jwtAccessSecret,
      {
        expiresIn: config.accessTokenExpiry
      }
    );

    const refreshToken = jwt.sign(
      {
        sub: student.id
      },
      config.jwtRefreshSecret,
      {
        expiresIn: config.refreshTokenExpiry
      }
    );

    await authRepository.createSession(
      student.id,
      refreshToken
    );

    return {
      accessToken,
      refreshToken,
      profile: student
    };
  },

  async logout(refreshToken) {
    if (!refreshToken) return;

    await authRepository.revokeRefreshToken(refreshToken);
  },

  async refreshToken(refreshToken) {
    const decoded = jwt.verify(
      refreshToken,
      config.jwtRefreshSecret
    );

    const session =
      await authRepository.findSessionByToken(
        refreshToken
      );

    if (!session) {
      const error = new Error('Invalid refresh token');
      error.status = 401;
      throw error;
    }

    const accessToken = jwt.sign(
      {
        sub: decoded.sub
      },
      config.jwtAccessSecret,
      {
        expiresIn: config.accessTokenExpiry
      }
    );

    return {
      accessToken,
      refreshToken
    };
  },

  async forgotPassword() {
    return;
  },

  async resetPassword() {
    return;
  },

  async getProfile(user) {
    return authRepository.getStudentProfile(user.sub);
  }
};

export default AuthService;
