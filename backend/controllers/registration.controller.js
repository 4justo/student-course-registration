import RegistrationService from '../services/registration.service.js';
import studentRepository from '../repositories/student.repository.js';

function forbid(res, message) {
  return res.status(403).json({ error: { message, status: 403 } });
}

async function ownsStudentOrIsAdmin(req, studentId) {
  if (req.user.role === 'admin') return true;
  if (!studentId) return false;
  const student = await studentRepository.findByUserId(BigInt(req.user.sub));
  return Boolean(student) && String(student.id) === String(studentId);
}

const RegistrationController = {
  async list(req, res, next) {
    try {
      const studentId = req.query.student_id;
      if (!studentId) return res.json([]);

      const allowed = await ownsStudentOrIsAdmin(req, studentId);
      if (!allowed) return forbid(res, 'You can only view your own registrations');

      const registrations = await RegistrationService.listByStudentId(studentId);
      res.json(registrations);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const allowed = await ownsStudentOrIsAdmin(req, req.body.student_id);
      if (!allowed) return forbid(res, 'You can only register yourself for courses');

      const registration = await RegistrationService.create(req.body);
      res.status(201).json(registration);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      await RegistrationService.remove(req.params.id, req.user);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export default RegistrationController;
