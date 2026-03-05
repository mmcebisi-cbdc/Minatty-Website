/**
 * Admin Dashboard — uses local MongoDB API (http://localhost:5000)
 * Admin auth: password verified against server .env ADMIN_PASSWORD
 */

const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = isLocal ? 'http://localhost:5000/api' : 'https://minatty-backend.onrender.com/api';

document.addEventListener('DOMContentLoaded', () => {
    checkAuth();

    document.getElementById('adminLoginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const password = document.getElementById('adminPassword').value;
        await loginAdmin(password);
    });

    document.getElementById('logoutBtn').addEventListener('click', () => {
        logoutAdmin();
    });
});

function checkAuth() {
    const isLoggedIn = localStorage.getItem('adminLoggedIn') === 'true';
    const loginContainer = document.getElementById('loginContainer');
    const dashboardContent = document.getElementById('dashboardContent');

    if (isLoggedIn) {
        loginContainer.style.display = 'none';
        dashboardContent.style.display = 'block';
        fetchApplications();
        fetchBookings();
        fetchUsers();
        fetchMessages();
    } else {
        loginContainer.style.display = 'flex';
        dashboardContent.style.display = 'none';
    }
}

async function loginAdmin(password) {
    try {
        const res = await fetch(`${API_BASE}/auth/verify-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password })
        });
        const data = await res.json();

        if (res.ok && data.success) {
            localStorage.setItem('adminLoggedIn', 'true');
            checkAuth();
        } else {
            alert('Invalid admin password. Please try again.');
        }
    } catch (err) {
        console.error('Admin login error:', err);
        alert('Cannot connect to server. Make sure the backend is running on port 5000.');
    }
}

function logoutAdmin() {
    localStorage.removeItem('adminLoggedIn');
    location.reload();
}

function switchTab(tabId) {
    document.querySelectorAll('.section-content').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(el => el.classList.remove('active'));
    document.getElementById(tabId).classList.add('active');
    document.querySelector(`button[onclick="switchTab('${tabId}')"]`).classList.add('active');
}
window.switchTab = switchTab;

// ==============================
// APPLICATIONS LOGIC
// ==============================

async function fetchApplications() {
    const container = document.getElementById('applicationsList');
    container.innerHTML = 'Loading...';

    try {
        const res = await fetch(`${API_BASE}/applications`);
        if (!res.ok) throw new Error('Failed to fetch applications');
        const apps = await res.json();

        if (!apps || apps.length === 0) {
            container.innerHTML = '<p>No applications found.</p>';
            return;
        }

        container.innerHTML = apps.map(app => {
            const subjects = Array.isArray(app.subjects)
                ? app.subjects.join(', ')
                : (app.subjects || 'No subjects');

            const getFileUrl = (path) => {
                if (!path) return '';
                if (path.startsWith('http')) return path;
                if (path.startsWith('/uploads')) return `http://localhost:5000${path}`;
                return `http://localhost:5000/uploads/${path}`;
            };

            const profileUrl = getFileUrl(app.profileImage);
            const qualUrl = getFileUrl(app.qualificationsDoc);
            const idUrl = getFileUrl(app.identityDoc);

            const profilePhoto = profileUrl
                ? `<img src="${profileUrl}" alt="Profile" style="width:50px;height:50px;border-radius:50%;object-fit:cover;margin-right:15px;">`
                : `<div style="width:50px;height:50px;border-radius:50%;background:#eee;margin-right:15px;display:flex;align-items:center;justify-content:center;">👤</div>`;

            const qualLink = qualUrl
                ? `<a href="${qualUrl}" target="_blank" style="color:var(--color-primary);margin-right:15px;">📄 View Qualifications</a>`
                : '<span class="text-muted" style="margin-right:15px;">No Qualifications</span>';

            const idLink = idUrl
                ? `<a href="${idUrl}" target="_blank" style="color:var(--color-primary);">🆔 View ID</a>`
                : '<span class="text-muted">No ID</span>';

            let actionButtons = '';
            if (app.status === 'pending') {
                actionButtons = `
                    <button class="action-btn btn-approve" onclick="updateApplicationStatus('${app._id}', 'approved')">Approve</button>
                    <button class="action-btn btn-reject" onclick="updateApplicationStatus('${app._id}', 'rejected')">Reject</button>
                    <button class="action-btn" style="background:#6b7280;color:white;" onclick="deleteApplication('${app._id}')">Delete</button>`;
            } else if (app.status === 'approved') {
                actionButtons = `
                    <button class="action-btn btn-reject" onclick="updateApplicationStatus('${app._id}', 'rejected')">Revoke</button>
                    <button class="action-btn" style="background:#6b7280;color:white;" onclick="deleteApplication('${app._id}')">Delete</button>`;
            } else {
                actionButtons = `
                    <button class="action-btn btn-approve" onclick="updateApplicationStatus('${app._id}', 'approved')">Approve</button>
                    <button class="action-btn" style="background:#6b7280;color:white;" onclick="deleteApplication('${app._id}')">Delete</button>`;
            }

            return `
            <div class="item-card">
                <div class="item-header">
                    <div style="display:flex;align-items:center;">
                        ${profilePhoto}
                        <div>
                            <h3>${app.fullName || app.full_name || 'Unknown'}</h3>
                            <p class="text-muted">${app.email} | ${app.phone}</p>
                        </div>
                    </div>
                    <span class="status-badge status-${app.status}">${app.status.toUpperCase()}</span>
                </div>
                <div style="margin-bottom:15px;">
                    <p><strong>Subjects:</strong> ${subjects}</p>
                    <p><strong>Qualification:</strong> ${app.qualification || 'N/A'}</p>
                    <p><strong>Experience:</strong> ${app.experience || 'N/A'}</p>
                    <p><strong>Rate:</strong> R${app.preferredRate || app.preferred_rate || 0}/hr</p>
                    <p><strong>Location:</strong> ${app.location || 'N/A'}</p>
                    <p><strong>Bio:</strong> ${app.bio || 'N/A'}</p>
                    ${app.workExperience ? `<p><strong>Work Experience:</strong> ${app.workExperience}</p>` : ''}
                    <div style="margin-top:10px;padding-top:10px;border-top:1px solid #eee;">
                        ${qualLink} ${idLink}
                    </div>
                </div>
                <div>${actionButtons}</div>
            </div>`;
        }).join('');

    } catch (error) {
        console.error('Error fetching applications:', error);
        container.innerHTML = `<p style="color:red;">Error loading applications: ${error.message}</p>`;
    }
}
window.fetchApplications = fetchApplications;

async function deleteApplication(id) {
    if (!confirm('Are you sure you want to DELETE this application? This cannot be undone.')) return;
    try {
        const res = await fetch(`${API_BASE}/applications/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        alert('Application deleted successfully');
        fetchApplications();
    } catch (error) {
        alert('Error deleting application: ' + error.message);
    }
}
window.deleteApplication = deleteApplication;

async function updateApplicationStatus(id, status) {
    if (!confirm(`Mark this application as ${status}?`)) return;
    try {
        const res = await fetch(`${API_BASE}/applications/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Update failed');
        alert(`Application ${status} successfully!`);
        fetchApplications();
    } catch (error) {
        alert('Error updating status: ' + error.message);
    }
}
window.updateApplicationStatus = updateApplicationStatus;

// ==============================
// BOOKINGS LOGIC
// ==============================

async function fetchBookings() {
    const container = document.getElementById('bookingsList');
    try {
        const res = await fetch(`${API_BASE}/bookings`);
        if (!res.ok) throw new Error('Failed to fetch bookings');
        const bookings = await res.json();

        if (!bookings || bookings.length === 0) {
            container.innerHTML = '<p>No bookings found.</p>';
            return;
        }

        container.innerHTML = bookings.map(booking => `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <h3>${booking.subject} Session</h3>
                        <p class="text-muted">Student: ${booking.studentName || booking.student_name} (${booking.studentEmail || booking.student_email})</p>
                    </div>
                    <span class="status-badge status-${booking.status || 'pending'}">${(booking.status || 'pending').toUpperCase()}</span>
                </div>
                <div style="margin-bottom:15px;">
                    <p><strong>Tutor:</strong> ${booking.tutorName || booking.tutor_name || 'N/A'}</p>
                    <p><strong>Date:</strong> ${booking.date ? new Date(booking.date).toLocaleString() : 'N/A'}</p>
                    <p><strong>Message:</strong> ${booking.message || 'No message'}</p>
                    <p><strong>Payment:</strong> ${booking.paymentStatus || booking.payment_status || 'N/A'}</p>
                </div>
                <div style="border-top:1px solid #eee;padding-top:10px;display:flex;gap:10px;flex-wrap:wrap;">
                    ${booking.status !== 'confirmed' && booking.status !== 'completed' ? `<button class="action-btn btn-approve" onclick="updateBookingStatus('${booking._id}', 'confirmed')">Confirm</button>` : ''}
                    ${booking.status === 'confirmed' ? `<button class="action-btn btn-approve" style="background:#3b82f6;" onclick="updateBookingStatus('${booking._id}', 'completed')">Complete</button>` : ''}
                    ${booking.status !== 'cancelled' && booking.status !== 'completed' ? `<button class="action-btn btn-reject" onclick="updateBookingStatus('${booking._id}', 'cancelled')">Cancel</button>` : ''}
                    <button class="action-btn" style="background:#6b7280;color:white;" onclick="deleteBooking('${booking._id}')">Delete</button>
                </div>
            </div>
        `).join('');

    } catch (error) {
        container.innerHTML = '<p style="color:red;">Error loading bookings.</p>';
    }
}
window.fetchBookings = fetchBookings;

async function updateBookingStatus(id, status) {
    try {
        const res = await fetch(`${API_BASE}/bookings/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Update failed');
        alert(`Booking marked as ${status}`);
        fetchBookings();
    } catch (error) {
        alert('Error updating booking: ' + error.message);
    }
}
window.updateBookingStatus = updateBookingStatus;

async function deleteBooking(id) {
    if (!confirm('Delete this booking?')) return;
    try {
        const res = await fetch(`${API_BASE}/bookings/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        alert('Booking deleted');
        fetchBookings();
    } catch (error) {
        alert('Error deleting booking: ' + error.message);
    }
}
window.deleteBooking = deleteBooking;

// ==============================
// USERS LOGIC
// ==============================

async function fetchUsers() {
    const container = document.getElementById('usersList');
    try {
        const res = await fetch(`${API_BASE}/auth/users`);
        if (!res.ok) throw new Error('Failed to fetch users');
        const users = await res.json();

        if (!users || users.length === 0) {
            container.innerHTML = '<p>No users found.</p>';
            return;
        }

        let html = `
            <table style="width:100%;border-collapse:collapse;background:white;border-radius:8px;overflow:hidden;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                <thead style="background:var(--color-bg-light-gray);text-align:left;">
                    <tr>
                        <th style="padding:12px 15px;border-bottom:1px solid #ddd;">Name</th>
                        <th style="padding:12px 15px;border-bottom:1px solid #ddd;">Email</th>
                        <th style="padding:12px 15px;border-bottom:1px solid #ddd;">Phone</th>
                        <th style="padding:12px 15px;border-bottom:1px solid #ddd;">Role</th>
                        <th style="padding:12px 15px;border-bottom:1px solid #ddd;">Grade</th>
                        <th style="padding:12px 15px;border-bottom:1px solid #ddd;">Action</th>
                    </tr>
                </thead>
                <tbody>`;

        html += users.map(user => `
            <tr>
                <td style="padding:12px 15px;border-bottom:1px solid #eee;">${user.name || '-'}</td>
                <td style="padding:12px 15px;border-bottom:1px solid #eee;">${user.email}</td>
                <td style="padding:12px 15px;border-bottom:1px solid #eee;">${user.phoneNumber || '-'}</td>
                <td style="padding:12px 15px;border-bottom:1px solid #eee;">
                    <span class="status-badge" style="background:${user.role === 'student' ? '#e0f2fe' : '#fef3c7'};color:${user.role === 'student' ? '#0369a1' : '#d97706'};">
                        ${(user.role || 'student').toUpperCase()}
                    </span>
                </td>
                <td style="padding:12px 15px;border-bottom:1px solid #eee;">${user.grade ? 'Grade ' + user.grade : '-'}</td>
                <td style="padding:12px 15px;border-bottom:1px solid #eee;">
                    <button onclick="deleteUser('${user._id}')" class="action-btn btn-reject" style="padding:5px 10px;font-size:0.8rem;">Delete</button>
                </td>
            </tr>`).join('');

        html += `</tbody></table>`;
        container.innerHTML = html;

    } catch (error) {
        container.innerHTML = '<p style="color:red;">Error loading users.</p>';
    }
}
window.fetchUsers = fetchUsers;

async function deleteUser(id) {
    if (!confirm('Delete this user? This cannot be undone.')) return;
    try {
        const res = await fetch(`${API_BASE}/auth/users/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        alert('User deleted successfully');
        fetchUsers();
    } catch (error) {
        alert('Error deleting user: ' + error.message);
    }
}
window.deleteUser = deleteUser;

// ==============================
// MESSAGES LOGIC
// ==============================

async function fetchMessages() {
    const container = document.getElementById('messagesList');
    try {
        const res = await fetch(`${API_BASE}/contact`);
        if (!res.ok) throw new Error('Failed to fetch messages');
        const messages = await res.json();

        if (!messages || messages.length === 0) {
            container.innerHTML = '<p>No contact messages yet.</p>';
            return;
        }

        container.innerHTML = messages.map(msg => {
            const statusColors = {
                unread: { bg: '#fef3c7', color: '#d97706' },
                read: { bg: '#e0f2fe', color: '#0369a1' },
                replied: { bg: '#d1fae5', color: '#059669' }
            };
            const sc = statusColors[msg.status] || statusColors.unread;
            const date = new Date(msg.createdAt || msg.created_at).toLocaleString();

            return `
            <div class="item-card">
                <div class="item-header">
                    <div>
                        <h3>${msg.name} <span style="font-weight:400;font-size:0.9rem;color:#6b7280;">— ${msg.email}</span></h3>
                        <p class="text-muted" style="font-size:0.85rem;">📁 ${msg.subject || 'N/A'} &nbsp;|&nbsp; 🕐 ${date}</p>
                    </div>
                    <span class="status-badge" style="background:${sc.bg};color:${sc.color};">${(msg.status || 'unread').toUpperCase()}</span>
                </div>
                <div style="background:#f9fafb;border-radius:6px;padding:12px 16px;margin-bottom:12px;border-left:3px solid var(--color-primary);">
                    <p style="margin:0;white-space:pre-wrap;">${msg.message}</p>
                </div>
                <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    ${msg.status === 'unread' ? `<button class="action-btn btn-approve" style="background:#3b82f6;" onclick="updateMessageStatus('${msg._id}', 'read')">Mark as Read</button>` : ''}
                    ${msg.status !== 'replied' ? `<button class="action-btn btn-approve" onclick="updateMessageStatus('${msg._id}', 'replied')">Mark as Replied</button>` : ''}
                    <a href="mailto:${msg.email}?subject=Re: ${encodeURIComponent(msg.subject || 'Your Message')}" class="action-btn btn-approve" style="text-decoration:none;background:#8b5cf6;">📧 Reply</a>
                    <button class="action-btn" style="background:#6b7280;color:white;" onclick="deleteMessage('${msg._id}')">Delete</button>
                </div>
            </div>`;
        }).join('');

    } catch (error) {
        container.innerHTML = '<p style="color:red;">Error loading messages.</p>';
    }
}
window.fetchMessages = fetchMessages;

async function updateMessageStatus(id, status) {
    try {
        const res = await fetch(`${API_BASE}/contact/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status })
        });
        if (!res.ok) throw new Error('Update failed');
        fetchMessages();
    } catch (error) {
        alert('Error updating message: ' + error.message);
    }
}
window.updateMessageStatus = updateMessageStatus;

async function deleteMessage(id) {
    if (!confirm('Delete this message?')) return;
    try {
        const res = await fetch(`${API_BASE}/contact/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Delete failed');
        fetchMessages();
    } catch (error) {
        alert('Error deleting message: ' + error.message);
    }
}
window.deleteMessage = deleteMessage;
