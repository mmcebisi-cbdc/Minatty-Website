document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tutorId = urlParams.get('id');

    if (!tutorId) {
        alert('No tutor specified.');
        window.location.href = 'tutors.html';
        return;
    }

    try {
        await loadTutorProfile(tutorId);
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('loading').innerHTML = '<p style="color: red; text-align: center;">Failed to load profile. <a href="tutors.html">Go back to tutors</a>.</p>';
    }
});

async function loadTutorProfile(tutorId) {
    const apiBase = (typeof API_BASE !== 'undefined') ? API_BASE : window.API_BASE;
    if (!apiBase) throw new Error("API_BASE is not defined. Check app.js loading.");

    const response = await fetch(`${apiBase}/tutors/${tutorId}`);
    if (!response.ok) throw new Error(`Failed to fetch tutor: ${response.status}`);

    const tutor = await response.json();

    // Hide Loading, Show Content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';

    // Page title
    document.title = `${tutor.fullName} - Tutor Profile | Minatty Learning Hub`;

    // ── Profile Image ─────────────────────────────────────
    const imgContainer = document.getElementById('profileImageContainer');
    const initials = tutor.fullName
        ? tutor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';
    const placeholderHtml = `<div class="profile-image-large" style="background: rgba(255,255,255,0.25); display: flex; align-items: center; justify-content: center; color: white; font-size: 2.5rem; font-weight: 700;">${initials}</div>`;

    if (tutor.profileImage) {
        const baseUrl = (typeof API_BASE !== 'undefined') ? API_BASE.split('/api')[0] : '';
        const imageUrl = tutor.profileImage.startsWith('/uploads')
            ? `${baseUrl}${tutor.profileImage}`
            : tutor.profileImage;

        imgContainer.innerHTML = `<img src="${imageUrl}" alt="${tutor.fullName}" class="profile-image-large"
            onerror="this.onerror=null; this.parentNode.innerHTML='${placeholderHtml.replace(/'/g, "\\'")}'">`;
    } else {
        imgContainer.innerHTML = placeholderHtml;
    }

    // ── Verified Badge ────────────────────────────────────
    if (tutor.verified) {
        document.getElementById('verifiedHeroBadge').style.display = 'block';
    }

    // ── Text Fields ───────────────────────────────────────
    document.getElementById('profileName').textContent = tutor.fullName || 'Tutor';
    document.getElementById('profileQualification').textContent = formatQualification(tutor.qualification);
    document.getElementById('profileExperience').textContent = tutor.experience || '—';
    document.getElementById('profileLocation').textContent = tutor.location
        ? `${tutor.location.city}${tutor.location.province ? ', ' + tutor.location.province : ''}`
        : 'Not specified';

    const ratingText = tutor.totalReviews > 0
        ? `${tutor.rating.toFixed(1)} ⭐ (${tutor.totalReviews} reviews)`
        : 'New Tutor';
    document.getElementById('profileRating').textContent = ratingText;

    // ── Sidebar ───────────────────────────────────────────
    document.getElementById('profileRate').textContent = tutor.hourlyRate || '—';
    document.getElementById('sidebarRating').textContent = ratingText;
    document.getElementById('sidebarExperience').textContent = tutor.experience || '—';
    document.getElementById('sidebarLocation').textContent = tutor.location
        ? `${tutor.location.city}${tutor.location.province ? ', ' + tutor.location.province : ''}`
        : 'Not specified';

    if (tutor.teachingFormat && tutor.teachingFormat.length > 0) {
        document.getElementById('sidebarFormat').textContent = tutor.teachingFormat
            .map(f => f.charAt(0).toUpperCase() + f.slice(1))
            .join(' & ');
    }

    // ── Bio ───────────────────────────────────────────────
    document.getElementById('profileBio').innerHTML = (tutor.bio || 'No biography provided.')
        .replace(/\n/g, '<br>');

    // ── Work Experience ───────────────────────────────────
    if (tutor.workExperience) {
        document.getElementById('workExpCard').style.display = 'block';
        document.getElementById('profileWorkExp').innerHTML = tutor.workExperience.replace(/\n/g, '<br>');
    }

    // ── Subjects ──────────────────────────────────────────
    const subjectsContainer = document.getElementById('profileSubjects');
    (tutor.subjects || []).forEach(sub => {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.style.fontSize = 'var(--font-size-sm)';
        badge.textContent = formatSubject(sub);
        subjectsContainer.appendChild(badge);
    });

    // ── Teaching Format ───────────────────────────────────
    const formatsContainer = document.getElementById('profileFormats');
    (tutor.teachingFormat || []).forEach(fmt => {
        const pill = document.createElement('div');
        pill.className = 'format-pill';
        const icon = fmt === 'online' ? 'fa-laptop' : 'fa-user-friends';
        pill.innerHTML = `<i class="fas ${icon}"></i> ${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`;
        formatsContainer.appendChild(pill);
    });

    // ── Action Buttons ────────────────────────────────────
    const actionButtons = document.getElementById('actionButtons');
    const user = (typeof auth !== 'undefined') ? auth.getUser() : null;

    if (!user || user.role !== 'tutor') {
        const safeName = (tutor.fullName || '').replace(/'/g, "\\'");
        const safeSubjects = (tutor.subjects || []).join(',').replace(/'/g, "\\'");

        actionButtons.innerHTML = `
            <button class="btn btn-primary" style="width: 100%;"
                onclick="openBookingModal('${tutor._id}', '${safeName}', '${safeSubjects}', ${tutor.hourlyRate || 0})">
                <i class="fas fa-calendar-check"></i> Book a Lesson
            </button>`;
    }

    // ── Reviews ───────────────────────────────────────────
    document.getElementById('reviewCount').textContent = tutor.totalReviews || 0;
    const reviewsList = document.getElementById('reviewsList');

    if (tutor.reviews && tutor.reviews.length > 0) {
        reviewsList.innerHTML = tutor.reviews.map(review => `
            <div class="review-card">
                <div class="review-header">
                    <div>
                        <strong>${review.studentName || 'Anonymous'}</strong>
                        ${review.subject ? `<span style="font-size: var(--font-size-sm); color: var(--color-secondary); margin-left: 8px;">${formatSubject(review.subject)}</span>` : ''}
                    </div>
                    <span class="text-muted" style="font-size: 0.85rem;">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div class="stars-display" style="margin-bottom: var(--space-2);">${'⭐'.repeat(review.rating)}</div>
                <p style="margin: 0; color: var(--color-text-secondary);">${review.comment}</p>
            </div>
        `).join('');
    } else {
        reviewsList.innerHTML = '<p class="text-muted">No reviews yet. Be the first to leave a review!</p>';
    }

    // ── Write Review Button ───────────────────────────────
    const reviewActionContainer = document.getElementById('reviewActionContainer');
    if (reviewActionContainer && (!user || user.role !== 'tutor')) {
        const safeName = (tutor.fullName || '').replace(/'/g, "\\'");
        const safeSubjects = (tutor.subjects || []).join(',').replace(/'/g, "\\'");
        reviewActionContainer.innerHTML = `
            <button class="btn btn-outline btn-sm"
                onclick="openReviewModal('${tutor._id}', '${safeName}', '${safeSubjects}')">
                <i class="fas fa-pen"></i> Write a Review
            </button>`;
    }
}

function formatQualification(qual) {
    const map = {
        'bachelors': "Bachelor's Degree",
        'honours': "Honours Degree",
        'masters': "Master's Degree",
        'phd': 'PhD',
        'teaching-cert': 'Teaching Certificate',
        'diploma': 'Diploma',
    };
    return (qual && map[qual]) ? map[qual] : (qual || 'Qualified Tutor');
}

function formatSubject(code) {
    const map = {
        'mathematics-grade-12': 'Math (Gr 12)',
        'mathematics-grade-10-11': 'Math (Gr 10-11)',
        'mathematics-grade-8-9': 'Math (Gr 8-9)',
        'physical-science-grade-10': 'Phys Sci (Gr 10)',
        'physical-science-grade-11': 'Phys Sci (Gr 11)',
        'physical-science-grade-12': 'Phys Sci (Gr 12)',
        'english-primary': 'English (Gr 4-7)',
        'mathematics-primary': 'Math (Gr 4-7)',
        'coding-primary': 'Coding (Gr 4-7)',
        'english-hs': 'English',
        'afrikaans-hs': 'Afrikaans',
        'mathematics-hs': 'Mathematics',
        'math-lit-hs': 'Math Lit',
        'physical-science-hs': 'Physical Science',
        'natural-science-hs': 'Natural Science',
        'life-sciences-hs': 'Life Sciences',
        'accounting-hs': 'Accounting',
        'geography-hs': 'Geography',
        'economics-hs': 'Economics',
        'cat-hs': 'CAT',
        'it-hs': 'IT',
        'isizulu-hs': 'IsiZulu'
    };
    if (map[code]) return map[code];
    return code.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}
