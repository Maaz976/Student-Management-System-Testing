// js/app.js - Main application logic

let currentAdmin = null;
let allStudents = [];
let allSubjects = [];
let editingStudentId = null;
let editingSubjectId = null;
let attendanceState = {};
let currentAttendanceDate = '';

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', async () => {
  Toast.init();
  await checkAuth();
  setupEventListeners();
});

async function checkAuth() {
  try {
    const res = await Auth.me();
    if (res.success) {
      currentAdmin = res.admin;
      showApp();
    } else {
      showLogin();
    }
  } catch {
    showLogin();
  }
}

function showLogin() {
  document.getElementById('login-page').classList.remove('hidden');
  document.getElementById('app-page').classList.add('hidden');
}

function showApp() {
  document.getElementById('login-page').classList.add('hidden');
  document.getElementById('app-page').classList.remove('hidden');
  document.getElementById('admin-name').textContent = currentAdmin?.name || 'Admin';
  document.getElementById('date-badge').textContent = new Date().toLocaleDateString('en-IN', {
    weekday: 'short', day: '2-digit', month: 'short', year: 'numeric'
  });
  navigateTo('dashboard');
}

// ===== AUTH =====
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = e.target.querySelector('button[type="submit"]');
  const errorEl = document.getElementById('login-error');
  errorEl.classList.add('hidden');
  setButtonLoading(btn, true);

  try {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const res = await Auth.login(username, password);
    if (res.success) {
      currentAdmin = res.admin;
      showApp();
    }
  } catch (err) {
    errorEl.textContent = err.message || 'Login failed. Please try again.';
    errorEl.classList.remove('hidden');
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById('logout-btn').addEventListener('click', async () => {
  if (!confirmAction('Are you sure you want to logout?')) return;
  try {
    await Auth.logout();
    currentAdmin = null;
    showLogin();
    Toast.success('Logged out successfully');
  } catch {
    showLogin();
  }
});

// ===== NAVIGATION =====
function setupEventListeners() {
  // Nav items
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => navigateTo(item.dataset.page));
  });

  // Mobile sidebar
  document.getElementById('hamburger').addEventListener('click', () => {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebar-overlay').classList.toggle('active');
  });

  document.getElementById('sidebar-overlay').addEventListener('click', () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebar-overlay').classList.remove('active');
  });

  // Modal close on overlay click
  document.querySelectorAll('.modal-overlay').forEach(overlay => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) Modal.closeAll();
    });
  });

  document.querySelectorAll('.modal-close').forEach(btn => {
    btn.addEventListener('click', () => Modal.closeAll());
  });
}

async function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`.nav-item[data-page="${page}"]`)?.classList.add('active');

  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  document.getElementById(`page-${page}`)?.classList.add('active');

  // Close mobile sidebar
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebar-overlay').classList.remove('active');

  // Update topbar title
  const titles = {
    dashboard: ['Dashboard', 'Welcome back, ' + (currentAdmin?.name || 'Admin')],
    students: ['Students', 'Manage student records'],
    subjects: ['Subjects', 'Manage curriculum subjects'],
    attendance: ['Attendance', 'Track daily attendance'],
    marks: ['Marks & Results', 'Enter and view student results']
  };
  const [title, subtitle] = titles[page] || [page, ''];
  document.getElementById('page-title').textContent = title;
  document.getElementById('page-subtitle').textContent = subtitle;

  // Load page data
  if (page === 'dashboard') await loadDashboard();
  else if (page === 'students') await loadStudents();
  else if (page === 'subjects') await loadSubjects();
  else if (page === 'attendance') await loadAttendance();
  else if (page === 'marks') await loadMarks();
}

// ===== DASHBOARD =====
async function loadDashboard() {
  try {
    const [statsRes, studentsRes, subjectsRes] = await Promise.all([
      Marks.dashboard(),
      Students.getAll(),
      Subjects.getAll()
    ]);

    const stats = statsRes.data;
    document.getElementById('stat-students').textContent = stats.totalStudents;
    document.getElementById('stat-subjects').textContent = stats.totalSubjects;
    document.getElementById('stat-attendance').textContent = stats.attendancePercentage + '%';
    document.getElementById('stat-avg').textContent = stats.avgPercentage + '%';

    renderRecentStudents(studentsRes.data.slice(-5).reverse());
    renderClassChart(studentsRes.data);
  } catch (err) {
    Toast.error('Failed to load dashboard');
  }
}

function renderRecentStudents(students) {
  const tbody = document.getElementById('recent-students-tbody');
  if (!students.length) {
    tbody.innerHTML = '<tr><td colspan="5" class="text-center"><div class="empty-state"><div class="empty-icon">👥</div><p>No students yet</p></div></td></tr>';
    return;
  }
  tbody.innerHTML = students.map(s => `
    <tr>
      <td><div class="student-name">${s.fullName}</div><div class="student-id">${s.id}</div></td>
      <td><span class="badge badge-info">Class ${s.class}-${s.section}</span></td>
      <td>${s.rollNumber}</td>
      <td>${s.email || '-'}</td>
      <td>${formatDate(s.createdAt)}</td>
    </tr>
  `).join('');
}

function renderClassChart(students) {
  const classCounts = {};
  students.forEach(s => { classCounts[`${s.class}-${s.section}`] = (classCounts[`${s.class}-${s.section}`] || 0) + 1; });
  const classes = Object.keys(classCounts).sort();
  const max = Math.max(...Object.values(classCounts), 1);
  const colors = ['var(--primary)', 'var(--success)', 'var(--warning)', 'var(--info)', '#8b5cf6'];

  const chart = document.getElementById('class-chart');
  if (classes.length === 0) {
    chart.innerHTML = '<div class="empty-state"><p>No data yet</p></div>';
    return;
  }
  chart.innerHTML = `<div class="bar-chart">${classes.map((cls, i) => `
    <div class="bar-item">
      <div class="bar-value">${classCounts[cls]}</div>
      <div class="bar" style="height:${(classCounts[cls]/max)*100}px; background:${colors[i % colors.length]};"></div>
      <div class="bar-label">${cls}</div>
    </div>
  `).join('')}</div>`;
}

// ===== STUDENTS =====
async function loadStudents(search = '') {
  try {
    const res = await Students.getAll(search);
    allStudents = res.data;
    renderStudentsTable(allStudents);
  } catch {
    Toast.error('Failed to load students');
  }
}

function renderStudentsTable(students) {
  const tbody = document.getElementById('students-tbody');
  if (!students.length) {
    tbody.innerHTML = `<tr><td colspan="7"><div class="empty-state"><div class="empty-icon">👨‍🎓</div><h3>No students found</h3><p>Add your first student to get started</p></div></td></tr>`;
    return;
  }
  tbody.innerHTML = students.map(s => `
    <tr>
      <td><span class="badge badge-secondary">${s.id}</span></td>
      <td><div class="student-name">${s.fullName}</div></td>
      <td><span class="badge badge-info">Class ${s.class}-${s.section}</span></td>
      <td>${s.rollNumber}</td>
      <td>${formatDate(s.dob)}</td>
      <td>${s.phone || '-'}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-warning btn-sm" onclick="openEditStudent('${s.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteStudent('${s.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// Search students
const searchStudents = debounce((val) => loadStudents(val), 350);
document.getElementById('student-search').addEventListener('input', (e) => searchStudents(e.target.value));

// Open add student modal
document.getElementById('btn-add-student').addEventListener('click', () => {
  editingStudentId = null;
  document.getElementById('student-modal-title').textContent = '➕ Add New Student';
  document.getElementById('student-form').reset();
  Modal.open('student-modal');
});

function openEditStudent(id) {
  const student = allStudents.find(s => s.id === id);
  if (!student) return;
  editingStudentId = id;
  document.getElementById('student-modal-title').textContent = '✏️ Edit Student';
  objectToForm(document.getElementById('student-form'), {
    fullName: student.fullName,
    class: student.class,
    section: student.section,
    rollNumber: student.rollNumber,
    dob: student.dob,
    email: student.email,
    phone: student.phone,
    address: student.address
  });
  Modal.open('student-modal');
}

document.getElementById('student-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-student-btn');
  setButtonLoading(btn, true);
  const data = formToObject(e.target);
  try {
    if (editingStudentId) {
      await Students.update(editingStudentId, data);
      Toast.success('Student updated successfully');
    } else {
      await Students.create(data);
      Toast.success('Student added successfully');
    }
    Modal.close('student-modal');
    loadStudents();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

async function deleteStudent(id) {
  if (!confirmAction('Are you sure you want to delete this student?')) return;
  try {
    await Students.delete(id);
    Toast.success('Student deleted');
    loadStudents();
  } catch (err) {
    Toast.error(err.message);
  }
}

// ===== SUBJECTS =====
async function loadSubjects() {
  try {
    const res = await Subjects.getAll();
    allSubjects = res.data;
    renderSubjectsTable(allSubjects);
  } catch {
    Toast.error('Failed to load subjects');
  }
}

function renderSubjectsTable(subjects) {
  const tbody = document.getElementById('subjects-tbody');
  if (!subjects.length) {
    tbody.innerHTML = `<tr><td colspan="5"><div class="empty-state"><div class="empty-icon">📚</div><h3>No subjects yet</h3></div></td></tr>`;
    return;
  }
  tbody.innerHTML = subjects.map(s => `
    <tr>
      <td><span class="badge badge-secondary">${s.id}</span></td>
      <td><strong>${s.name}</strong></td>
      <td><span class="badge badge-info">${s.code}</span></td>
      <td>${s.class}</td>
      <td>${s.maxMarks}</td>
      <td>
        <div style="display:flex;gap:6px;">
          <button class="btn btn-warning btn-sm" onclick="openEditSubject('${s.id}')">✏️ Edit</button>
          <button class="btn btn-danger btn-sm" onclick="deleteSubject('${s.id}')">🗑️</button>
        </div>
      </td>
    </tr>
  `).join('');
}

document.getElementById('btn-add-subject').addEventListener('click', () => {
  editingSubjectId = null;
  document.getElementById('subject-modal-title').textContent = '➕ Add Subject';
  document.getElementById('subject-form').reset();
  Modal.open('subject-modal');
});

function openEditSubject(id) {
  const subject = allSubjects.find(s => s.id === id);
  if (!subject) return;
  editingSubjectId = id;
  document.getElementById('subject-modal-title').textContent = '✏️ Edit Subject';
  objectToForm(document.getElementById('subject-form'), {
    name: subject.name, code: subject.code, class: subject.class, maxMarks: subject.maxMarks
  });
  Modal.open('subject-modal');
}

document.getElementById('subject-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-subject-btn');
  setButtonLoading(btn, true);
  const data = formToObject(e.target);
  try {
    if (editingSubjectId) {
      await Subjects.update(editingSubjectId, data);
      Toast.success('Subject updated');
    } else {
      await Subjects.create(data);
      Toast.success('Subject added');
    }
    Modal.close('subject-modal');
    loadSubjects();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

async function deleteSubject(id) {
  if (!confirmAction('Delete this subject?')) return;
  try {
    await Subjects.delete(id);
    Toast.success('Subject deleted');
    loadSubjects();
  } catch (err) {
    Toast.error(err.message);
  }
}

// ===== ATTENDANCE =====
async function loadAttendance() {
  const dateInput = document.getElementById('attendance-date');
  if (!dateInput.value) {
    dateInput.value = todayStr();
  }
  currentAttendanceDate = dateInput.value;
  await renderAttendanceGrid();
}

async function renderAttendanceGrid() {
  const classFilter = document.getElementById('att-class-filter').value;
  try {
    const [studentsRes, attRes] = await Promise.all([
      Students.getAll(),
      Attendance.getAll({ date: currentAttendanceDate })
    ]);

    let students = studentsRes.data;
    if (classFilter) students = students.filter(s => s.class === classFilter);

    // Map existing attendance
    attendanceState = {};
    attRes.data.forEach(r => { attendanceState[r.studentId] = r.status; });

    const grid = document.getElementById('attendance-grid');
    if (!students.length) {
      grid.innerHTML = '<div class="empty-state"><div class="empty-icon">📋</div><h3>No students found</h3></div>';
      return;
    }

    grid.innerHTML = students.map(s => {
      const status = attendanceState[s.id] || '';
      return `
        <div class="attendance-card" id="att-card-${s.id}">
          <div class="att-info">
            <h4>${s.fullName}</h4>
            <span>Class ${s.class}-${s.section} · Roll ${s.rollNumber}</span>
          </div>
          <div class="att-toggle">
            <button class="att-btn ${status === 'present' ? 'present-active' : ''}" 
              onclick="markAttendance('${s.id}', 'present')">✓ P</button>
            <button class="att-btn ${status === 'absent' ? 'absent-active' : ''}" 
              onclick="markAttendance('${s.id}', 'absent')">✗ A</button>
          </div>
        </div>
      `;
    }).join('');

    // Update stats
    updateAttendanceStats(students.length);
  } catch (err) {
    Toast.error('Failed to load attendance');
  }
}

function markAttendance(studentId, status) {
  attendanceState[studentId] = status;
  const card = document.getElementById(`att-card-${studentId}`);
  card.querySelectorAll('.att-btn').forEach(btn => {
    btn.classList.remove('present-active', 'absent-active');
  });
  const [pBtn, aBtn] = card.querySelectorAll('.att-btn');
  if (status === 'present') pBtn.classList.add('present-active');
  else aBtn.classList.add('absent-active');
  updateAttendanceStats(document.querySelectorAll('.attendance-card').length);
}

function updateAttendanceStats(total) {
  const present = Object.values(attendanceState).filter(s => s === 'present').length;
  const absent = Object.values(attendanceState).filter(s => s === 'absent').length;
  document.getElementById('att-stat-total').textContent = total;
  document.getElementById('att-stat-present').textContent = present;
  document.getElementById('att-stat-absent').textContent = absent;
}

document.getElementById('attendance-date').addEventListener('change', (e) => {
  currentAttendanceDate = e.target.value;
  renderAttendanceGrid();
});

document.getElementById('att-class-filter').addEventListener('change', () => renderAttendanceGrid());

document.getElementById('btn-save-attendance').addEventListener('click', async () => {
  const records = Object.entries(attendanceState).map(([studentId, status]) => ({ studentId, status }));
  if (!records.length) return Toast.info('Mark attendance first');
  const btn = document.getElementById('btn-save-attendance');
  setButtonLoading(btn, true);
  try {
    await Attendance.bulkSave(currentAttendanceDate, records);
    Toast.success('Attendance saved successfully');
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

document.getElementById('btn-mark-all-present').addEventListener('click', () => {
  document.querySelectorAll('.attendance-card').forEach(card => {
    const studentId = card.id.replace('att-card-', '');
    markAttendance(studentId, 'present');
  });
});

// ===== MARKS & RESULTS =====
async function loadMarks() {
  try {
    const [studentsRes, subjectsRes] = await Promise.all([Students.getAll(), Subjects.getAll()]);
    allStudents = studentsRes.data;
    allSubjects = subjectsRes.data;

    // Populate selects
    populateSelect(document.getElementById('marks-student-select'), allStudents, 'id', 'fullName', 'Select Student...');
    populateSelect(document.getElementById('result-student-select'), allStudents, 'id', 'fullName', 'Select Student...');
    populateSelect(document.getElementById('marks-subject-select'), allSubjects, 'id', 'name', 'Select Subject...');

    await loadMarksTable();
  } catch {
    Toast.error('Failed to load marks data');
  }
}

async function loadMarksTable() {
  const studentId = document.getElementById('marks-student-select').value;
  try {
    const res = await Marks.getAll(studentId ? { studentId } : {});
    renderMarksTable(res.data);
  } catch {
    Toast.error('Failed to load marks');
  }
}

function renderMarksTable(marks) {
  const tbody = document.getElementById('marks-tbody');
  if (!marks.length) {
    tbody.innerHTML = `<tr><td colspan="8"><div class="empty-state"><div class="empty-icon">📊</div><h3>No marks entered yet</h3></div></td></tr>`;
    return;
  }
  tbody.innerHTML = marks.map(m => `
    <tr>
      <td><strong>${m.studentName}</strong></td>
      <td>${m.subjectName}</td>
      <td><span class="badge badge-secondary">${m.examType}</span></td>
      <td><strong>${m.marks}</strong></td>
      <td>${m.maxMarks}</td>
      <td>${m.percentage}%</td>
      <td><span class="${gradeClass(m.grade)}">${m.grade}</span></td>
      <td>
        <button class="btn btn-danger btn-sm" onclick="deleteMark('${m.id}')">🗑️</button>
      </td>
    </tr>
  `).join('');
}

document.getElementById('marks-student-select').addEventListener('change', loadMarksTable);

document.getElementById('marks-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const btn = document.getElementById('save-marks-btn');
  setButtonLoading(btn, true);
  const data = formToObject(e.target);
  try {
    await Marks.create(data);
    Toast.success('Marks saved successfully');
    e.target.reset();
    loadMarksTable();
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

async function deleteMark(id) {
  if (!confirmAction('Delete this marks entry?')) return;
  try {
    await Marks.delete(id);
    Toast.success('Marks deleted');
    loadMarksTable();
  } catch (err) {
    Toast.error(err.message);
  }
}

// Generate Result
document.getElementById('btn-generate-result').addEventListener('click', async () => {
  const studentId = document.getElementById('result-student-select').value;
  const examType = document.getElementById('result-exam-type').value;
  if (!studentId) return Toast.info('Please select a student');

  const btn = document.getElementById('btn-generate-result');
  setButtonLoading(btn, true);
  try {
    const res = await Marks.getResult(studentId, examType);
    renderResultCard(res.data);
  } catch (err) {
    Toast.error(err.message);
  } finally {
    setButtonLoading(btn, false);
  }
});

function renderResultCard(result) {
  const container = document.getElementById('result-card-container');
  const { student, subjects, totalMarks, totalMaxMarks, overallPercentage, overallGrade, status, examType } = result;

  container.innerHTML = `
    <div class="result-card">
      <div class="result-header">
        <h2>🎓 Student Result Card</h2>
        <p>${examType} Examination — ${new Date().getFullYear()}</p>
      </div>
      <div class="result-student-info">
        <div class="info-item"><div class="label">Student Name</div><div class="value">${student.fullName}</div></div>
        <div class="info-item"><div class="label">Student ID</div><div class="value">${student.id}</div></div>
        <div class="info-item"><div class="label">Class</div><div class="value">${student.class}-${student.section}</div></div>
        <div class="info-item"><div class="label">Roll Number</div><div class="value">${student.rollNumber}</div></div>
      </div>
      <div class="table-wrapper">
        <table>
          <thead><tr><th>Subject</th><th>Code</th><th>Marks</th><th>Max</th><th>%</th><th>Grade</th><th>Status</th></tr></thead>
          <tbody>
            ${subjects.map(s => `
              <tr>
                <td><strong>${s.subjectName}</strong></td>
                <td><span class="badge badge-secondary">${s.subjectCode}</span></td>
                <td><strong>${s.marks}</strong></td>
                <td>${s.maxMarks}</td>
                <td>${s.percentage}%</td>
                <td><span class="${gradeClass(s.grade)}">${s.grade}</span></td>
                <td><span class="badge ${s.passed ? 'badge-success' : 'badge-danger'}">${s.passed ? 'PASS' : 'FAIL'}</span></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
      <div class="result-summary">
        <div class="summary-item">
          <div class="summary-value">${totalMarks}/${totalMaxMarks}</div>
          <div class="summary-label">Total Marks</div>
        </div>
        <div class="summary-item">
          <div class="summary-value">${overallPercentage}%</div>
          <div class="summary-label">Percentage</div>
        </div>
        <div class="summary-item">
          <div class="summary-value"><span class="${gradeClass(overallGrade)}">${overallGrade}</span></div>
          <div class="summary-label">Overall Grade</div>
        </div>
        <div class="summary-item">
          <div class="summary-value ${status === 'PASS' ? 'status-pass' : 'status-fail'}">${status}</div>
          <div class="summary-label">Result</div>
        </div>
      </div>
      <div style="text-align:center;padding:16px;">
        <button class="btn btn-primary" onclick="window.print()">🖨️ Print Result Card</button>
      </div>
    </div>
  `;
  container.scrollIntoView({ behavior: 'smooth' });
}
