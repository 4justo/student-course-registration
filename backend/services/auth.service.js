import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import config from '../config/index.js';
import authRepository from '../repositories/auth.repository.js';
import { loginSchema, registerSchema, registerAdminSchema } from '../validators/auth.validator.js';

function toPublicUser(user) {
  return {
    id: user.id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    gender: user.gender || null,
  };
}

function toPublicStudent(student) {
  if (!student) return null;
  return {
    id: student.id.toString(),
    user_id: student.user_id.toString(),
    reg_no: student.reg_no,
  };
}

function issueTokens(user) {
  const payload = { sub: user.id.toString(), role: user.role };
  const accessToken = jwt.sign(payload, config.jwtAccessSecret, {
    expiresIn: config.accessTokenExpiry,
  });
  const refreshToken = jwt.sign(payload, config.jwtRefreshSecret, {
    expiresIn: config.refreshTokenExpiry,
  });
  return { accessToken, refreshToken };
}

const AuthService = {
  async register(payload) {
    const data = registerSchema.parse(payload);

    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      const error = new Error('An account with this email already exists');
      error.status = 409;
      throw error;
    }

    // Check registration number is not already taken
    const existingRegNo = await authRepository.findStudentByRegNo(data.reg_no);
    if (existingRegNo) {
      const error = new Error('This registration number is already in use');
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await authRepository.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'student',
      gender: data.gender,
    });
    const student = await authRepository.createStudentForUser(user.id, data.reg_no);

    const { accessToken, refreshToken } = issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: toPublicUser(user),
      student: toPublicStudent(student),
    };
  },

  async registerAdmin(payload) {
    const data = registerAdminSchema.parse(payload);

    if (!config.adminRegistrationCode || data.admin_code !== config.adminRegistrationCode) {
      const error = new Error('Invalid admin registration code');
      error.status = 403;
      throw error;
    }

    const existing = await authRepository.findUserByEmail(data.email);
    if (existing) {
      const error = new Error('An account with this email already exists');
      error.status = 409;
      throw error;
    }

    const passwordHash = await bcrypt.hash(data.password, 12);
    const user = await authRepository.createUser({
      name: data.name,
      email: data.email,
      passwordHash,
      role: 'admin',
      gender: data.gender,
    });

    const { accessToken, refreshToken } = issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: toPublicUser(user),
      student: null,
    };
  },

  async login(payload) {
    const data = loginSchema.parse(payload);

    const user = await authRepository.findUserByEmail(data.email);
    if (!user) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      const error = new Error('Invalid email or password');
      error.status = 401;
      throw error;
    }

    const student = user.role === 'student' ? await authRepository.findStudentByUserId(user.id) : null;
    const { accessToken, refreshToken } = issueTokens(user);

    return {
      accessToken,
      refreshToken,
      user: toPublicUser(user),
      student: toPublicStudent(student),
    };
  },

  async logout() {
    // Refresh tokens are stateless JWTs (no server-side session store in the
    // current schema), so logout is handled client-side by discarding the
    // tokens and clearing the refresh cookie in the controller.
    return;
  },

  async refreshToken(refreshToken) {
    if (!refreshToken) {
      const error = new Error('Missing refresh token');
      error.status = 401;
      throw error;
    }

    let decoded;
    try {
      decoded = jwt.verify(refreshToken, config.jwtRefreshSecret);
    } catch (err) {
      const error = new Error('Invalid or expired refresh token');
      error.status = 401;
      throw error;
    }

    const user = await authRepository.findUserById(BigInt(decoded.sub));
    if (!user) {
      const error = new Error('Invalid refresh token');
      error.status = 401;
      throw error;
    }

    const { accessToken, refreshToken: newRefreshToken } = issueTokens(user);
    return { accessToken, refreshToken: newRefreshToken };
  },

  async forgotPassword() {
    // Password reset is handled via Supabase on the frontend; nothing to do here.
    return;
  },

  async resetPassword() {
    return;
  },

  async getProfile(authUser) {
    const user = await authRepository.findUserById(BigInt(authUser.sub));
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    const student = user.role === 'student' ? await authRepository.findStudentByUserId(user.id) : null;
    return { user: toPublicUser(user), student: toPublicStudent(student) };
  },

  async listUsers() {
    const users = await authRepository.findAllUsers();
    // Attach student reg_no where available without extra per-user queries
    return users.map(toPublicUser);
  },

  async updateUserRole({ userId, role }) {
    const normalized = role.toLowerCase();
    if (!['student', 'admin'].includes(normalized)) {
      const error = new Error('Role must be either "student" or "admin"');
      error.status = 400;
      throw error;
    }
    const user = await authRepository.findUserById(BigInt(userId));
    if (!user) {
      const error = new Error('User not found');
      error.status = 404;
      throw error;
    }
    const updated = await authRepository.updateUserRole(BigInt(userId), normalized);
    return { user: toPublicUser(updated) };
  },
};

export default AuthService;
