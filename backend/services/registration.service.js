import registrationRepository from '../repositories/registration.repository.js';
import courseRepository from '../repositories/course.repository.js';
import studentRepository from '../repositories/student.repository.js';
import { createRegistrationSchema } from '../validators/registration.validator.js';

function toPublicRegistration(reg) {
  return {
    id: reg.id.toString(),
    course_id: reg.course_id.toString(),
    student_id: reg.student_id.toString(),
    status: reg.status,
    created_at: reg.created_at,
  };
}

const RegistrationService = {
  async listByStudentId(studentId) {
    const regs = await registrationRepository.findByStudentId(BigInt(studentId));
    return regs.map(toPublicRegistration);
  },

  async create(payload) {
    const data = createRegistrationSchema.parse(payload);
    const courseId = BigInt(data.course_id);
    const studentId = BigInt(data.student_id);

    const course = await courseRepository.findById(courseId);
    if (!course) {
      const error = new Error('Course not found');
      error.status = 404;
      throw error;
    }

    const student = await studentRepository.findById(studentId);
    if (!student) {
      const error = new Error('Student not found');
      error.status = 404;
      throw error;
    }

    const existing = await registrationRepository.findByCourseAndStudent(courseId, studentId);
    if (existing && existing.status === 'registered') {
      const error = new Error('Already registered for this course');
      error.status = 409;
      throw error;
    }

    const activeCount = await registrationRepository.countActiveForCourse(courseId);
    if (activeCount >= course.capacity) {
      const error = new Error('Course is full');
      error.status = 409;
      throw error;
    }

    const registration = await registrationRepository.create({
      course_id: courseId,
      student_id: studentId,
      status: 'registered',
    });

    return toPublicRegistration(registration);
  },

  async remove(id, authUser) {
    const registrationId = BigInt(id);
    const registration = await registrationRepository.findById(registrationId);
    if (!registration) {
      const error = new Error('Registration not found');
      error.status = 404;
      throw error;
    }

    if (authUser.role !== 'admin') {
      const student = await studentRepository.findByUserId(BigInt(authUser.sub));
      if (!student || student.id !== registration.student_id) {
        const error = new Error('You cannot remove another student\'s registration');
        error.status = 403;
        throw error;
      }
    }

    await registrationRepository.delete(registrationId);
  },
};

export default RegistrationService;
