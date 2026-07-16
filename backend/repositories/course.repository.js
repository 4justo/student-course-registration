import prisma from '../lib/prisma.js';

const courseRepository = {
  // Includes a filtered count of "registered" registrations per course so
  // the service layer can compute occupied seats without a separate query.
  async findAll() {
    return prisma.courses.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { registrations: { where: { status: 'registered' } } },
        },
      },
    });
  },

  async findById(id) {
    return prisma.courses.findUnique({ where: { id } });
  },

  async findByAbbreviation(abbreviation) {
    return prisma.courses.findUnique({ where: { abbreviation } });
  },

  async create(data) {
    return prisma.courses.create({ data });
  },
};

export default courseRepository;
