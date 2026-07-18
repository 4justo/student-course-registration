import CourseService from '../services/course.service.js';

const CourseController = {
  async list(_req, res, next) {
    try {
      const courses = await CourseService.list();
      res.json(courses);
    } catch (error) {
      next(error);
    }
  },

  async create(req, res, next) {
    try {
      const course = await CourseService.create(req.body);
      res.status(201).json(course);
    } catch (error) {
      next(error);
    }
  },

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      await CourseService.remove(id);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  },
};

export default CourseController;
