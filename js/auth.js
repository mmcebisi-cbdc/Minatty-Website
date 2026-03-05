/**
 * Minatty Hub — Authentication Module
 * Uses the local Express/MongoDB API at http://localhost:5000/api/auth
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:5000/api/auth' : 'https://minatty-backend.onrender.com/api/auth';

// ─── Auth Object ──────────────────────────────────────────────────────────────
const auth = {

    // ── Register ──────────────────────────────────────────────────────────────
    register: async (userData) => {
        try {
            const res = await fetch(`${API_BASE}/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(userData)
            });
            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Registration failed' };
            }

            // Store token and user in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true, data };
        } catch (error) {
            console.error('Registration error:', error);
            return { success: false, error: 'Cannot connect to server. Please try again.' };
        }
    },

    // ── Login ─────────────────────────────────────────────────────────────────
    login: async (email, password) => {
        try {
            const res = await fetch(`${API_BASE}/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                return { success: false, error: data.error || 'Invalid email or password' };
            }

            // Store token and user in localStorage
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));

            return { success: true, data };
        } catch (error) {
            console.error('Login error:', error);
            return { success: false, error: 'Cannot connect to server. Please try again.' };
        }
    },

    // ── Logout ────────────────────────────────────────────────────────────────
    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    },

    // ── Helpers ───────────────────────────────────────────────────────────────
    isAuthenticated: () => !!localStorage.getItem('user'),

    getUser: () => {
        const raw = localStorage.getItem('user');
        return raw ? JSON.parse(raw) : null;
    },

    getToken: () => localStorage.getItem('token'),

    // ── Refresh User from server ──────────────────────────────────────────────
    refreshUser: async () => {
        const token = auth.getToken();
        if (!token) return null;

        try {
            const res = await fetch(`${API_BASE}/me`, {
                headers: { 'x-auth-token': token }
            });
            if (!res.ok) {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                return null;
            }
            const user = await res.json();
            localStorage.setItem('user', JSON.stringify(user));
            return user;
        } catch (e) {
            console.warn('Could not refresh user (offline?):', e);
            return null;
        }
    },

    // ── UI Update ─────────────────────────────────────────────────────────────
    updateUI: () => {
        const authButtons = document.getElementById('authButtons');
        const becomeTutorLink = document.getElementById('navBecomeTutor');
        const becomeTutorLi = becomeTutorLink ? becomeTutorLink.closest('li') : null;
        const findTutorsLink = document.getElementById('navFindTutors');
        const user = auth.getUser();

        if (auth.isAuthenticated() && user) {
            const firstName = user.name ? user.name.split(' ')[0] : 'User';
            if (authButtons) {
                authButtons.innerHTML = `
                    <span style="margin-right:15px;color:var(--color-text);">Hello, ${firstName}</span>
                    <button onclick="auth.logout()" class="btn btn-outline small">Sign Out</button>
                `;
            }

            if (findTutorsLink) findTutorsLink.style.display = '';
            const footerFindTutors = document.getElementById('footerFindTutors');
            if (footerFindTutors) footerFindTutors.style.display = '';

            // Hide "Become a Tutor" for students
            const isStudent = user.role === 'student';
            if (becomeTutorLi) becomeTutorLi.style.display = isStudent ? 'none' : '';
            else if (becomeTutorLink) becomeTutorLink.style.display = isStudent ? 'none' : '';

            const footerBecomeTutor = document.getElementById('footerBecomeTutor');
            if (footerBecomeTutor) footerBecomeTutor.style.display = isStudent ? 'none' : '';

        } else {
            if (authButtons) {
                authButtons.innerHTML = `
                    <a href="login.html" class="btn btn-outline small">Sign In</a>
                    <a href="register.html" class="btn btn-primary small">Get Started</a>
                `;
            }
            // Show all links for unauthenticated users
            if (becomeTutorLink) becomeTutorLink.style.display = '';
            if (becomeTutorLi) becomeTutorLi.style.display = '';
            if (findTutorsLink) findTutorsLink.style.display = '';
            const footerBecomeTutor = document.getElementById('footerBecomeTutor');
            if (footerBecomeTutor) footerBecomeTutor.style.display = '';
            const footerFindTutors = document.getElementById('footerFindTutors');
            if (footerFindTutors) footerFindTutors.style.display = '';
        }
    },

    // ── Intercept protected nav links for unauthenticated users ───────────────
    handleTutorNavigation: () => {
        ['tutors.html', 'become-tutor.html'].forEach(page => {
            document.querySelectorAll(`a[href*="${page}"]`).forEach(link => {
                const newLink = link.cloneNode(true);
                link.parentNode.replaceChild(newLink, link);
                newLink.addEventListener('click', (e) => {
                    if (!auth.isAuthenticated()) {
                        e.preventDefault();
                        window.location.href = `login.html`;
                    }
                });
            });
        });
    }
};

// ─── Expose globally ──────────────────────────────────────────────────────────
window.auth = auth;

// ─── Initialise on every page load ───────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Update nav UI immediately from localStorage
    auth.updateUI();
    // Intercept protected links
    auth.handleTutorNavigation();
});

export default auth;
