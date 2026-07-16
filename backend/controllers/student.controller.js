import StudentService from '../services/student.service.js';

function forbid(res, message) {
  return res.status(403).json({ error: { message, status: 403 } });
}

const StudentController = {
  async list(req, res, next) {
    try {
      const userId = req.query.user_id;
      if (!userId) return res.json([]);

      if (req.user.role !== 'admin' && String(req.user.sub) !== String(userId)) {
        return forbid(res, 'You can only view your own student record');
      }

      const students = await StudentService.listByUserId(userId);
      res.json(students);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      if (req.user.role !== 'admin' && String(req.user.sub) !== String(req.body.user_id)) {
        return forbid(res, 'You can only create your own student record');
      }
      const student = await StudentService.create(req.body);
      res.status(201).json(student);
    } catch (error) {
      next(error);
    }
  },
};

export default StudentController;
