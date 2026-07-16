import studentRepository from '../repositories/student.repository.js';
import { createStudentSchema } from '../validators/student.validator.js';

function toPublicStudent(student) {
  return {
    id: student.id.toString(),
    user_id: student.user_id.toString(),
    reg_no: student.reg_no,
  };
}

const StudentService = {
  async listByUserId(userId) {
    const student = await studentRepository.findByUserId(BigInt(userId));
    return student ? [toPublicStudent(student)] : [];
  },

  async create(payload) {
    const data = createStudentSchema.parse(payload);
    const userId = BigInt(data.user_id);

    // Idempotent: if the student record already exists for this user,
    // return it instead of failing (matches ensureStudentProfile's
    // "get or create" behavior on the frontend).
    const existing = await studentRepository.findByUserId(userId);
    if (existing) return toPublicStudent(existing);

    const student = await studentRepository.create({ user_id: userId, reg_no: data.reg_no });
    return toPublicStudent(student);
  },
};

export default StudentService;
export { toPublicStudent };
