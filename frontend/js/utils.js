// js/utils.js - UI utility functions

// Toast notifications
const Toast = {
  container: null,
  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.id = 'toast-container';
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    }
  },
  show(message, type = 'info', duration = 3500) {
    if (!this.container) this.init();
    const icons = { success: '✅', error: '❌', info: 'ℹ️', warning: '⚠️' };
    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span>${message}</span>`;
    this.container.appendChild(el);
    setTimeout(() => {
      el.classList.add('removing');
      setTimeout(() => el.remove(), 300);
    }, duration);
  },
  success: (msg) => Toast.show(msg, 'success'),
  error: (msg) => Toast.show(msg, 'error'),
  info: (msg) => Toast.show(msg, 'info')
};

// Modal helper
const Modal = {
  open(id) {
    document.getElementById(id)?.classList.add('active');
  },
  close(id) {
    document.getElementById(id)?.classList.remove('active');
  },
  closeAll() {
    document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
  }
};

// Format date
function formatDate(dateStr) {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

// Confirm dialog
function confirmAction(message) {
  return window.confirm(message);
}

// Loading state for buttons
function setButtonLoading(btn, loading) {
  if (loading) {
    btn.dataset.originalText = btn.innerHTML;
    btn.innerHTML = '<span class="spinner"></span> Loading...';
    btn.disabled = true;
  } else {
    btn.innerHTML = btn.dataset.originalText || btn.innerHTML;
    btn.disabled = false;
  }
}

// Form to object
function formToObject(form) {
  const data = {};
  new FormData(form).forEach((value, key) => { data[key] = value; });
  return data;
}

// Object to form
function objectToForm(form, obj) {
  Object.entries(obj).forEach(([key, value]) => {
    const el = form.querySelector(`[name="${key}"]`);
    if (el) el.value = value || '';
  });
}

// Populate select with options
function populateSelect(selectEl, items, valueKey, labelKey, placeholder = 'Select...') {
  selectEl.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item[valueKey];
    opt.textContent = item[labelKey];
    selectEl.appendChild(opt);
  });
}

// Grade color class
function gradeClass(grade) {
  const map = { 'A+': 'success', 'A': 'info', 'B+': 'info', 'B': 'secondary', 'C': 'warning', 'D': 'warning', 'F': 'danger' };
  return `badge badge-${map[grade] || 'secondary'}`;
}

// Current date in YYYY-MM-DD
function todayStr() {
  return new Date().toISOString().split('T')[0];
}

// Debounce
function debounce(fn, delay = 300) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}
