import prisma from '../lib/prisma.js';

const registrationRepository = {
  async findByStudentId(studentId) {
    return prisma.registrations.findMany({
      where: { student_id: studentId },
      orderBy: { created_at: 'desc' },
    });
  },

  async findById(id) {
    return prisma.registrations.findUnique({ where: { id } });
  },

  // Matches the @@unique([course_id, student_id]) constraint in schema.prisma
  async findByCourseAndStudent(courseId, studentId) {
    return prisma.registrations.findUnique({
      where: { course_id_student_id: { course_id: courseId, student_id: studentId } },
    });
  },

  async countActiveForCourse(courseId) {
    return prisma.registrations.count({ where: { course_id: courseId, status: 'registered' } });
  },

  async create(data) {
    return prisma.registrations.create({ data });
  },

  async delete(id) {
    return prisma.registrations.delete({ where: { id } });
  },
};

export default registrationRepository;
