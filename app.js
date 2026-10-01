/* ============================================================
   PassVault – Application Logic
   All data stored in localStorage per user account
============================================================ */

'use strict';

// ============================================================
// GLOBAL STATE
// ============================================================
let currentUser = null;       // { name, email, passwordHash }
let currentEntries = [];      // Array of password entries
let filteredEntries = [];     // For search
let editingId = null;         // Entry being edited
let generatedPw = '';         // Last generated password
let modalEntry = null;        // Entry visible in modal

// ============================================================
// STORAGE HELPERS
// ============================================================
const USERS_KEY = 'passvault_users';
const ENTRIES_KEY = (email) => `passvault_entries_${email}`;

function getUsers() {
    try { return JSON.parse(localStorage.getItem(USERS_KEY)) || {}; } catch { return {}; }
}
function saveUsers(u) { localStorage.setItem(USERS_KEY, JSON.stringify(u)); }
function getEntries(email) {
    try { return JSON.parse(localStorage.getItem(ENTRIES_KEY(email))) || []; } catch { return []; }
}
function saveEntries(email, entries) {
    localStorage.setItem(ENTRIES_KEY(email), JSON.stringify(entries));
}

// ============================================================
// SIMPLE HASH (for demo — NOT production-grade)
// ============================================================
function simpleHash(str) {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return hash.toString(16);
}

// ============================================================
// AUTH — TAB SWITCH
// ============================================================
function switchTab(tab) {
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const tabLogin = document.getElementById('tab-login');
    const tabReg = document.getElementById('tab-register');
    const tabsEl = document.querySelector('.auth-tabs');

    if (tab === 'login') {
        loginForm.classList.remove('hidden');
        registerForm.classList.add('hidden');
        tabLogin.classList.add('active');
        tabReg.classList.remove('active');
        tabsEl.classList.remove('right');
    } else {
        loginForm.classList.add('hidden');
        registerForm.classList.remove('hidden');
        tabLogin.classList.remove('active');
        tabReg.classList.add('active');
        tabsEl.classList.add('right');
    }
    clearErrors();
}

function clearErrors() {
    document.getElementById('login-error').classList.remove('show');
    document.getElementById('register-error').classList.remove('show');
}

function showError(id, msg) {
    const el = document.getElementById(id);
    el.textContent = msg;
    el.classList.add('show');
}

// ============================================================
// AUTH — LOGIN
// ============================================================
function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim().toLowerCase();
    const pw = document.getElementById('login-password').value;

    const users = getUsers();
    if (!users[email]) { showError('login-error', 'No account found with this email.'); return; }
    if (users[email].passwordHash !== simpleHash(pw)) { showError('login-error', 'Incorrect password.'); return; }

    currentUser = users[email];
    loadDashboard();
}

// ============================================================
// AUTH — REGISTER
// ============================================================
function handleRegister(e) {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim().toLowerCase();
    const pw = document.getElementById('reg-password').value;
    const confirm = document.getElementById('reg-confirm').value;

    if (pw !== confirm) { showError('register-error', 'Passwords do not match.'); return; }
    if (pw.length < 8) { showError('register-error', 'Password must be at least 8 characters.'); return; }

    const users = getUsers();
    if (users[email]) { showError('register-error', 'An account with this email already exists.'); return; }

    const user = { name, email, passwordHash: simpleHash(pw) };
    users[email] = user;
    saveUsers(users);

    currentUser = user;
    loadDashboard();
}

// ============================================================
// DASHBOARD LOAD
// ============================================================
function loadDashboard() {
    currentEntries = getEntries(currentUser.email);
    filteredEntries = [...currentEntries];

    // Set user info in sidebar
    document.getElementById('sidebar-name').textContent = currentUser.name;
    document.getElementById('sidebar-email').textContent = currentUser.email;
    document.getElementById('sidebar-avatar').textContent = currentUser.name.charAt(0).toUpperCase();

    // Switch screens
    document.getElementById('auth-screen').classList.remove('active');
    document.getElementById('dashboard-screen').classList.add('active');

    showSection('vault');
    renderVault();
    generateSuggestions();
    updateGenerator();
}

function logout() {
    currentUser = null;
    currentEntries = [];
    modalEntry = null;

    document.getElementById('dashboard-screen').classList.remove('active');
    document.getElementById('auth-screen').classList.add('active');

    // Reset login form
    document.getElementById('login-email').value = '';
    document.getElementById('login-password').value = '';
    switchTab('login');

    showToast('Logged out successfully.');
}

// ============================================================
// NAVIGATION
// ============================================================
function showSection(name) {
    ['vault', 'generator', 'add'].forEach(s => {
        document.getElementById(`section-${s}`).classList.remove('active');
        document.getElementById(`nav-${s}`).classList.remove('active');
    });
    document.getElementById(`section-${name}`).classList.add('active');
    document.getElementById(`nav-${name}`).classList.add('active');

    if (name === 'generator') {
        generateSuggestions();
        updateGenerator();
    }
    if (name === 'vault') {
        renderVault();
    }
    // Close sidebar on mobile
    if (window.innerWidth <= 900) {
        document.getElementById('sidebar').classList.remove('open');
    }
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// ============================================================
// VAULT RENDER
// ============================================================
function renderVault(entries) {
    const data = entries || filteredEntries;
    const grid = document.getElementById('passwords-grid');
    const empty = document.getElementById('empty-state');
    const badge = document.getElementById('vault-count-badge');

    badge.textContent = `${currentEntries.length} entr${currentEntries.length === 1 ? 'y' : 'ies'}`;

    if (data.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }
    empty.style.display = 'none';

    grid.innerHTML = data.map(entry => {
        const { id, site, username, password, category, updatedAt } = entry;
        const catClass = `cat-${category.toLowerCase()}`;
        const masked = '••••••••';
        const strength = getStrength(password);
        const strClass = strength.cls;
        const strPct = strength.pct;
        const icon = site.charAt(0).toUpperCase();
        const age = timeAgo(updatedAt);

        return `
    <div class="pw-card" onclick="openModal('${id}')" id="card-${id}">
      <div class="pw-card-top">
        <div class="site-icon ${catClass}">${icon}</div>
        <div class="pw-card-info">
          <div class="pw-card-site">${esc(site)}</div>
          <div class="pw-card-user">${esc(username)}</div>
        </div>
        <span class="pw-card-category">${esc(category)}</span>
      </div>
      <div class="pw-card-bottom">
        <span class="pw-card-pw">${masked}</span>
        <div class="pw-card-actions">
          <button title="Copy password" onclick="event.stopPropagation(); copyEntryPw('${id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
          </button>
          <button title="Edit" onclick="event.stopPropagation(); editEntry('${id}')">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
        </div>
      </div>
      <div class="pw-card-strength">
        <div class="pw-card-strength-bar ${strClass}" style="width:${strPct}%"></div>
      </div>
      <div style="font-size:0.7rem;color:var(--text-muted);margin-top:6px;">Updated ${age}</div>
    </div>`;
    }).join('');
}

function filterVault(query) {
    const q = query.toLowerCase().trim();
    filteredEntries = q
        ? currentEntries.filter(e =>
            e.site.toLowerCase().includes(q) ||
            e.username.toLowerCase().includes(q) ||
            e.category.toLowerCase().includes(q)
        )
        : [...currentEntries];
    renderVault();
}

// ============================================================
// PASSWORD ENTRY — OPEN MODAL
// ============================================================
function openModal(id) {
    const entry = currentEntries.find(e => e.id === id);
    if (!entry) return;
    modalEntry = entry;

    const catClass = `cat-${entry.category.toLowerCase()}`;
    document.getElementById('modal-site-icon').textContent = entry.site.charAt(0).toUpperCase();
    document.getElementById('modal-site-icon').className = `modal-site-icon ${catClass}`;
    document.getElementById('modal-site-name').textContent = entry.site;
    document.getElementById('modal-category').textContent = entry.category;
    document.getElementById('modal-username').textContent = entry.username;

    // Password – reset to masked
    const pwEl = document.getElementById('modal-password');
    pwEl.textContent = '••••••••••••';
    pwEl.className = 'pw-masked';
    pwEl.dataset.pw = entry.password;
    pwEl.dataset.shown = 'false';

    // URL
    const urlField = document.getElementById('modal-url-field');
    if (entry.url) {
        document.getElementById('modal-url').textContent = entry.url;
        document.getElementById('modal-url').href = entry.url;
        urlField.style.display = '';
    } else {
        urlField.style.display = 'none';
    }

    // Notes
    const notesField = document.getElementById('modal-notes-field');
    if (entry.notes) {
        document.getElementById('modal-notes').textContent = entry.notes;
        notesField.style.display = '';
    } else {
        notesField.style.display = 'none';
    }

    document.getElementById('modal-updated').textContent = new Date(entry.updatedAt).toLocaleString();

    document.getElementById('modal-overlay').classList.add('open');
}

function closeModal() {
    document.getElementById('modal-overlay').classList.remove('open');
    modalEntry = null;
}

function toggleModalPw() {
    const el = document.getElementById('modal-password');
    if (el.dataset.shown === 'false') {
        el.textContent = el.dataset.pw;
        el.className = '';
        el.dataset.shown = 'true';
    } else {
        el.textContent = '••••••••••••';
        el.className = 'pw-masked';
        el.dataset.shown = 'false';
    }
}

function copyModal(field) {
    let text = '';
    if (field === 'username') text = modalEntry.username;
    if (field === 'password') text = modalEntry.password;
    copyToClipboard(text, field === 'password' ? 'Password copied!' : 'Username copied!');
}

// ============================================================
// PASSWORD ENTRY — ADD / EDIT / DELETE
// ============================================================
function deleteEntry(idOverride) {
    const id = idOverride || (modalEntry && modalEntry.id);
    if (!id) return;

    if (!confirm('Are you sure you want to delete this password entry?')) return;

    currentEntries = currentEntries.filter(e => e.id !== id);
    filteredEntries = filteredEntries.filter(e => e.id !== id);
    saveEntries(currentUser.email, currentEntries);
    closeModal();
    renderVault();
    showToast('Entry deleted.');
}

function editEntry(idOverride) {
    const id = idOverride || (modalEntry && modalEntry.id);
    if (!id) return;
    const entry = currentEntries.find(e => e.id === id);
    if (!entry) return;

    editingId = id;
    document.getElementById('edit-id').value = id;
    document.getElementById('pw-site').value = entry.site;
    document.getElementById('pw-url').value = entry.url || '';
    document.getElementById('pw-username').value = entry.username;
    document.getElementById('pw-category').value = entry.category;
    document.getElementById('pw-password').value = entry.password;
    document.getElementById('pw-notes').value = entry.notes || '';
    document.getElementById('add-section-title').textContent = 'Edit Password';
    document.getElementById('save-btn-text').textContent = 'Save Changes';

    checkStrengthAdd(entry.password);
    closeModal();
    showSection('add');
}

function cancelEdit() {
    editingId = null;
    document.getElementById('edit-id').value = '';
    document.getElementById('add-password-form').reset();
    document.getElementById('add-section-title').textContent = 'Add New Password';
    document.getElementById('save-btn-text').textContent = 'Save Password';
    resetStrengthAdd();
    showSection('vault');
}

function savePassword(e) {
    e.preventDefault();
    const site = document.getElementById('pw-site').value.trim();
    const url = document.getElementById('pw-url').value.trim();
    const username = document.getElementById('pw-username').value.trim();
    const category = document.getElementById('pw-category').value;
    const password = document.getElementById('pw-password').value;
    const notes = document.getElementById('pw-notes').value.trim();
    const now = Date.now();

    if (editingId) {
        const idx = currentEntries.findIndex(e => e.id === editingId);
        if (idx !== -1) {
            currentEntries[idx] = { ...currentEntries[idx], site, url, username, category, password, notes, updatedAt: now };
        }
        editingId = null;
        document.getElementById('add-section-title').textContent = 'Add New Password';
        document.getElementById('save-btn-text').textContent = 'Save Password';
        showToast('Entry updated!');
    } else {
        const newEntry = { id: uid(), site, url, username, category, password, notes, createdAt: now, updatedAt: now };
        currentEntries.unshift(newEntry);
        showToast('Password saved!');
    }

    filteredEntries = [...currentEntries];
    saveEntries(currentUser.email, currentEntries);
    document.getElementById('add-password-form').reset();
    resetStrengthAdd();
    document.getElementById('edit-id').value = '';
    showSection('vault');
}

// ============================================================
// PASSWORD GENERATOR
// ============================================================
const CHARS_UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const CHARS_LOWER = 'abcdefghijklmnopqrstuvwxyz';
const CHARS_NUMS = '0123456789';
const CHARS_SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIG_CHARS = 'O0Il1';

function generatePasswordFromConfig(config) {
    let charset = '';
    let guaranteed = [];

    if (config.upper) { charset += CHARS_UPPER; guaranteed.push(randomChar(CHARS_UPPER)); }
    if (config.lower) { charset += CHARS_LOWER; guaranteed.push(randomChar(CHARS_LOWER)); }
    if (config.numbers) { charset += CHARS_NUMS; guaranteed.push(randomChar(CHARS_NUMS)); }
    if (config.symbols) { charset += CHARS_SYMBOLS; guaranteed.push(randomChar(CHARS_SYMBOLS)); }

    if (!charset) charset = CHARS_LOWER + CHARS_UPPER;

    if (config.noAmbig) {
        charset = charset.split('').filter(c => !AMBIG_CHARS.includes(c)).join('');
    }

    const length = config.length || 16;
    let pw = [...guaranteed];
    while (pw.length < length) {
        pw.push(randomChar(charset));
    }
    // Shuffle
    for (let i = pw.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [pw[i], pw[j]] = [pw[j], pw[i]];
    }
    return pw.join('');
}

function randomChar(str) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return str[buf[0] % str.length];
}

function getConfig() {
    return {
        length: parseInt(document.getElementById('gen-length').value),
        upper: document.getElementById('gen-upper').checked,
        lower: document.getElementById('gen-lower').checked,
        numbers: document.getElementById('gen-numbers').checked,
        symbols: document.getElementById('gen-symbols').checked,
        noAmbig: document.getElementById('gen-noambig').checked,
        context: document.getElementById('gen-context').value.trim(),
    };
}

function generatePassword() {
    const config = getConfig();
    generatedPw = generatePasswordFromConfig(config);

    // Smart context-based tweaks
    const suggestions = getSmartTips(config, generatedPw);

    document.getElementById('gen-result').textContent = generatedPw;
    document.getElementById('use-gen-btn').style.display = '';

    updateStrengthDisplay(generatedPw, 'gen');
    renderTips(suggestions);
    generateSuggestions();
}

function updateGenerator() {
    const len = document.getElementById('gen-length').value;
    document.getElementById('len-val').textContent = len;
    if (generatedPw) generatePassword();
}

// ============================================================
// SMART TIPS ENGINE
// ============================================================
function getSmartTips(config, pw) {
    const context = config.context.toLowerCase();
    const tips = [];
    const strength = getStrength(pw);

    if (strength.score < 3) tips.push('Increase length to at least 16 characters.');
    if (!config.symbols) tips.push('Add symbols to significantly boost security.');
    if (!config.numbers) tips.push('Include numbers for better entropy.');
    if (!config.upper || !config.lower) tips.push('Mix uppercase and lowercase letters.');
    if (config.length < 12) tips.push('Use at least 12 characters for modern security.');

    // Context-aware tips
    if (context.includes('bank') || context.includes('finance') || context.includes('pay')) {
        tips.push('Financial accounts deserve 20+ character passwords. Go longer!');
        tips.push('Enable all character types for financial services.');
    }
    if (context.includes('email') || context.includes('gmail') || context.includes('outlook')) {
        tips.push('Email is a master key — use your strongest password here.');
        tips.push('Enable two-factor authentication alongside a strong password.');
    }
    if (context.includes('social') || context.includes('instagram') || context.includes('facebook')) {
        tips.push('Social accounts are prime targets — use unique, strong passwords.');
    }
    if (context.includes('work') || context.includes('office')) {
        tips.push('Work passwords should follow your company policy and be rotated regularly.');
    }

    if (tips.length === 0) tips.push('Excellent! This password meets modern security standards.');
    if (config.length >= 20 && config.symbols && config.upper && config.lower && config.numbers) {
        tips.push(`Estimated crack time: centuries (with current hardware).`);
    }

    return tips.slice(0, 5);
}

function renderTips(tips) {
    const list = document.getElementById('tips-list');
    list.innerHTML = tips.map(t => `<li>${esc(t)}</li>`).join('');
}

// ============================================================
// QUICK SUGGESTIONS
// ============================================================
function generateSuggestions() {
    const configs = [
        { length: 16, upper: true, lower: true, numbers: true, symbols: true, noAmbig: false, label: 'Highly Secure' },
        { length: 20, upper: true, lower: true, numbers: true, symbols: true, noAmbig: true, label: 'Max Security' },
        { length: 12, upper: true, lower: true, numbers: true, symbols: false, noAmbig: true, label: 'Easy to Type' },
        { length: 24, upper: true, lower: true, numbers: true, symbols: true, noAmbig: false, label: 'Ultra Long' },
        { length: 14, upper: true, lower: true, numbers: true, symbols: true, noAmbig: true, label: 'Balanced' },
        { length: 18, upper: true, lower: true, numbers: false, symbols: true, noAmbig: false, label: 'No Numbers' },
    ];

    const grid = document.getElementById('suggestions-grid');
    grid.innerHTML = configs.map((cfg, i) => {
        const pw = generatePasswordFromConfig(cfg);
        const score = getStrength(pw);
        return `
    <div class="suggestion-card" onclick="applySuggestion('${pw.replace(/'/g, "\\'")}')" id="sugg-${i}">
      <div class="suggestion-pw">${esc(pw)}</div>
      <div class="suggestion-meta">
        <span class="suggestion-score">${cfg.label} · ${score.label}</span>
        <span class="suggestion-copy">Use this →</span>
      </div>
    </div>`;
    }).join('');
}

function applySuggestion(pw) {
    generatedPw = pw;
    document.getElementById('gen-result').textContent = pw;
    document.getElementById('use-gen-btn').style.display = '';
    updateStrengthDisplay(pw, 'gen');
    renderTips(getSmartTips(getConfig(), pw));
    showToast('Suggestion selected!');
}

function copyGenerated() {
    if (!generatedPw) { showToast('Generate a password first.'); return; }
    copyToClipboard(generatedPw, 'Password copied!');
}

function useGeneratedPassword() {
    if (!generatedPw) return;
    showSection('add');
    document.getElementById('pw-password').value = generatedPw;
    checkStrengthAdd(generatedPw);
    showToast('Password filled in—complete the form to save.');
}

function fillGeneratedToAdd() {
    const config = {
        length: 16, upper: true, lower: true, numbers: true, symbols: true, noAmbig: false,
        context: document.getElementById('pw-site').value || ''
    };
    const pw = generatePasswordFromConfig(config);
    generatedPw = pw;
    document.getElementById('pw-password').value = pw;
    checkStrengthAdd(pw);
    showToast('Smart password generated!');
}

function copyFieldPassword() {
    const pw = document.getElementById('pw-password').value;
    if (!pw) { showToast('No password to copy.'); return; }
    copyToClipboard(pw, 'Password copied!');
}

// ============================================================
// STRENGTH ANALYZER
// ============================================================
function getStrength(pw) {
    if (!pw) return { score: 0, pct: 0, label: '', cls: '' };

    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (pw.length >= 16) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[a-z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    if (pw.length >= 20) score++;

    // Deductions
    if (/(.)\1{2,}/.test(pw)) score -= 1;   // repeated chars
    if (/^[a-z]+$/.test(pw)) score -= 1;     // only lowercase
    if (/^[0-9]+$/.test(pw)) score -= 2;     // only numbers

    score = Math.max(0, Math.min(8, score));

    if (score <= 2) return { score, pct: 25, label: 'Weak', cls: 'str-weak', color: '#ef4444' };
    if (score <= 4) return { score, pct: 50, label: 'Fair', cls: 'str-fair', color: '#f59e0b' };
    if (score <= 6) return { score, pct: 75, label: 'Good', cls: 'str-good', color: '#22d3ee' };
    return { score, pct: 100, label: 'Strong', cls: 'str-strong', color: '#10b981' };
}

function calcEntropy(pw) {
    let charset = 0;
    if (/[a-z]/.test(pw)) charset += 26;
    if (/[A-Z]/.test(pw)) charset += 26;
    if (/[0-9]/.test(pw)) charset += 10;
    if (/[^A-Za-z0-9]/.test(pw)) charset += 32;
    if (!charset) return 0;
    return Math.round(pw.length * Math.log2(charset));
}

function updateStrengthDisplay(pw, prefix) {
    const s = getStrength(pw);
    const bar = document.getElementById(`${prefix}-strength-bar`);
    const lbl = document.getElementById(`${prefix}-strength-label`);

    bar.style.width = s.pct + '%';
    bar.className = `strength-bar ${s.cls}`;
    lbl.textContent = s.label || '–';
    lbl.style.color = s.color || 'var(--text-muted)';

    if (prefix === 'gen') {
        const ent = document.getElementById('gen-entropy-label');
        const bits = calcEntropy(pw);
        ent.textContent = bits ? `${bits} bits entropy` : '';
    }
}

function checkStrength(pw) {
    updateStrengthDisplay(pw, 'reg');
}
function checkStrengthAdd(pw) {
    updateStrengthDisplay(pw, 'add');
}
function resetStrengthAdd() {
    const bar = document.getElementById('add-strength-bar');
    bar.style.width = '0';
    bar.className = 'strength-bar';
    document.getElementById('add-strength-label').textContent = '';
}

// ============================================================
// UTILITY FUNCTIONS
// ============================================================
function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function esc(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function timeAgo(ts) {
    const diff = Date.now() - ts;
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 30) return `${d}d ago`;
    return new Date(ts).toLocaleDateString();
}

function copyToClipboard(text, msg) {
    navigator.clipboard.writeText(text).then(() => showToast(msg)).catch(() => {
        // Fallback
        const ta = document.createElement('textarea');
        ta.value = text;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast(msg);
    });
}

function copyEntryPw(id) {
    const entry = currentEntries.find(e => e.id === id);
    if (entry) copyToClipboard(entry.password, 'Password copied!');
}

let toastTimer;
function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2800);
}

// Toggle password visibility
function togglePw(inputId, btn) {
    const input = document.getElementById(inputId);
    const isHidden = input.type === 'password';
    input.type = isHidden ? 'text' : 'password';
    btn.style.color = isHidden ? 'var(--purple-light)' : 'var(--text-muted)';
}

// ============================================================
// INIT
// ============================================================
(function init() {
    // Restore session
    const session = localStorage.getItem('passvault_session');
    if (session) {
        try {
            const u = JSON.parse(session);
            const users = getUsers();
            if (users[u.email] && users[u.email].passwordHash === u.passwordHash) {
                currentUser = users[u.email];
                loadDashboard();
                return;
            }
        } catch (_) { }
    }

    // Show auth
    document.getElementById('auth-screen').classList.add('active');
    generateSuggestions();
})();

// Keyboard shortcuts
document.addEventListener('keydown', e => {
    if (e.key === 'Escape') closeModal();
});

// Save session on login actions (simple session persistence)
const _origLoad = loadDashboard;
window.loadDashboard = function () {
    if (currentUser) {
        localStorage.setItem('passvault_session', JSON.stringify({
            email: currentUser.email,
            passwordHash: currentUser.passwordHash
        }));
    }
    _origLoad();
};

const _origLogout = logout;
window.logout = function () {
    localStorage.removeItem('passvault_session');
    _origLogout();
};
