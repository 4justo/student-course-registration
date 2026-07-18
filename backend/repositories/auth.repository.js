import prisma from '../lib/prisma.js';

// NOTE: these queries are written against the actual prisma/schema.prisma
// models (`users`, `students`) — not the placeholder `Student`/`Session`
// models the old version of this file referenced, which don't exist in the
// schema and caused every login/register call to throw.
const authRepository = {
  async findUserByEmail(email) {
    return prisma.users.findUnique({ where: { email } });
  },

  async findUserById(id) {
    return prisma.users.findUnique({ where: { id } });
  },

  async createUser({ name, email, passwordHash, role, gender }) {
    return prisma.users.create({
      data: {
        name,
        email,
        password_hash: passwordHash,
        role,
        gender: gender || null,
      },
    });
  },

  async findStudentByUserId(userId) {
    return prisma.students.findUnique({ where: { user_id: userId } });
  },

  async findStudentByRegNo(reg_no) {
    return prisma.students.findUnique({ where: { reg_no } });
  },

  // reg_no is now provided by the user on registration (not auto-generated).
  async createStudentForUser(userId, reg_no) {
    return prisma.students.create({
      data: { user_id: userId, reg_no },
    });
  },

  async findAllUsers() {
    return prisma.users.findMany({
      orderBy: { id: 'asc' },
      include: {
        students: true,
      },
    });
  },

  async updateUserRole(userId, role) {
    return prisma.users.update({
      where: { id: userId },
      data: { role },
    });
  },
};

export default authRepository;
