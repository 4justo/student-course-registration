import courseRepository from '../repositories/course.repository.js';
import { createCourseSchema } from '../validators/course.validator.js';

// Shapes a course row into what frontend/scripts.js's normalizeCourse()
// expects (code/title as well as abbreviation/name, computed seats/full).
function toPublicCourse(course) {
  const seats = course._count?.registrations ?? 0;
  const capacity = course.capacity;
  return {
    id: course.id.toString(),
    code: course.abbreviation,
    abbreviation: course.abbreviation,
    category: course.category,
    title: course.name,
    name: course.name,
    instructor: course.instructor,
    schedule: course.schedule,
    credits: course.credits,
    rating: course.rating,
    description: course.description || '',
    prereqs: course.prereqs || [],
    seats,
    capacity,
    full: seats >= capacity,
  };
}

const CourseService = {
  async list() {
    const courses = await courseRepository.findAll();
    return courses.map(toPublicCourse);
  },

  async create(payload) {
    const data = createCourseSchema.parse(payload);

    const existing = await courseRepository.findByAbbreviation(data.abbreviation);
    if (existing) {
      const error = new Error('A course with this code already exists');
      error.status = 409;
      throw error;
    }

    const course = await courseRepository.create({
      name: data.name,
      abbreviation: data.abbreviation,
      category: data.category || 'General',
      instructor: data.instructor || 'TBA',
      schedule: data.schedule || 'TBA',
      credits: data.credits ?? 3,
      rating: data.rating ?? 4.5,
      description: data.description || '',
      prereqs: data.prereqs || [],
      capacity: data.capacity,
    });

    return toPublicCourse({ ...course, _count: { registrations: 0 } });
  },

  async remove(id) {
    await courseRepository.delete(id);
  },
};

export default CourseService;
export { toPublicCourse };
