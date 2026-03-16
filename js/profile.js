document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const tutorId = urlParams.get('id');

    if (!tutorId) {
        alert('No tutor specified.');
        window.location.href = 'tutors.html';
        return;
    }

    try {
        await linkReviewButton(tutorId); // Setup event listener first if button exists
        await loadTutorProfile(tutorId);
    } catch (error) {
        console.error('Error loading profile:', error);
        document.getElementById('loading').innerHTML = '<p style="color: red;">Failed to load profile.</p>';
    }
});

async function loadTutorProfile(tutorId) {
    const response = await fetch(`${API_BASE}/tutors/${tutorId}`);
    if (!response.ok) throw new Error('Failed to fetch tutor');

    const tutor = await response.json();

    // Hide Loading, Show Content
    document.getElementById('loading').style.display = 'none';
    document.getElementById('profileContent').style.display = 'block';

    // Populate Data
    document.title = `${tutor.fullName} - Tutor Profile | Minatty`;

    // Image
    const imgContainer = document.getElementById('profileImageContainer');
    if (tutor.profileImage) {
        // Robust base URL derivation (handles /api or /api/)
        const baseUrl = API_BASE.split('/api')[0];
        const imageUrl = tutor.profileImage.startsWith('/uploads') ? `${baseUrl}${tutor.profileImage}` : tutor.profileImage;

        imgContainer.innerHTML = `<img src="${imageUrl}" alt="${tutor.fullName}" class="profile-image-large" 
            onerror="this.onerror=null; this.parentNode.innerHTML='<div class=\\'profile-image-large\\' style=\\'background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;\\'>${tutor.fullName ? tutor.fullName.charAt(0).toUpperCase() : '?'}</div>'">`;
    } else {
        const initials = tutor.fullName ? tutor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
        imgContainer.innerHTML = `<div class="profile-image-large" style="background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); display: flex; align-items: center; justify-content: center; color: white; font-size: 3rem;">${initials}</div>`;
    }

    // Text Fields
    document.getElementById('profileName').textContent = tutor.fullName;
    if (tutor.verified) {
        const verifiedBadge = document.createElement('span');
        verifiedBadge.className = 'badge badge-success';
        verifiedBadge.style.marginLeft = '10px';
        verifiedBadge.style.fontSize = '0.8rem';
        verifiedBadge.style.verticalAlign = 'middle';
        verifiedBadge.innerHTML = '<i class="fas fa-check-circle"></i> Verified';
        document.getElementById('profileName').appendChild(verifiedBadge);
    }
    document.getElementById('profileQualification').textContent = tutor.qualification;
    document.getElementById('profileRating').textContent = `${tutor.rating ? tutor.rating.toFixed(1) : 'New'} (${tutor.totalReviews || 0} reviews)`;
    document.getElementById('profileExperience').textContent = tutor.experience;
    document.getElementById('profileLocation').textContent = tutor.location ? tutor.location.city : 'N/A';
    document.getElementById('profileRate').textContent = `R${tutor.hourlyRate}`;

    // Bio (handle newlines)
    document.getElementById('profileBio').innerHTML = (tutor.bio || 'No biography provided.').replace(/\n/g, '<br>');

    // Work Experience
    if (tutor.workExperience) {
        const workExpSection = document.createElement('section');
        workExpSection.style.marginBottom = 'var(--space-8)';
        workExpSection.innerHTML = `
            <h3 class="section-title">Work Experience</h3>
            <p style="line-height: var(--line-height-relaxed); color: var(--color-text-secondary);">
                ${tutor.workExperience.replace(/\n/g, '<br>')}
            </p>
        `;
        // Insert after Bio section (which is the first section in main)
        const mainContent = document.querySelector('.profile-content');
        const bioSection = mainContent.querySelector('section'); // The first section is About Me
        bioSection.parentNode.insertBefore(workExpSection, bioSection.nextSibling);
    }

    // Subjects
    const subjectsContainer = document.getElementById('profileSubjects');
    tutor.subjects.forEach(sub => {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = formatSubject(sub); // Function from tutors.js (make sure tutors.js is loaded or copy formatSubject)
        subjectsContainer.appendChild(badge);
    });

    // Formats
    const formatsContainer = document.getElementById('profileFormats');
    if (tutor.teachingFormat) {
        tutor.teachingFormat.forEach(fmt => {
            const div = document.createElement('div');
            div.innerHTML = `<i class="fas fa-${fmt === 'online' ? 'laptop' : 'user-friends'}" style="color: var(--color-primary);"></i> ${fmt.charAt(0).toUpperCase() + fmt.slice(1)}`;
            formatsContainer.appendChild(div);
        });
    }

    // Book Button
    const actionButtons = document.getElementById('actionButtons');
    // Check if user is logged in and not a tutor
    const user = (typeof auth !== 'undefined') ? auth.getUser() : null;

    if (!user || user.role !== 'tutor') {
        const bookBtn = document.createElement('button');
        bookBtn.className = 'btn btn-primary full-width';
        bookBtn.style.width = '100%';
        bookBtn.textContent = 'Book a Lesson';

        // Escape strings
        const safeName = (tutor.fullName || '').replace(/'/g, "\\'");
        const safeSubjects = (tutor.subjects || []).join(',').replace(/'/g, "\\'");

        bookBtn.setAttribute('onclick', `openBookingModal('${tutor._id}', '${safeName}', '${safeSubjects}', ${tutor.hourlyRate || 0})`);
        actionButtons.appendChild(bookBtn);
    }

    // Reviews
    document.getElementById('reviewCount').textContent = tutor.totalReviews || 0;
    const reviewsList = document.getElementById('reviewsList');

    if (tutor.reviews && tutor.reviews.length > 0) {
        reviewsList.innerHTML = tutor.reviews.map(review => `
            <div class="card" style="padding: var(--space-4);">
                <div style="display: flex; justify-content: space-between; margin-bottom: var(--space-2);">
                    <strong>${review.studentName || 'Anonymous'}</strong>
                    <span class="text-muted" style="font-size: 0.9rem;">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div style="color: var(--color-warning); margin-bottom: var(--space-2);">${'⭐'.repeat(review.rating)}</div>
                <p style="margin: 0; color: var(--color-text-secondary);">${review.comment}</p>
            </div>
        `).join('');
    } else {
        reviewsList.innerHTML = '<p class="text-muted">No reviews yet.</p>';
    }

    // Update Write Review Button
    const reviewActionContainer = document.getElementById('reviewActionContainer');
    if (reviewActionContainer && (!user || user.role !== 'tutor')) {
        const writeReviewBtn = document.createElement('button');
        writeReviewBtn.className = 'btn btn-outline';
        writeReviewBtn.textContent = 'Write a Review';

        const safeName = (tutor.fullName || '').replace(/'/g, "\\'");
        const safeSubjects = (tutor.subjects || []).join(',').replace(/'/g, "\\'");
        writeReviewBtn.setAttribute('onclick', `openReviewModal('${tutor._id}', '${safeName}', '${safeSubjects}')`);

        reviewActionContainer.appendChild(writeReviewBtn);
    }
}

async function linkReviewButton(tutorId) {
    // This might be called before elements are loaded if not careful, 
    // but we check for existence inside loadTutorProfile or set it there.
    // Actually, setting it in loadTutorProfile is safer as we have tutor data.
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
    return code.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
}
