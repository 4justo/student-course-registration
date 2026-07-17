// helper script for admin.html added features
function getActivityLog() {
  try {
    return JSON.parse(localStorage.getItem('eduRegisterActivity') || '[]');
  } catch (error) {
    return [];
  }
}

function saveActivityLog(items) {
  localStorage.setItem('eduRegisterActivity', JSON.stringify(items));
}

function recordActivity(text, courseId) {
  const entry = {
    id: `act_${Date.now()}`,
    text,
    courseId: courseId || '',
    time: new Date().toISOString()
  };
  const items = getActivityLog();
  items.unshift(entry);
  saveActivityLog(items.slice(0, 100));
  return entry;
}

function renderEnrollmentsChart(canvasId) {
  const ctx = document.getElementById(canvasId);
  if (!ctx || !window.courses || typeof Chart === 'undefined') return;

  const departmentFilter = document.getElementById('chart-department-filter')?.value || 'All';
  const fromDate = document.getElementById('chart-from-date')?.value || '';
  const toDate = document.getElementById('chart-to-date')?.value || '';

  const filteredEntries = getActivityLog().filter((entry) => {
    const course = window.courses.find((c) => c.id === entry.courseId);
    const matchesDepartment = departmentFilter === 'All' || (course && course.category === departmentFilter);
    const ts = new Date(entry.time);
    const matchesFrom = !fromDate || ts >= new Date(fromDate);
    const matchesTo = !toDate || ts <= new Date(`${toDate}T23:59:59`);
    return matchesDepartment && matchesFrom && matchesTo;
  });

  const buckets = {};
  filteredEntries.forEach((entry) => {
    const day = new Date(entry.time).toISOString().slice(0, 10);
    buckets[day] = (buckets[day] || 0) + 1;
  });

  const labels = Object.keys(buckets).sort();
  const data = labels.map((label) => buckets[label]);

  if (window._enrollChart) {
    window._enrollChart.data.labels = labels.length ? labels : ['No data'];
    window._enrollChart.data.datasets[0].data = labels.length ? data : [0];
    window._enrollChart.update();
    return;
  }

  window._enrollChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [{
        label: 'Admin activity',
        data: labels.length ? data : [0],
        borderColor: '#1d5f3a',
        backgroundColor: 'rgba(29, 95, 58, 0.16)',
        tension: 0.3,
        fill: true
      }]
    },
    options: { responsive: true, maintainAspectRatio: false }
  });
}

function renderCourseAnalytics(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const courseList = window.courses || [];
  if (!courseList.length) {
    container.innerHTML = '<div class="empty-state">No course data yet.</div>';
    return;
  }
  courseList.forEach((course) => {
    const seats = Number(course.seats) || 0;
    const capacity = Number(course.capacity) || 1;
    const ratio = Math.min(100, Math.round((seats / capacity) * 100));
    const fillColor = course.full || ratio >= 90 ? '#c0392b' : ratio >= 70 ? '#e67e22' : '#2b8e55';
    const statusLabel = course.full ? 'Full' : ratio >= 90 ? 'Nearly full' : ratio >= 70 ? 'Filling up' : 'Available';
    const statusBg    = course.full ? '#fde8e8' : ratio >= 90 ? '#fef3e2' : ratio >= 70 ? '#fef9e7' : '#e8f5ed';
    const statusColor = course.full ? '#9d2618' : ratio >= 90 ? '#b45309' : ratio >= 70 ? '#92400e' : '#1a6640';

    const el = document.createElement('div');
    el.className = 'analytics-row';
    el.innerHTML = `
      <div class="analytics-row-header">
        <div class="analytics-row-info">
          <div class="analytics-row-title"><strong>${course.code}</strong> &mdash; ${course.title}</div>
          <div class="analytics-row-meta muted">${course.category} &bull; ${course.instructor}</div>
        </div>
        <span class="analytics-status-badge" style="background:${statusBg};color:${statusColor}">${statusLabel}</span>
      </div>
      <div class="analytics-bar-row">
        <div class="analytics-bar-wrap">
          <div class="analytics-bar-fill" style="width:${ratio}%;background:${fillColor}"></div>
        </div>
        <span class="analytics-bar-label" style="color:${fillColor}">${seats}/${capacity}&nbsp;(${ratio}%)</span>
      </div>
    `;
    container.appendChild(el);
  });
}

function getUsers() {
  const saved = JSON.parse(localStorage.getItem('eduRegisterUsers') || '[]');
  if (saved.length) return saved;
  const defaults = [
    { id: 'u_admin', name: 'Admin User', email: 'admin@university.edu', role: 'admin' },
    { id: 'u_student', name: 'Student User', email: 'student@university.edu', role: 'student' }
  ];
  saveUsers(defaults);
  return defaults;
}

function saveUsers(users) {
  localStorage.setItem('eduRegisterUsers', JSON.stringify(users));
}

function addUser(name, email, role) {
  const users = getUsers();
  users.push({ id: `u_${Date.now()}`, name, email, role });
  saveUsers(users);
  return users[users.length - 1];
}

function updateUser(userId, updates) {
  const users = getUsers();
  const target = users.find((user) => user.id === userId);
  if (!target) return null;
  Object.assign(target, updates);
  saveUsers(users);
  return target;
}

function setCurrentUser(user) {
  const state = { name: user.name, email: user.email, role: user.role };
  localStorage.setItem('eduRegisterAuthState', JSON.stringify(state));
  localStorage.setItem('eduRegisterRole', user.role);
  return state;
}

function renderUsers(containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = '';
  const users = getUsers();
  if (users.length === 0) {
    container.innerHTML = '<div class="empty-state">No users</div>';
    return;
  }
  users.forEach((user) => {
    const el = document.createElement('div');
    el.className = 'row-item';
    el.innerHTML = `
      <div class="user-row">
        <input class="user-name" value="${user.name}" />
        <input class="user-email" value="${user.email}" />
        <select class="user-role">
          <option value="Student" ${user.role === 'Student' ? 'selected' : ''}>Student</option>
          <option value="Admin" ${user.role === 'Admin' ? 'selected' : ''}>Admin</option>
        </select>
      </div>
    `;
    const actions = document.createElement('div');
    actions.className = 'row-actions';
    const saveButton = document.createElement('button');
    saveButton.className = 'secondary-button';
    saveButton.textContent = 'Save';
    saveButton.addEventListener('click', () => {
      const name = el.querySelector('.user-name').value.trim();
      const email = el.querySelector('.user-email').value.trim();
      const role = el.querySelector('.user-role').value;
      if (!name || !email) return alert('Please enter a name and email');
      updateUser(user.id, { name, email, role });
      renderUsers(containerId);
      recordActivity(`Updated user ${name}`, '');
    });

    const signInButton = document.createElement('button');
    signInButton.className = 'secondary-button';
    signInButton.textContent = 'Sign in';
    signInButton.addEventListener('click', () => {
      setCurrentUser({ ...user, role: el.querySelector('.user-role').value });
      alert(`Signed in as ${user.name}`);
    });

    const del = document.createElement('button');
    del.className = 'danger-button';
    del.textContent = 'Delete';
    del.addEventListener('click', () => {
      if (confirm('Delete user?')) {
        const next = getUsers().filter((item) => item.id !== user.id);
        saveUsers(next);
        renderUsers(containerId);
      }
    });

    actions.append(saveButton, signInButton, del);
    el.appendChild(actions);
    container.appendChild(el);
  });
}

function exportWaitlistCSV() {
  const waitlist = JSON.parse(localStorage.getItem('eduRegisterWaitlist') || '{}');
  const rows = [['CourseCode', 'CourseTitle', 'WaitlistedUsers']];
  Object.keys(waitlist).forEach((courseId) => {
    const course = (window.courses || []).find((c) => c.id === courseId);
    rows.push([courseId, course ? course.title : '', (waitlist[courseId] || []).join('; ')]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'waitlist.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportApprovalsCSV() {
  const approvals = JSON.parse(localStorage.getItem('eduRegisterApprovals') || '[]');
  const rows = [['Requester', 'CourseCode', 'CourseTitle', 'Reason', 'Status', 'Time']];
  approvals.forEach((approval) => {
    const course = (window.courses || []).find((c) => c.id === approval.courseId);
    rows.push([approval.requester || 'Unknown', approval.courseId || '', course ? course.title : '', approval.reason || '', approval.status || '', approval.time || '']);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'approvals.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function exportEnrollmentsEnhanced() {
  const enrolledIds = JSON.parse(localStorage.getItem('eduRegisterEnrolled') || '[]');
  const users = getUsers();
  const rows = [['Student', 'Email', 'CourseCode', 'Title']];
  const defaultUser = users[0] || { name: 'You', email: 'you@university.edu' };
  enrolledIds.forEach((id) => {
    const course = (window.courses || []).find((item) => item.id === id);
    if (course) rows.push([defaultUser.name, defaultUser.email, course.code, course.title]);
  });
  const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'enrollments_detailed.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

// expose to global for admin inline script
window.renderEnrollmentsChart = renderEnrollmentsChart;
window.renderCourseAnalytics = renderCourseAnalytics;
window.renderUsers = renderUsers;
window.addUser = addUser;
window.updateUser = updateUser;
window.setCurrentUser = setCurrentUser;
window.exportEnrollmentsEnhanced = exportEnrollmentsEnhanced;
window.exportWaitlistCSV = exportWaitlistCSV;
window.exportApprovalsCSV = exportApprovalsCSV;
window.getUsers = getUsers;
window.saveUsers = saveUsers;
window.recordActivity = recordActivity;