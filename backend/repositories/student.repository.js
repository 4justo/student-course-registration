import prisma from '../lib/prisma.js';

const studentRepository = {
  async findByUserId(userId) {
    return prisma.students.findUnique({ where: { user_id: userId } });
  },

  async findById(id) {
    return prisma.students.findUnique({ where: { id } });
  },

  async create({ user_id, reg_no }) {
    return prisma.students.create({
      data: { user_id, reg_no: reg_no || `S${Date.now().toString().slice(-8)}` },
    });
  },
};

export default studentRepository;
