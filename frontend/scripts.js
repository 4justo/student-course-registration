const authTabs = document.querySelectorAll('.tab-button, .pill');
const authForms = document.querySelectorAll('.auth-form');
const switchTabLinks = document.querySelectorAll('.switch-tab');
const signInButton = document.getElementById('sign-in');
const signInHeroButton = document.getElementById('sign-in-hero');
const signInSsoButton = document.getElementById('sign-in-sso');
const signInGoogleButton = document.getElementById('sign-in-google');
const createAccountButton = document.getElementById('create-account');
const signOutLinks = document.querySelectorAll('.sign-out');
const menuToggle = document.querySelector('.menu-toggle');
const siteHeader = document.querySelector('.site-header');

const AUTH_TOKEN_KEY = 'eduRegisterAuthToken';
const USER_PROFILE_KEY = 'eduRegisterUserProfile';
const AUTH_STATE_KEY = 'eduRegisterAuthState';
// Default placeholders — DO NOT commit real keys. Configure at runtime or via localStorage.
const DEFAULT_SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'REPLACE_WITH_SUPABASE_ANON_KEY';

function getSupabaseConfig() {
  return {
    url: window.__SUPABASE_URL__ || localStorage.getItem('eduRegisterSupabaseUrl') || DEFAULT_SUPABASE_URL,
    key: window.__SUPABASE_ANON_KEY__ || localStorage.getItem('eduRegisterSupabaseAnonKey') || DEFAULT_SUPABASE_ANON_KEY,
  };
}

function persistSupabaseConfig(url, anonKey) {
  if (url) localStorage.setItem('eduRegisterSupabaseUrl', url);
  if (anonKey) localStorage.setItem('eduRegisterSupabaseAnonKey', anonKey);
}

async function initializeSupabaseClient() {
  if (window.supabase || window.supabaseConnected) {
    return true;
  }

  try {
    const { url, key } = getSupabaseConfig();

    // Bail out immediately if the user has not replaced the placeholder values.
    // createClient() succeeds with fake credentials (it doesn't validate them
    // at construction time), so without this guard window.supabaseConnected
    // gets set to true and every data call is routed to a Supabase that
    // doesn't actually work — silently breaking course creation and enrollment.
    if (
      !url || url === DEFAULT_SUPABASE_URL ||
      !key || key === DEFAULT_SUPABASE_ANON_KEY
    ) {
      console.info('Supabase not configured — all data operations will use the REST API backend.');
      return false;
    }

    persistSupabaseConfig(url, key);
    const { initSupabase } = await import('./supabaseClient.js');
    const client = await initSupabase(url, key);
    if (!client) {
      // initSupabase returns null when url/key are falsy — treat as not connected
      return false;
    }
    window.supabaseConnected = true;
    window.dispatchEvent(new CustomEvent('supabase:ready'));
    return true;
  } catch (error) {
    console.warn('Supabase could not be initialized:', error);
    return false;
  }
}

window.initializeSupabaseClient = initializeSupabaseClient;

function setSupabaseSettingsUI() {
  const urlInput = document.getElementById('supabase-url-input');
  const keyInput = document.getElementById('supabase-key-input');
  const feedback = document.getElementById('supabase-save-feedback');
  if (!urlInput || !keyInput) return;
  const { url, key } = getSupabaseConfig();
  urlInput.value = url !== DEFAULT_SUPABASE_URL ? url : '';
  keyInput.value = key !== DEFAULT_SUPABASE_ANON_KEY ? key : '';
  if (feedback) {
    feedback.textContent = '';
    feedback.classList.add('hidden');
  }
}

function showInlineMessage(elementId, message, isError = false) {
  const element = document.getElementById(elementId);
  if (!element) return;
  element.textContent = message;
  element.classList.toggle('hidden', !message);
  element.classList.toggle('text-red-600', isError);
  element.classList.toggle('text-emerald-700', !isError);
}

async function saveSupabaseSettings() {
  const urlInput = document.getElementById('supabase-url-input');
  const keyInput = document.getElementById('supabase-key-input');
  const feedback = document.getElementById('supabase-save-feedback');
  if (!urlInput || !keyInput || !feedback) return;
  const url = urlInput.value.trim();
  const key = keyInput.value.trim();
  if (!url || !key) {
    showInlineMessage('supabase-save-feedback', 'Please enter both URL and anon key.', true);
    return;
  }
  persistSupabaseConfig(url, key);
  feedback.textContent = 'Supabase credentials saved locally.';
  feedback.classList.remove('hidden');
  feedback.classList.remove('text-red-600');
  feedback.classList.add('text-emerald-700');
  await initializeSupabaseClient();
}

function getSupabaseResetErrorMessage(error) {
  const errorMessage = error?.message || '';
  const errorCode = error?.status || error?.code || '';
  const combinedText = `${errorCode} ${errorMessage}`.toLowerCase();

  if (combinedText.includes('otp_disabled') || combinedText.includes('signups not allowed for otp')) {
    return 'This Supabase project is not currently allowing password-reset emails. Open the Supabase dashboard, enable Authentication > Providers > Email, and make sure email signups/reset OTP are enabled for the project, then try again.';
  }

  if (combinedText.includes('invalid api key') || combinedText.includes('api key')) {
    return 'The Supabase anon key appears to be invalid. Re-enter the correct project URL and anon key, then save and retry.';
  }

  return errorMessage || 'Unable to send reset email.';
}

async function sendPasswordResetEmail(email) {
  if (!email) {
    throw new Error('Please enter your email address.');
  }

  const response = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });

  if (!response?.message) {
    throw new Error('Unable to send reset instructions.');
  }

  return response;
}

window.setSupabaseSettingsUI = setSupabaseSettingsUI;
window.saveSupabaseSettings = saveSupabaseSettings;
window.sendPasswordResetEmail = sendPasswordResetEmail;

async function confirmPasswordReset(token, newPassword) {
  if (!token || !newPassword) {
    throw new Error('Please provide a reset token and a new password.');
  }

  const response = await apiFetch('/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ token, newPassword }),
  });

  return response;
}

window.confirmPasswordReset = confirmPasswordReset;

function getStoredAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY);
}

function saveAuthToken(token) {
  if (token) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }
}

function clearAuthToken() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
}

function getCurrentUserProfile() {
  try {
    return JSON.parse(localStorage.getItem(USER_PROFILE_KEY) || 'null');
  } catch (error) {
    return null;
  }
}

function saveUserProfile(profile) {
  if (!profile) return;
  localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
}

function clearUserProfile() {
  localStorage.removeItem(USER_PROFILE_KEY);
}

function normalizeRole(role) {
  if (!role) return 'student';
  return role.toLowerCase();
}

function displayRole(role) {
  const r = normalizeRole(role);
  return r.charAt(0).toUpperCase() + r.slice(1);
}

function updateUserMenu() {
  const userBadge = document.querySelector('.user-badge');
  const userName = document.querySelector('.user-name');
  const authState = getAuthState();
  const role = normalizeRole(authState.role);
  const name = authState.name || 'You';

  if (userBadge) {
    userBadge.textContent = name.charAt(0).toUpperCase();
  }
  if (userName) {
    userName.textContent = name;
  }
  // Sync role select — options use capitalized values (Student/Admin)
  if (roleSelect) {
    const displayVal = displayRole(role);
    if (roleSelect.value !== displayVal) roleSelect.value = displayVal;
  }
  updateRoleUI();
}

function requireAuthPage() {
  const p = window.location.pathname;
  // Public pages — no auth needed
  if (
    p.includes('index.html') ||
    p.endsWith('/') ||
    p.includes('forgot-password.html') ||
    p.includes('reset-password.html')
  ) {
    return;
  }
  if (!getStoredAuthToken()) {
    window.location.href = 'index.html';
  }
}

function requireAdminRole() {
  if (window.location.pathname.includes('admin.html')) {
    const authState = getAuthState();
    const token = getStoredAuthToken();
    if (!token || normalizeRole(authState.role) !== 'admin') {
      window.location.href = 'index.html';
    }
  }
}

function getAuthState() {
  const profile = getCurrentUserProfile();
  if (profile && profile.user) {
    return {
      // Always store/return lowercase so comparisons never need to guess casing
      role: normalizeRole(profile.user.role) || 'student',
      name: profile.user.name || 'You',
    };
  }
  try {
    const stored = JSON.parse(localStorage.getItem(AUTH_STATE_KEY) || '{}');
    if (stored.role) stored.role = normalizeRole(stored.role);
    return stored;
  } catch (error) {
    return {};
  }
}

function saveAuthState(state) {
  if (!state) return;
  localStorage.setItem(AUTH_STATE_KEY, JSON.stringify(state));
}

function clearAuthState() {
  localStorage.removeItem(AUTH_STATE_KEY);
}

function logout() {
  clearAuthToken();
  clearAuthState();
  clearUserProfile();
  window.location.href = 'index.html';
}

if (menuToggle && siteHeader) {
  const closeMobileMenu = () => {
    siteHeader.classList.remove('mobile-nav-open');
    document.body.classList.remove('mobile-menu-open');
    menuToggle.setAttribute('aria-expanded', 'false');
  };

  const openMobileMenu = () => {
    siteHeader.classList.add('mobile-nav-open');
    document.body.classList.add('mobile-menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
  };

  menuToggle.addEventListener('click', () => {
    if (siteHeader.classList.contains('mobile-nav-open')) {
      closeMobileMenu();
    } else {
      openMobileMenu();
    }
  });

  siteHeader.querySelectorAll('.main-nav a, .header-actions a, .header-actions button, .header-actions select, .header-actions .role-label').forEach(element => {
    element.addEventListener('click', () => {
      if (window.innerWidth <= 900) {
        closeMobileMenu();
      }
    });
  });

  document.addEventListener('click', event => {
    const target = event.target;
    if (window.innerWidth <= 900 && siteHeader.classList.contains('mobile-nav-open') && target instanceof Node && !siteHeader.contains(target) && !menuToggle.contains(target)) {
      closeMobileMenu();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 900) {
      closeMobileMenu();
    }
  });
}

if (authTabs.length) {
  authTabs.forEach(button => {
    button.addEventListener('click', () => {
      setActiveTab(button.dataset.tab);
    });
  });
}

if (signInHeroButton) {
  signInHeroButton.addEventListener('click', () => {
    window.location.href = 'catalog.html';
  });
}

if (signInSsoButton) {
  signInSsoButton.addEventListener('click', () => {
    alert('University SSO flow (mock): redirecting to Course Catalog');
    window.location.href = 'catalog.html';
  });
}

if (signInGoogleButton) {
  signInGoogleButton.addEventListener('click', () => {
    alert('Google Sign-In (mock): redirecting to Course Catalog');
    window.location.href = 'catalog.html';
  });
}

if (switchTabLinks.length) {
  switchTabLinks.forEach(link => {
    link.addEventListener('click', event => {
      event.preventDefault();
      setActiveTab(link.dataset.tab);
    });
  });
}

function setActiveTab(tabName) {
  authTabs.forEach(button => {
    button.classList.toggle('active', button.dataset.tab === tabName);
  });
  authForms.forEach(form => {
    form.classList.toggle('hidden', form.id !== tabName);
  });
}

async function loginUser(email, password) {
  const result = await apiFetch('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
  saveAuthToken(result.token);
  saveUserProfile({ user: result.user, student: result.student });
  saveAuthState({ role: result.user.role, name: result.user.name });
  updateUserMenu();
  return result;
}

async function registerUser(name, reg_no, email, password) {
  const result = await apiFetch('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, reg_no, email, password }),
  });
  saveAuthToken(result.token);
  saveUserProfile({ user: result.user, student: result.student });
  saveAuthState({ role: result.user.role, name: result.user.name });
  updateUserMenu();
  return result;
}

async function registerAdmin(name, email, password, adminCode) {
  const result = await apiFetch('/auth/register-admin', {
    method: 'POST',
    body: JSON.stringify({ name, email, password, admin_code: adminCode }),
  });
  saveAuthToken(result.token);
  saveUserProfile({ user: result.user });
  saveAuthState({ role: result.user.role, name: result.user.name });
  updateUserMenu();
  return result;
}

window.registerAdmin = registerAdmin;

if (signInButton) {
  signInButton.addEventListener('click', async () => {
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
      return alert('Please enter both email and password.');
    }

    try {
      const result = await loginUser(email, password);
      const role = result?.user?.role?.toLowerCase();
      window.location.href = role === 'admin' ? 'admin.html' : 'catalog.html';
    } catch (error) {
      alert(error.message || 'Login failed. Please check your credentials.');
    }
  });
}

if (createAccountButton) {
  createAccountButton.addEventListener('click', async () => {
    const nameInput = document.getElementById('create-name');
    const regNoInput = document.getElementById('create-reg-no');
    const emailInput = document.getElementById('create-email');
    const passwordInput = document.getElementById('create-password');
    const confirmInput = document.getElementById('create-confirm-password');
    const agreeCheckbox = document.getElementById('agree-terms');
    const name = nameInput?.value.trim();
    const reg_no = regNoInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    const confirmPassword = confirmInput?.value.trim();

    if (!name || !reg_no || !email || !password) {
      return alert('Please provide your name, registration number, email, and a password.');
    }
    if (password !== confirmPassword) {
      return alert('Passwords do not match. Please re-enter your password.');
    }
    if (agreeCheckbox && !agreeCheckbox.checked) {
      return alert('Please agree to the privacy policy and terms to continue.');
    }

    try {
      await registerUser(name, reg_no, email, password);
      window.location.href = 'catalog.html';
    } catch (error) {
      alert(error.message || 'Account creation failed. Please try again.');
    }
  });
}

const resetButton = document.getElementById('send-reset');
if (resetButton) {
  resetButton.addEventListener('click', async () => {
    const emailInput = document.getElementById('reset-email');
    const email = emailInput?.value.trim();

    try {
      const response = await sendPasswordResetEmail(email);
      showInlineMessage('reset-message', response?.message || 'If an account exists for that email, reset instructions are ready.');
      showInlineMessage('reset-error', '');
    } catch (error) {
      showInlineMessage('reset-message', '');
      showInlineMessage('reset-error', error.message || 'Unable to send reset email.', true);
    }
  });
}

const confirmResetButton = document.getElementById('confirm-reset');
if (confirmResetButton) {
  confirmResetButton.addEventListener('click', async () => {
    const tokenInput = document.getElementById('reset-token');
    const passwordInput = document.getElementById('new-password');
    const status = document.getElementById('reset-status');
    try {
      const response = await confirmPasswordReset(tokenInput?.value.trim(), passwordInput?.value);
      if (status) {
        status.textContent = response?.message || 'Password updated.';
      }
    } catch (error) {
      if (status) {
        status.textContent = error.message || 'Unable to reset password.';
      }
    }
  });
}

const saveSupabaseButton = document.getElementById('save-supabase-settings');
if (saveSupabaseButton) {
  saveSupabaseButton.addEventListener('click', async () => {
    try {
      await saveSupabaseSettings();
    } catch (error) {
      showInlineMessage('supabase-save-feedback', error.message || 'Unable to save Supabase settings.', true);
    }
  });
}

if (document.getElementById('supabase-url-input') || document.getElementById('reset-email')) {
  setSupabaseSettingsUI();
}

const adminRegisterBtn = document.getElementById('admin-register');
if (adminRegisterBtn) {
  adminRegisterBtn.addEventListener('click', async () => {
    const nameInput = document.getElementById('admin-name');
    const emailInput = document.getElementById('admin-email');
    const passwordInput = document.getElementById('admin-password');
    const codeInput = document.getElementById('admin-code');
    const name = nameInput?.value.trim();
    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();
    const code = codeInput?.value.trim();

    if (!name || !email || !password || !code) {
      return alert('Please provide name, email, password, and admin code.');
    }

    try {
      await registerAdmin(name, email, password, code);
      window.location.href = 'admin.html';
    } catch (error) {
      alert(error.message || 'Admin registration failed. Please check your credentials and code.');
    }
  });
}

if (signOutLinks.length) {
  signOutLinks.forEach((link) => {
    link.addEventListener('click', (event) => {
      event.preventDefault();
      logout();
    });
  });
}

const defaultCourses = [
  {
    id: 'CS301',
    code: 'CS 301',
    category: 'Computer Science',
    title: 'Data Structures & Algorithms',
    instructor: 'Dr. Amara Osei',
    schedule: 'Mon/Wed 09:00–10:30',
    credits: 4,
    rating: 4.8,
    seats: 28,
    capacity: 35,
    description: 'Fundamental data structures including trees, graphs, and hash maps with algorithmic complexity analysis.',
    full: false,
  },
  {
    id: 'CS410',
    code: 'CS 410',
    category: 'Computer Science',
    title: 'Machine Learning Foundations',
    instructor: 'Prof. Lena Hoffmann',
    schedule: 'Tue/Thu 11:00–12:30',
    credits: 3,
    rating: 4.6,
    seats: 34,
    capacity: 40,
    description: 'Supervised and unsupervised learning, neural networks, and practical model evaluation techniques.',
    prereqs: ['CS301'],
    full: false,
  },
  {
    id: 'MATH201',
    code: 'MATH 201',
    category: 'Mathematics',
    title: 'Linear Algebra',
    instructor: 'Dr. Kwame Asante',
    schedule: 'Mon/Wed/Fri 08:00–08:50',
    credits: 3,
    rating: 4.4,
    seats: 40,
    capacity: 45,
    description: 'Vectors, matrices, eigenvalues, and linear transformations with applications to engineering.',
    full: false,
  },
  {
    id: 'BUS220',
    code: 'BUS 220',
    category: 'Business',
    title: 'Business Analytics',
    instructor: 'Prof. Chioma Eze',
    schedule: 'Tue/Thu 09:30–11:00',
    credits: 3,
    rating: 4.5,
    seats: 25,
    capacity: 40,
    description: 'Data-driven decision making, dashboards, KPIs, and predictive analytics for business contexts.',
    full: false,
  },
  {
    id: 'CS350',
    code: 'CS 350',
    category: 'Computer Science',
    title: 'Operating Systems',
    instructor: 'Dr. Yuki Tanaka',
    schedule: 'Tue/Thu 15:00–16:30',
    credits: 4,
    rating: 4.2,
    seats: 20,
    capacity: 30,
    description: 'Processes, memory management, file systems, concurrency, and system calls in modern OS design.',
    prereqs: ['CS301'],
    full: false,
  },
  {
    id: 'PHYS110',
    code: 'PHYS 110',
    category: 'Physics',
    title: 'General Physics I',
    instructor: 'Dr. Natalia Rossi',
    schedule: 'Mon/Wed 13:00–14:30',
    credits: 4,
    rating: 4.3,
    seats: 38,
    capacity: 50,
    description: 'Kinematics, Newton’s laws, energy, momentum, and rotational motion with lab component.',
    full: false,
  },
  {
    id: 'CS500',
    code: 'CS 500',
    category: 'Computer Science',
    title: 'Full-Stack Web Development',
    instructor: 'Prof. Elena Cortez',
    schedule: 'Wed/Fri 10:00–11:30',
    credits: 3,
    rating: 4.7,
    seats: 30,
    capacity: 30,
    description: 'HTML, CSS, JavaScript, React, and backend APIs. Build full-stack web applications from scratch.',
    prereqs: ['CS301','CS350'],
    full: true,
  },
  {
    id: 'STAT330',
    code: 'STAT 330',
    category: 'Mathematics',
    title: 'Probability & Statistics',
    instructor: 'Dr. Maya Patel',
    schedule: 'Tue/Thu 13:00–14:30',
    credits: 3,
    rating: 4.6,
    seats: 22,
    capacity: 35,
    description: 'Probability distributions, hypothesis testing, regression, and Bayesian reasoning.',
    full: false,
  }
];

function normalizeCourse(course) {
  const capacity = Number(course.capacity || 30);
  const seats = Number(course.seats || 0);
  return {
    id: String(course.id || `${String(course.code || course.title || 'course').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`),
    code: course.code || course.abbreviation || 'NEW',
    category: course.category || 'General',
    title: course.title || course.name || 'Untitled Course',
    instructor: course.instructor || 'TBA',
    schedule: course.schedule || 'TBA',
    credits: Number(course.credits || 3),
    rating: Number(course.rating || 4.5),
    seats,
    capacity,
    description: course.description || '',
    full: Boolean(course.full || seats >= capacity),
    prereqs: Array.isArray(course.prereqs) ? course.prereqs : []
  };
}

function getSupabaseUserId() {
  const profile = getCurrentUserProfile();
  const profileId = profile?.user?.id || profile?.id;
  if (profileId) return String(profileId);

  const storedId = localStorage.getItem('eduRegisterSupabaseUserId');
  if (storedId) return storedId;

  const nextId = `local-${Date.now().toString(36)}`;
  localStorage.setItem('eduRegisterSupabaseUserId', nextId);
  return nextId;
}

async function ensureSupabaseStudentProfile() {
  if (!window.supabase) return null;
  const storedStudentId = localStorage.getItem('eduRegisterSupabaseStudentId');
  if (storedStudentId) return storedStudentId;

  const name = getAuthState().name || 'Supabase User';
  const email = `supabase-${Date.now().toString(36)}@local.test`;
  const passwordHash = `local-${Date.now().toString(36)}`;

  const { data: userData, error: userError } = await window.supabase.from('users').insert([{ name, email, password_hash: passwordHash, role: 'student' }]).select('id').single();
  if (userError) throw userError;

  const regNo = `SUPA-${Date.now().toString(36).toUpperCase()}`;
  const { data: studentData, error: studentError } = await window.supabase.from('students').insert([{ user_id: userData.id, reg_no: regNo }]).select('id').single();
  if (studentError) throw studentError;

  localStorage.setItem('eduRegisterSupabaseStudentId', String(studentData.id));
  localStorage.setItem('eduRegisterSupabaseUserId', String(userData.id));
  return String(studentData.id);
}

async function fetchCoursesFromSupabase() {
  if (!window.supabase) throw new Error('Supabase client is not ready.');
  const { data, error } = await window.supabase.from('courses').select('*').order('name', { ascending: true });
  if (error) throw error;
  return (data || []).map(normalizeCourse);
}

async function saveCourseToSupabase(courseData) {
  if (!window.supabase) throw new Error('Supabase client is not ready.');
  const payload = {
    name: courseData.title || courseData.name || 'Untitled Course',
    abbreviation: courseData.code || courseData.abbreviation || 'NEW',
    category: courseData.category || 'General',
    instructor: courseData.instructor || 'TBA',
    schedule: courseData.schedule || 'TBA',
    credits: Number(courseData.credits || 3),
    rating: Number(courseData.rating || 4.5),
    capacity: Number(courseData.capacity || 30),
    description: courseData.description || '',
    prereqs: Array.isArray(courseData.prereqs) ? courseData.prereqs : [],
  };
  const { data, error } = await window.supabase.from('courses').insert([payload]).select().single();
  if (error) throw error;
  return normalizeCourse(data);
}

async function fetchRegistrationsFromSupabase() {
  if (!window.supabase) throw new Error('Supabase client is not ready.');
  const studentId = await ensureSupabaseStudentProfile();
  const { data, error } = await window.supabase.from('registrations').select('*').eq('student_id', studentId).order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

async function saveRegistrationToSupabase(courseId) {
  if (!window.supabase) throw new Error('Supabase client is not ready.');
  const studentId = await ensureSupabaseStudentProfile();
  const { data, error } = await window.supabase.from('registrations').insert([{ student_id: Number(studentId), course_id: Number(courseId), status: 'registered' }]).select().single();
  if (error) throw error;
  return data;
}

async function syncSupabaseCourseSeats(courseId, seats, full) {
  if (!window.supabase) return;
  await window.supabase.from('courses').update({ capacity: Number(seats) + Number(full ? 0 : 0) }).eq('id', Number(courseId));
}

const DEFAULT_API_BASE_URL =
  typeof window !== 'undefined' && window.location.origin
    ? `${window.location.origin}/api`
    : 'http://127.0.0.1:4000/api';

function getApiBaseUrl() {
  return window.API_BASE_URL || localStorage.getItem('eduRegisterApiBaseUrl') || DEFAULT_API_BASE_URL;
}

function setApiBaseUrl(url) {
  if (!url) return;
  window.API_BASE_URL = url;
  localStorage.setItem('eduRegisterApiBaseUrl', url);
  return url;
}

window.getApiBaseUrl = getApiBaseUrl;
window.setApiBaseUrl = setApiBaseUrl;

let registrationMap = {};

async function apiFetch(path, options = {}) {
  const token = getStoredAuthToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers,
    ...options,
  });

  // Auth endpoints legitimately return 401 for wrong credentials — that's
  // not an expired session, so don't wipe storage or redirect for those.
  const isAuthAttempt = path.startsWith('/auth/login') || path.startsWith('/auth/register');

  if (response.status === 401 && !isAuthAttempt) {
    clearAuthToken();
    clearUserProfile();
    clearAuthState();
    if (!window.location.pathname.endsWith('index.html')) {
      window.location.href = 'index.html';
    }
    throw new Error('Your session has expired. Please sign in again.');
  }

  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const data = await response.json();
      message = data?.error?.message || data?.message || message;
    } catch (_error) {
      // response body wasn't JSON — fall back to the status text above
    }
    throw new Error(message);
  }
  return response.json();
}

async function ensureStudentProfile() {
  const token = getStoredAuthToken();
  if (!token) {
    window.location.href = 'index.html';
    return null;
  }

  const stored = getCurrentUserProfile() || {};
  let user = stored.user;
  let student = stored.student;

  if (!user) {
    user = await apiFetch('/auth/me');
  }

  if (!student) {
    const students = await apiFetch(`/students?user_id=${encodeURIComponent(user.id)}`);
    student = students.length ? students[0] : null;
  }

  if (!student) {
    const reg_no = `S${Date.now().toString().slice(-6)}`;
    student = await apiFetch('/students', {
      method: 'POST',
      body: JSON.stringify({ user_id: user.id, reg_no }),
    });
  }

  const profile = { user, student };
  saveUserProfile(profile);
  window.currentStudentId = student.id;
  saveAuthState({ role: user.role, name: user.name });
  updateUserMenu();
  return profile;
}

async function fetchCoursesApi() {
  const results = await apiFetch('/courses');
  return results.map(normalizeCourse);
}

async function createCourseBackend(courseData) {
  await initializeSupabaseClient();
  if (window.supabaseConnected) {
    return saveCourseToSupabase(courseData);
  }

  const payload = {
    name: courseData.title,
    abbreviation: courseData.code,
    category: courseData.category,
    instructor: courseData.instructor,
    schedule: courseData.schedule,
    credits: Number(courseData.credits || 3),
    description: courseData.description,
    rating: Number(courseData.rating || 4.5),
    prereqs: courseData.prereqs || [],
    capacity: Number(courseData.capacity || 30),
  };
  const course = await apiFetch('/courses', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return normalizeCourse(course);
}

async function loadCourses() {
  await initializeSupabaseClient();
  try {
    if (window.supabaseConnected) {
      courses = await fetchCoursesFromSupabase();
      if (!courses.length) {
        const seeds = defaultCourses.map(normalizeCourse);
        for (const seed of seeds) {
          await saveCourseToSupabase(seed);
        }
        courses = await fetchCoursesFromSupabase();
      }
      window.courses = courses;
      if (courseGrid) renderCourses(courses);
      if (typeof window.renderCourseAnalytics === 'function') window.renderCourseAnalytics('course-analytics');
      return;
    }

    courses = await fetchCoursesApi();
    if (!courses.length) {
      const seeds = defaultCourses.map(normalizeCourse);
      for (const seed of seeds) {
        await createCourseBackend(seed);
      }
      courses = await fetchCoursesApi();
    }
    window.courses = courses;
    if (courseGrid) renderCourses(courses);
    if (typeof window.renderCourseAnalytics === 'function') window.renderCourseAnalytics('course-analytics');
  } catch (error) {
    console.warn('Course load failed, using local defaults.', error);
    courses = defaultCourses.map(normalizeCourse);
    window.courses = courses;
    if (courseGrid) renderCourses(courses);
    if (typeof window.renderCourseAnalytics === 'function') window.renderCourseAnalytics('course-analytics');
  }
}

async function loadRegistrations() {
  await initializeSupabaseClient();
  try {
    if (window.supabaseConnected) {
      const registrations = await fetchRegistrationsFromSupabase();
      registrationMap = registrations.reduce((map, reg) => {
        map[String(reg.course_id)] = String(reg.id);
        return map;
      }, {});
      enrolledCourses = registrations.map((reg) => String(reg.course_id));
      localStorage.setItem('eduRegisterEnrolled', JSON.stringify(enrolledCourses));
      if (typeof renderCourses === 'function') renderCourses(courses);
      if (typeof renderEnrollmentPage === 'function') renderEnrollmentPage();
      return;
    }

    if (!window.currentStudentId) {
      await ensureStudentProfile();
    }
    const registrations = await apiFetch(`/registrations?student_id=${encodeURIComponent(window.currentStudentId)}`);
    registrationMap = registrations.reduce((map, reg) => {
      map[String(reg.course_id)] = String(reg.id);
      return map;
    }, {});
    enrolledCourses = registrations.map((reg) => String(reg.course_id));
    localStorage.setItem('eduRegisterEnrolled', JSON.stringify(enrolledCourses));
    if (typeof renderCourses === 'function') renderCourses(courses);
    if (typeof renderEnrollmentPage === 'function') renderEnrollmentPage();
  } catch (error) {
    console.warn('Registration load failed, using local enrollment state.', error);
  }
}

async function initializeBackend() {
  try {
    await initializeSupabaseClient();
    if (window.supabaseConnected) {
      await loadCourses();
      await loadRegistrations();
      return;
    }

    // Admin pages don't need a student profile — skip the creation step so
    // we don't create a spurious student record for admin accounts and avoid
    // an unnecessary round-trip that could mask the course load.
    const isAdminPage = window.location.pathname.includes('admin.html');
    if (!isAdminPage) {
      await ensureStudentProfile();
    }
    await loadCourses();
    if (!isAdminPage) {
      await loadRegistrations();
    }
  } catch (error) {
    console.warn('Backend initialization failed:', error);
    if (!courses.length) {
      courses = defaultCourses.map(normalizeCourse);
      window.courses = courses;
      if (courseGrid) renderCourses(courses);
      if (typeof window.renderCourseAnalytics === 'function') window.renderCourseAnalytics('course-analytics');
    }
    if (typeof renderEnrollmentPage === 'function') renderEnrollmentPage();
  }
}

function saveCourses(courseList) {
  const normalized = (courseList || []).map(normalizeCourse);
  localStorage.setItem('eduRegisterCourses', JSON.stringify(normalized));
  courses = normalized;
  window.courses = normalized;
  return normalized;
}

function showCourseDetailsModal(course) {
  const modal = document.getElementById('details-modal');
  const title = document.getElementById('details-modal-title');
  const description = document.getElementById('details-modal-description');
  const instructor = document.getElementById('details-modal-instructor');
  const schedule = document.getElementById('details-modal-schedule');
  const credits = document.getElementById('details-modal-credits');
  const seats = document.getElementById('details-modal-seats');

  if (!modal || !title) return;
  title.textContent = course.title;
  description.textContent = course.description || 'No course description available.';
  instructor.textContent = course.instructor || 'TBA';
  schedule.textContent = course.schedule || 'TBA';
  credits.textContent = `${course.credits || 0} credits`;
  seats.textContent = `${course.seats || 0}/${course.capacity || 0}`;

  modal.classList.remove('hidden');
  document.body.classList.add('modal-open');
}

function hideCourseDetailsModal() {
  const modal = document.getElementById('details-modal');
  if (!modal) return;
  modal.classList.add('hidden');
  document.body.classList.remove('modal-open');
}

function initializeDetailsModal() {
  const modal = document.getElementById('details-modal');
  const backdrop = document.getElementById('details-modal-backdrop');
  const closeButton = document.getElementById('details-modal-close');
  const okButton = document.getElementById('details-modal-ok');

  if (!modal) return;
  if (backdrop) backdrop.addEventListener('click', hideCourseDetailsModal);
  if (closeButton) closeButton.addEventListener('click', hideCourseDetailsModal);
  if (okButton) okButton.addEventListener('click', hideCourseDetailsModal);
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !modal.classList.contains('hidden')) {
      hideCourseDetailsModal();
    }
  });
}

async function addCourse(courseData) {
  try {
    const created = await createCourseBackend(courseData);
    courses = [...courses, created];
    window.courses = courses;
    if (typeof renderCourses === 'function') renderCourses(courses);
    if (typeof renderEnrollmentPage === 'function') renderEnrollmentPage();
    if (typeof window.renderCourseAnalytics === 'function') window.renderCourseAnalytics('course-analytics');
    return created;
  } catch (error) {
    console.warn('Failed to save course to backend:', error);
    const fallbackCourse = normalizeCourse({ ...courseData, id: courseData.id || `course-${Date.now().toString(36)}`, seats: 0, full: false });
    saveCourses([...courses, fallbackCourse]);
    if (typeof window.renderCourseAnalytics === 'function') window.renderCourseAnalytics('course-analytics');
    return fallbackCourse;
  }
}

let courses = [];
window.courses = courses;
window.addCourse = addCourse;
window.saveCourses = saveCourses;

window.addEventListener('DOMContentLoaded', () => {
  initializeDetailsModal();
  if (!window.location.pathname.includes('index.html') && !window.location.pathname.endsWith('/')) {
    requireAuthPage();
    requireAdminRole();
    updateUserMenu();
    initializeBackend();
    // Sync role from server so DB changes (e.g. made in Supabase) take effect immediately
    syncRoleFromServer();
  } else {
    updateUserMenu();
  }
});

window.addEventListener('storage', (event) => {
  if (event.key === 'eduRegisterCourses') {
    const stored = JSON.parse(event.newValue || 'null');
    if (Array.isArray(stored)) {
      courses = stored.map(normalizeCourse);
      window.courses = courses;
      if (typeof renderCourses === 'function') {
        renderCourses(courses);
      }
    }
    if (typeof renderEnrollmentPage === 'function') {
      renderEnrollmentPage();
    }
    if (typeof window.renderCourseAnalytics === 'function') {
      window.renderCourseAnalytics('course-analytics');
    }
  }
});

function getAuthState() {
  try {
    return JSON.parse(localStorage.getItem('eduRegisterAuthState') || '{}');
  } catch (error) {
    return {};
  }
}

function saveAuthState(state) {
  localStorage.setItem('eduRegisterAuthState', JSON.stringify(state));
}

function setAuthRole(role, name = 'You') {
  const state = getAuthState();
  state.role = role;
  state.name = name;
  saveAuthState(state);
  localStorage.setItem('eduRegisterRole', role);
  return state;
}

window.getAuthState = getAuthState;
window.setAuthRole = setAuthRole;

const storedEnrolled = JSON.parse(localStorage.getItem('eduRegisterEnrolled') || '[]');
let enrolledCourses = storedEnrolled;

const courseGrid = document.getElementById('course-grid');
const searchInput = document.getElementById('search-input');
const filterButtons = document.getElementById('filter-buttons');
const resultCount = document.getElementById('result-count');
const enrollmentPanel = document.getElementById('enrollment-panel');
const summaryEnrolled = document.getElementById('summary-enrolled');
const summaryCredits = document.getElementById('summary-credits');
const exportScheduleButton = document.getElementById('export-schedule');
const printScheduleButton = document.getElementById('print-schedule');
const requestApprovalButton = document.getElementById('request-approval');
const summaryLimit = document.getElementById('summary-limit');

const selectedFilter = { category: 'All', query: '' };
const selectedCourseIds = new Set();

const exportButton = document.getElementById('export-selected');
const bulkRegisterButton = document.getElementById('bulk-register');
const clearSelectionButton = document.getElementById('clear-selection');

// role and admin controls
const roleSelect = document.getElementById('role-select');
const adminDashboardButton = document.getElementById('admin-dashboard');
let enrolmentWindow = JSON.parse(localStorage.getItem('eduRegisterEnrolWindow') || 'true');
const creditLimit = parseInt(localStorage.getItem('eduRegisterCreditLimit') || '18', 10);

function getCurrentEnrolmentWindow() {
  return JSON.parse(localStorage.getItem('eduRegisterEnrolWindow') || 'true');
}

if (roleSelect) {
  updateRoleUI();
  roleSelect.addEventListener('change', () => {
    // Role is set by the server — clicking Admin shows a message and reverts
    const authState = getAuthState();
    const current = normalizeRole(authState.role);
    const selected = normalizeRole(roleSelect.value);
    if (selected !== current) {
      alert('Your role is set by your account. Admins can change it in the Admin Dashboard → Users.');
      roleSelect.value = displayRole(current);
    }
  });
}

if (adminDashboardButton) {
  adminDashboardButton.addEventListener('click', () => {
    // navigate to admin page
    window.location.href = 'admin.html';
  });
}

// Brand icon navigates to admin dashboard for admins, home for others
const brandIcon = document.querySelector('.brand-icon');
if (brandIcon) {
  brandIcon.style.cursor = 'pointer';
  brandIcon.addEventListener('click', () => {
    const role = normalizeRole(localStorage.getItem('eduRegisterRole') || 'student');
    window.location.href = role === 'admin' ? 'admin.html' : 'catalog.html';
  });
}

function updateRoleUI() {
  const authState = getAuthState();
  const role = normalizeRole(authState.role || localStorage.getItem('eduRegisterRole') || 'student');
  localStorage.setItem('eduRegisterRole', role);
  if (roleSelect) {
    const displayVal = displayRole(role);
    if (roleSelect.value !== displayVal) roleSelect.value = displayVal;
  }
  if (adminDashboardButton) adminDashboardButton.style.display = role === 'admin' ? 'inline-block' : 'none';
}

// Sync fresh role from server on every protected page load
async function syncRoleFromServer() {
  const token = getStoredAuthToken();
  if (!token) return;
  try {
    const profile = await apiFetch('/auth/me');
    if (profile && profile.role) {
      const existing = getCurrentUserProfile() || {};
      existing.user = { ...(existing.user || {}), ...profile };
      saveUserProfile(existing);
      saveAuthState({ role: normalizeRole(profile.role), name: profile.name || existing.user.name });
      updateUserMenu();
      updateRoleUI();
    }
  } catch (_) {
    // silently ignore — offline or token expired
  }
}

function getWaitlist() {
  return JSON.parse(localStorage.getItem('eduRegisterWaitlist') || '{}');
}

function saveWaitlist(w) {
  localStorage.setItem('eduRegisterWaitlist', JSON.stringify(w));
}

function joinWaitlist(courseId) {
  const w = getWaitlist();
  if (!w[courseId]) w[courseId] = [];
  w[courseId].push('You');
  saveWaitlist(w);
  alert('You have been added to the waitlist for this course.');
}

function popWaitlist(courseId) {
  const w = getWaitlist();
  if (!w[courseId] || w[courseId].length === 0) return null;
  const next = w[courseId].shift();
  saveWaitlist(w);
  return next;
}

function getApprovalRequests() {
  return JSON.parse(localStorage.getItem('eduRegisterApprovals') || '[]');
}

function saveApprovalRequests(arr) {
  localStorage.setItem('eduRegisterApprovals', JSON.stringify(arr));
}

function submitApprovalRequest(courseId, reason) {
  const arr = getApprovalRequests();
  const req = { id: `req_${Date.now()}`, courseId, requester: 'You', reason: reason || '', status: 'pending', time: new Date().toISOString() };
  arr.push(req);
  saveApprovalRequests(arr);
  alert('Approval request submitted to admin.');
}

function processApprovalRequest(reqId, approve) {
  const arr = getApprovalRequests();
  const idx = arr.findIndex(r => r.id === reqId);
  if (idx === -1) return;
  const req = arr[idx];
  req.status = approve ? 'approved' : 'denied';
  arr[idx] = req;
  saveApprovalRequests(arr);
  if (approve) {
    const c = courses.find(x => x.id === req.courseId);
    if (!c) return alert('Course not found');
    if (c.full || c.seats >= c.capacity) {
      joinWaitlist(c.id);
      return alert('Course full — added requester to waitlist.');
    }
    // enroll requester
    enrolledCourses.push(c.id);
    c.seats = (c.seats || 0) + 1;
    if (c.seats >= c.capacity) c.full = true;
    localStorage.setItem('eduRegisterEnrolled', JSON.stringify(enrolledCourses));
    renderCourses(courses);
    renderEnrollmentPage();
    alert(`Approved and enrolled requester in ${c.title}`);
  }
}

if (courseGrid) {
  renderCourses(courses);
}

if (searchInput) {
  searchInput.addEventListener('input', (event) => {
    selectedFilter.query = event.target.value.toLowerCase();
    renderCourses(courses);
  });
}

if (filterButtons) {
  filterButtons.addEventListener('click', (event) => {
    const button = event.target.closest('button[data-category]');
    if (!button) return;
    selectedFilter.category = button.dataset.category;
    filterButtons.querySelectorAll('button').forEach((chip) => chip.classList.toggle('active', chip === button));
    renderCourses(courses);
  });
}

function renderCourses(courseList) {
  if (!courseGrid) {
    return;
  }

  const filtered = courseList.filter((course) => {
    const text = `${course.title} ${course.code} ${course.instructor} ${course.category}`.toLowerCase();
    const matchesQuery = !selectedFilter.query || text.includes(selectedFilter.query);
    const matchesCategory = selectedFilter.category === 'All' || course.category === selectedFilter.category;
    return matchesQuery && matchesCategory;
  });

  resultCount.textContent = `${filtered.length} course${filtered.length !== 1 ? 's' : ''} found`;

  courseGrid.innerHTML = filtered.map((course) => {
    const enrolled = enrolledCourses.includes(course.id);
    const loadRatio = Math.min(100, Math.round((course.seats / course.capacity) * 100));
    const isSelected = selectedCourseIds.has(course.id);

    // Seat bar colour + glow (Dark Academic palette)
    let seatBg, seatGlow;
    if (course.full || loadRatio >= 90) {
      seatBg = '#e11d48'; seatGlow = 'rgba(225,29,72,0.4)';
    } else if (loadRatio >= 70) {
      seatBg = '#f59e0b'; seatGlow = 'rgba(245,158,11,0.4)';
    } else {
      seatBg = '#10b981'; seatGlow = 'rgba(16,185,129,0.4)';
    }
    const barStyle = `width:${loadRatio}%;background:${seatBg};box-shadow:0 0 10px ${seatGlow}`;

    // Action button
    let actionBtn;
    if (course.full) {
      actionBtn = `<button class="cc-action cc-action--full" data-course-id="${course.id}" disabled>Course Full</button>`;
    } else if (enrolled) {
      actionBtn = `<button class="cc-action cc-action--enrolled" data-course-id="${course.id}">&#10003; Enrolled</button>`;
    } else {
      actionBtn = `<button class="cc-action cc-action--register" data-course-id="${course.id}">Register</button>`;
    }

    return `
      <article class="course-card${isSelected ? ' selected' : ''}">
        <!-- Dark navy header band -->
        <div class="cc-header">
          <div class="cc-header-left">
            <input type="checkbox" class="cc-checkbox select-checkbox" data-select-id="${course.id}"
              aria-label="Select ${course.title}" ${isSelected ? 'checked' : ''} />
            <span class="cc-code">${course.code}</span>
            <span class="cc-category">${course.category}</span>
          </div>
          <div class="cc-rating">&#9733; ${course.rating}</div>
        </div>
        <!-- Card body -->
        <div class="cc-body">
          <div class="cc-title-wrap">
            <h2 class="cc-title">${course.title}</h2>
            <div class="cc-meta">
              <span>&#128100; ${course.instructor}</span>
              <span class="cc-sep">|</span>
              <span>&#128197; ${course.schedule}</span>
              <span class="cc-sep">|</span>
              <span>&#128218; ${course.credits} Credits</span>
            </div>
          </div>
          <p class="cc-description">${course.description}</p>
          <!-- Seat bar -->
          <div class="cc-seats">
            <div class="cc-seats-top">
              <span class="cc-seats-label">Seat Availability</span>
              <span class="cc-seats-count">${course.seats} / ${course.capacity} (${loadRatio}%)</span>
            </div>
            <div class="cc-bar-track">
              <div class="cc-bar-fill" style="${barStyle}"></div>
            </div>
          </div>
          <!-- Footer -->
          <div class="cc-footer">
            <button class="cc-details-btn" data-details-id="${course.id}">View Details &#8594;</button>
            ${actionBtn}
          </div>
        </div>
      </article>
    `;
  }).join('');

  // register buttons
  courseGrid.querySelectorAll('[data-course-id]').forEach((button) => {
    button.addEventListener('click', () => {
      const courseId = button.dataset.courseId;
      enrollCourse(courseId);
    });
  });

  // details buttons
  courseGrid.querySelectorAll('.cc-details-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.detailsId;
      const course = courses.find(c => c.id === id);
      if (course) {
        showCourseDetailsModal(course);
      }
    });
  });

  // selection checkboxes
  courseGrid.querySelectorAll('.select-checkbox').forEach((cb) => {
    cb.addEventListener('change', (e) => {
      const id = cb.dataset.selectId;
      if (cb.checked) selectedCourseIds.add(id);
      else selectedCourseIds.delete(id);
    });
  });
}

if (exportButton) {
  exportButton.addEventListener('click', () => {
    exportSelected();
  });
}

if (bulkRegisterButton) {
  bulkRegisterButton.addEventListener('click', async () => {
    await bulkRegisterSelected();
  });
}

if (clearSelectionButton) {
  clearSelectionButton.addEventListener('click', () => {
    selectedCourseIds.clear();
    renderCourses(courses);
  });
}

function exportSelected() {
  if (selectedCourseIds.size === 0) {
    alert('No courses selected to export.');
    return;
  }
  const rows = [['Code','Title','Instructor','Schedule','Credits']];
  courses.filter(c => selectedCourseIds.has(c.id)).forEach(c => rows.push([c.code, c.title, c.instructor, c.schedule, c.credits]));
  const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'selected-courses.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function bulkRegisterSelected() {
  if (selectedCourseIds.size === 0) {
    alert('No courses selected to register.');
    return;
  }
  const toRegister = courses.filter(c => selectedCourseIds.has(c.id));
  for (const c of toRegister) {
    if (!getCurrentEnrolmentWindow()) {
      continue;
    }
    if (c.prereqs && c.prereqs.length) {
      const missing = c.prereqs.filter(p => !enrolledCourses.includes(p));
      if (missing.length) {
        submitApprovalRequest(c.id, `Bulk register requested; missing prerequisites: ${missing.join(', ')}`);
        continue;
      }
    }
    const currentCredits = courses.filter(x => enrolledCourses.includes(x.id)).reduce((s, x) => s + x.credits, 0);
    if (currentCredits + c.credits > creditLimit) {
      submitApprovalRequest(c.id, `Exceeds credit limit (${creditLimit}). Requesting approval.`);
      continue;
    }
    if (c.full || c.seats >= c.capacity) {
      joinWaitlist(c.id);
      continue;
    }
    await enrollCourse(c.id);
  }
  selectedCourseIds.clear();
  renderCourses(courses);
  renderEnrollmentPage();
  alert('Bulk registration completed for selected courses.');
}

async function enrollCourse(courseId) {
  const course = courses.find((item) => item.id === courseId);
  if (!course) return;
  if (!getCurrentEnrolmentWindow()) {
    alert('Enrollment window is currently closed.');
    return;
  }
  if (enrolledCourses.includes(courseId)) {
    alert('You are already enrolled in this course.');
    return;
  }
  if (course.prereqs && course.prereqs.length) {
    const missing = course.prereqs.filter(p => !enrolledCourses.includes(p));
    if (missing.length) {
      if (confirm(`Missing prerequisites: ${missing.join(', ')}. Would you like to request admin approval instead?`)) {
        const reason = prompt('Enter justification for approval request:');
        submitApprovalRequest(courseId, reason);
      }
      return;
    }
  }
  if (course.full || course.seats >= course.capacity) {
    if (confirm('Course is full. Join waitlist?')) {
      joinWaitlist(courseId);
    }
    return;
  }
  const currentCredits = courses.filter(x => enrolledCourses.includes(x.id)).reduce((s, x) => s + x.credits, 0);
  if (currentCredits + course.credits > creditLimit) {
    if (confirm(`Enrolling in this course would exceed your credit limit (${creditLimit}). Request admin approval?`)) {
      const reason = prompt('Enter justification for exceeding credit limit:');
      submitApprovalRequest(courseId, reason);
    }
    return;
  }
  try {
    await initializeSupabaseClient();
    if (window.supabaseConnected) {
      await saveRegistrationToSupabase(courseId);
      registrationMap[courseId] = String(Date.now());
      enrolledCourses.push(courseId);
      course.seats = (course.seats || 0) + 1;
      course.full = course.seats >= course.capacity;
      await syncSupabaseCourseSeats(courseId, course.seats, course.full);
      localStorage.setItem('eduRegisterEnrolled', JSON.stringify(enrolledCourses));
      renderCourses(courses);
      renderEnrollmentPage();
      alert(`Registered for ${course.title}!`);
      return;
    }

    const registration = await apiFetch('/registrations', {
      method: 'POST',
      body: JSON.stringify({
        course_id: Number(courseId),
        student_id: Number(window.currentStudentId),
      }),
    });
    registrationMap[courseId] = String(registration.id);
    enrolledCourses.push(courseId);
    course.seats = (course.seats || 0) + 1;
    course.full = course.seats >= course.capacity;
    localStorage.setItem('eduRegisterEnrolled', JSON.stringify(enrolledCourses));
    renderCourses(courses);
    renderEnrollmentPage();
    alert(`Registered for ${course.title}!`);
  } catch (error) {
    console.warn('Enrollment failed:', error);
    alert('Unable to register for the course at this time. Please try again later.');
  }
}

function renderEnrollmentPage() {
  if (!enrollmentPanel) return;

  if (enrolledCourses.length === 0) {
    enrollmentPanel.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📘</div>
        <h2>No courses yet</h2>
        <p>Head to the Course Catalog to find and register for courses.</p>
        <a class="primary-button" href="catalog.html">Browse Catalog</a>
      </div>
    `;
    summaryEnrolled.textContent = '0';
    summaryCredits.textContent = '0';
    return;
  }

  const selectedCourses = courses.filter((course) => enrolledCourses.includes(course.id));
  const totalCredits = selectedCourses.reduce((sum, course) => sum + course.credits, 0);

  summaryEnrolled.textContent = selectedCourses.length;
  summaryCredits.textContent = totalCredits;
  if (summaryLimit) summaryLimit.textContent = creditLimit;

  enrollmentPanel.innerHTML = `
    <div class="course-list">
      ${selectedCourses.map((course) => {
        const loadRatio = Math.min(100, Math.round((course.seats / course.capacity) * 100));
        let seatBg, seatGlow;
        if (loadRatio >= 90) {
          seatBg = '#e11d48'; seatGlow = 'rgba(225,29,72,0.4)';
        } else if (loadRatio >= 70) {
          seatBg = '#f59e0b'; seatGlow = 'rgba(245,158,11,0.4)';
        } else {
          seatBg = '#10b981'; seatGlow = 'rgba(16,185,129,0.4)';
        }
        const barStyle = `width:${loadRatio}%;background:${seatBg};box-shadow:0 0 10px ${seatGlow}`;
        return `
        <article class="course-card enrolled-course">
          <div class="cc-header">
            <div class="cc-header-left">
              <span class="cc-code">${course.code}</span>
              <span class="cc-category">${course.category}</span>
            </div>
            <div class="cc-rating">&#9733; ${course.rating}</div>
          </div>
          <div class="cc-body">
            <div class="cc-title-wrap">
              <h2 class="cc-title">${course.title}</h2>
              <div class="cc-meta">
                <span>&#128100; ${course.instructor}</span>
                <span class="cc-sep">|</span>
                <span>&#128197; ${course.schedule}</span>
                <span class="cc-sep">|</span>
                <span>&#128218; ${course.credits} Credits</span>
              </div>
            </div>
            <p class="cc-description">${course.description}</p>
            <div class="cc-seats">
              <div class="cc-seats-top">
                <span class="cc-seats-label">Seat Availability</span>
                <span class="cc-seats-count">${course.seats} / ${course.capacity} (${loadRatio}%)</span>
              </div>
              <div class="cc-bar-track">
                <div class="cc-bar-fill" style="${barStyle}"></div>
              </div>
            </div>
            <div class="cc-footer">
              <button class="cc-details-btn" data-details-id="${course.id}">View Details &#8594;</button>
              <button class="cc-action cc-action--drop danger-button" data-remove-id="${course.id}">Drop Course</button>
            </div>
          </div>
        </article>`
      }).join('')}
    </div>
  `;

  // attach detail buttons
  enrollmentPanel.querySelectorAll('.cc-details-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.detailsId;
      const course = courses.find(c => c.id === id);
      if (course) {
        showCourseDetailsModal(course);
      }
    });
  });

  // attach drop/delete buttons
  const deleteButtons = enrollmentPanel.querySelectorAll('[data-remove-id]');
  deleteButtons.forEach((button) => {
    button.addEventListener('click', () => {
      const courseId = button.dataset.removeId;
      removeCourse(courseId);
    });
  });
}

async function removeCourse(courseId) {
  const course = courses.find((item) => item.id === courseId);
  const registrationId = registrationMap[courseId];
  enrolledCourses = enrolledCourses.filter((id) => id !== courseId);
  if (course) {
    course.seats = Math.max(0, (course.seats || 1) - 1);
    course.full = course.seats >= course.capacity;
  }
  localStorage.setItem('eduRegisterEnrolled', JSON.stringify(enrolledCourses));

  if (registrationId) {
    try {
      await apiFetch(`/registrations/${registrationId}`, { method: 'DELETE' });
      delete registrationMap[courseId];
    } catch (error) {
      console.warn('Failed to remove registration from backend:', error);
    }
  }

  const next = popWaitlist(courseId);
  if (next && course) {
    enrolledCourses.push(courseId);
    course.seats = (course.seats || 0) + 1;
    course.full = course.seats >= course.capacity;
    localStorage.setItem('eduRegisterEnrolled', JSON.stringify(enrolledCourses));
    alert(`A student from the waitlist was enrolled in ${course.title}.`);
  }
  renderCourses(courses);
  renderEnrollmentPage();
  if (course) {
    alert(`Removed ${course.title} from your enrolled courses.`);
  }
}

renderEnrollmentPage();

function showAdminDashboard() {
  const enrolledCount = enrolledCourses.length;
  const waitlist = getWaitlist();
  const waitlistCounts = Object.keys(waitlist).reduce((acc, k) => acc + (waitlist[k] || []).length, 0);
  const totalCourses = courses.length;
  const fullCourses = courses.filter(c => c.full).length;
  const msg = `Admin Dashboard:\nEnrolled students (you): ${enrolledCount}\nWaitlist entries: ${waitlistCounts}\nTotal courses: ${totalCourses}\nFull courses: ${fullCourses}\nEnrollment window: ${enrolmentWindow ? 'Open' : 'Closed'}`;
  if (!confirm(msg + '\n\nToggle enrolment window?')) {
    // offer to view pending approvals
    const apr = getApprovalRequests().filter(r => r.status === 'pending');
    if (apr.length && confirm('View and process pending approval requests?')) {
      for (const r of apr) {
        const course = courses.find(c => c.id === r.courseId);
        const detail = `Request ID: ${r.id}\nCourse: ${r.courseId} - ${course ? course.title : ''}\nRequester: ${r.requester}\nReason: ${r.reason}\nSubmitted: ${r.time}`;
        const doApprove = confirm(detail + '\n\nApprove this request? (Cancel = Deny)');
        processApprovalRequest(r.id, doApprove);
      }
    }
    return;
  }
  enrolmentWindow = !enrolmentWindow;
  localStorage.setItem('eduRegisterEnrolWindow', JSON.stringify(enrolmentWindow));
  alert('Enrollment window set to ' + (enrolmentWindow ? 'Open' : 'Closed'));
}

if (exportScheduleButton) {
  exportScheduleButton.addEventListener('click', () => {
    const enrolled = enrolledCourses.map(id => courses.find(c => c.id === id)).filter(Boolean);
    if (enrolled.length === 0) return alert('No enrolled courses to export.');
    const rows = [['Code','Title','Instructor','Schedule','Credits']];
    enrolled.forEach(c => rows.push([c.code, c.title, c.instructor, c.schedule, c.credits]));
    const csv = rows.map(r => r.map(cell => `"${String(cell).replace(/"/g,'""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'my-courses.csv';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  });
}

if (printScheduleButton) {
  printScheduleButton.addEventListener('click', () => {
    window.print();
  });
}

if (requestApprovalButton) {
  requestApprovalButton.addEventListener('click', () => {
    const reason = prompt('Enter reason for approval request (e.g., override prerequisites):');
    if (reason) {
      alert('Approval request submitted. (mock)');
    }
  });
}
