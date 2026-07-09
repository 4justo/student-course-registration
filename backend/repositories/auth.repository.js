import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const authRepository = {
  async findStudentByRegistration(registrationNumber) {
    return prisma.student.findUnique({
      where: { registrationNumber },
      include: { role: true },
    });
  },

  async findSessionByToken(refreshToken) {
    return prisma.session.findUnique({ where: { refreshToken } });
  },

  async rotateRefreshToken(sessionId, refreshToken) {
    return prisma.session.update({ where: { id: sessionId }, data: { refreshToken } });
  },

  async revokeRefreshToken(refreshToken) {
    return prisma.session.deleteMany({ where: { refreshToken } });
  },

  async getStudentProfile(studentId) {
    return prisma.student.findUnique({
      where: { id: studentId },
      select: {
        id: true,
        registrationNumber: true,
        email: true,
        firstName: true,
        lastName: true,
      },
    });
  },
};

export default authRepository;
