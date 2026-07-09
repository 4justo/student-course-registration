// Lightweight Supabase frontend helper for EduRegister
// Usage (in browser):
// <script type="module" src="supabaseClient.js"></script>
// then in another module: await window.initSupabase(SUPABASE_URL, SUPABASE_ANON_KEY)

export async function initSupabase(supabaseUrl, supabaseAnonKey) {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase URL or anon key missing. Call initSupabase(url,key) with your values.');
    return null;
  }
  const { createClient } = await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm');
  window.supabase = createClient(supabaseUrl, supabaseAnonKey);
  return window.supabase;
}

// Fetch all published courses
export async function fetchCourses() {
  if (!window.supabase) throw new Error('Supabase client not initialized. Call initSupabase().');
  const { data, error } = await window.supabase.from('courses').select('*').order('title', { ascending: true });
  if (error) throw error;
  return data || [];
}

// Insert a new course (admin)
export async function addCourseSupabase(course) {
  if (!window.supabase) throw new Error('Supabase client not initialized. Call initSupabase().');
  const payload = {
    code: course.code,
    title: course.title,
    category: course.category,
    instructor: course.instructor,
    schedule: course.schedule,
    credits: course.credits,
    capacity: course.capacity,
    description: course.description,
    seats: course.seats || 0,
    full: !!course.full
  };
  const { data, error } = await window.supabase.from('courses').insert([payload]).select().single();
  if (error) throw error;
  return data;
}

// Enroll a user in a course (creates registration record)
export async function enrollUser(userId, courseId) {
  if (!window.supabase) throw new Error('Supabase client not initialized. Call initSupabase().');
  const { data, error } = await window.supabase.from('registrations').insert([{ user_id: userId, course_id: courseId, enrolled_at: new Date().toISOString() }]).select().single();
  if (error) throw error;
  return data;
}

// Get registrations for a user
export async function getRegistrationsForUser(userId) {
  if (!window.supabase) throw new Error('Supabase client not initialized. Call initSupabase().');
  const { data, error } = await window.supabase.from('registrations').select('*, courses(*)').eq('user_id', userId);
  if (error) throw error;
  return data || [];
}

// Remove registration
export async function removeRegistration(userId, courseId) {
  if (!window.supabase) throw new Error('Supabase client not initialized. Call initSupabase().');
  const { data, error } = await window.supabase.from('registrations').delete().match({ user_id: userId, course_id: courseId }).select();
  if (error) throw error;
  return data || [];
}

// Expose convenience helpers on window for quick integration with existing scripts
window.initSupabase = initSupabase;
window.fetchCoursesSupabase = fetchCourses;
window.addCourseSupabase = addCourseSupabase;
window.enrollUserSupabase = enrollUser;
window.getRegistrationsForUser = getRegistrationsForUser;
window.removeRegistration = removeRegistration;

export default {
  initSupabase,
  fetchCourses,
  addCourseSupabase,
  enrollUser,
  getRegistrationsForUser,
  removeRegistration
};
