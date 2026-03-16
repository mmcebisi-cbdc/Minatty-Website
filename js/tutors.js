// We no longer import missing insforge.js SDK. Using local API instead.

document.addEventListener('DOMContentLoaded', () => {
    // Allow public viewing of tutors
    // Auth checks are enforced on individual actions (booking, reviews)

    fetchTutors();
    injectBookingModal();
    injectReviewModal();
    injectViewReviewsModal();

    // Event listeners for filters - Auto update on change
    const filters = ['filterSubject', 'filterGrade', 'filterRate', 'sortBy'];
    filters.forEach(id => {
        document.getElementById(id)?.addEventListener('change', fetchTutors);
    });
});

window.deleteTutor = async function (id) {
    if (!confirm('Are you sure you want to DELETE this tutor? This cannot be undone.')) return;

    try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE}/tutors/${id}`, {
            method: 'DELETE',
            headers: { 'x-auth-token': token }
        });

        if (!res.ok) throw new Error(await res.text());

        alert('Tutor profile deleted successfully');
        fetchTutors();
    } catch (error) {
        console.error('Error deleting tutor:', error);
        alert('Error deleting tutor: ' + (error.message || 'Unknown error'));
    }
}

async function fetchTutors() {
    const tutorGrid = document.getElementById('tutorGrid');
    if (!tutorGrid) return; // Guard for pages without a tutor grid

    const resultCount = document.getElementById('resultCount');
    tutorGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">Loading tutors...</div>';

    const subject = document.getElementById('filterSubject')?.value || '';
    const grade = document.getElementById('filterGrade')?.value || '';
    const maxRate = document.getElementById('filterRate')?.value || '';
    const sortBy = document.getElementById('sortBy')?.value || 'rating';

    try {
        // Construct query parameters
        const queryParams = new URLSearchParams();
        if (subject) queryParams.append('subject', subject);
        if (grade) queryParams.append('grade', grade);
        if (maxRate) queryParams.append('maxRate', maxRate);
        if (sortBy) queryParams.append('sortBy', sortBy);

        const response = await fetch(`${API_BASE}/tutors?${queryParams.toString()}`);

        if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
        }

        const tutors = await response.json();

        // The local API returns Mongoose models properties exactly as they are defined (camelCase)
        // We match them mapping the id correctly as Mongoose returns `_id` 
        const normalized = tutors.map(t => ({
            _id: t._id,
            fullName: t.fullName,
            email: t.email,
            phone: t.phone,
            profileImage: t.profileImage, // THIS WAS THE BUG (was previously t.profile_image which undefined it)
            qualification: t.qualification,
            university: t.university,
            subjects: Array.isArray(t.subjects) ? t.subjects : JSON.parse(t.subjects || '[]'),
            gradeLevel: Array.isArray(t.gradeLevel) ? t.gradeLevel : JSON.parse(t.gradeLevel || '[]'),
            experience: t.experience,
            workExperience: t.workExperience,
            bio: t.bio,
            hourlyRate: t.hourlyRate,
            teachingFormat: Array.isArray(t.teachingFormat) ? t.teachingFormat : JSON.parse(t.teachingFormat || '[]'),
            rating: t.rating,
            totalReviews: t.totalReviews,
            verified: t.verified,
            status: t.status,
        }));

        renderTutors(normalized);
        if (resultCount) resultCount.textContent = normalized.length;

    } catch (error) {
        console.error('Error fetching tutors:', error);
        if (tutorGrid) {
            tutorGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px; color: var(--color-error);">Failed to load tutors. Please try again later.</div>';
        }
    }
}

function renderTutors(tutors) {
    console.log('Rendering tutors:', tutors.length);
    const tutorGrid = document.getElementById('tutorGrid');
    if (!tutorGrid) {
        console.error('CRITICAL: tutorGrid element not found in DOM');
        return;
    }

    tutorGrid.innerHTML = '';

    if (tutors.length === 0) {
        tutorGrid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 40px;">No tutors found matching your criteria.</div>';
        return;
    }

    tutors.forEach(tutor => {
        console.log('Creating card for:', tutor.fullName);
        const card = document.createElement('div');
        card.className = 'card tutor-card';
        // Add data attributes
        card.dataset.id = tutor._id;
        card.dataset.subject = (tutor.subjects || []).join(' ');
        card.dataset.grade = (tutor.gradeLevel || []).join(' ');

        // Profile Image
        let profileHtml = '<div class="profile-placeholder" style="width: 80px; height: 80px; border-radius: 50%; background-color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #64748b;">' + (tutor.fullName ? tutor.fullName.charAt(0).toUpperCase() : '?') + '</div>';

        if (tutor.profileImage) {
            // Robust base URL derivation (handles /api or /api/)
            const baseUrl = API_BASE.split('/api')[0];
            const imageUrl = tutor.profileImage.startsWith('/uploads') ? `${baseUrl}${tutor.profileImage}` : tutor.profileImage;

            // Use onerror to handle 404/400 errors
            profileHtml = `<img src="${imageUrl}" alt="${tutor.fullName}"
                style="width: 80px; height: 80px; border-radius: 50%; object-fit: cover;"
                onerror="this.onerror=null; this.parentNode.innerHTML='<div style=\\'width: 80px; height: 80px; border-radius: 50%; background-color: #e2e8f0; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: #64748b;\\'>${tutor.fullName ? tutor.fullName.charAt(0).toUpperCase() : '?'}</div>'">`;
        } else {
            const initials = tutor.fullName ? tutor.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : '??';
            profileHtml = `<div style="width: 80px; height: 80px; border-radius: 50%; background: linear-gradient(135deg, var(--color-primary), var(--color-secondary)); display: flex; align-items: center; justify-content: center; color: white; font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold);">${initials}</div>`;
        }

        // Subjects badges
        const subjectsHtml = (tutor.subjects || []).map(sub => {
            return `<span class="badge">${formatSubject(sub)}</span>`;
        }).join('');

        // Stars
        const stars = '⭐'.repeat(Math.round(tutor.rating || 5));

        // Verified Badge
        const verifiedBadge = tutor.verified === true ?
            `<span class="badge badge-success" style="display: inline-flex; align-items: center; gap: 4px;">✓ Verified</span>` : '';

        // Escape strings for onclick handler to prevent syntax errors with quotes
        const safeName = (tutor.fullName || '').replace(/'/g, "\\'");
        const safeSubjects = (tutor.subjects || []).join(',').replace(/'/g, "\\'");

        card.innerHTML = `
            <div style="display: flex; align-items: start; gap: var(--space-4); margin-bottom: var(--space-4);">
                <div style="flex-shrink: 0;">
                    ${profileHtml}
                </div>
                <div style="flex: 1;">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: var(--space-2);">
                        <h4 style="margin: 0;">${tutor.fullName}</h4>
                        ${verifiedBadge}
                    </div>
                    <div class="stars mb-2" style="color: var(--color-warning);">
                        ${stars} 
                        <a href="#" onclick="openViewReviewsModal('${tutor._id}'); return false;" style="color: var(--color-text-muted); text-decoration: underline; margin-left: 5px; font-size: var(--font-size-sm);">
                            (${tutor.totalReviews || 0} reviews)
                        </a>
                    </div>
                    <p class="text-muted" style="font-size: var(--font-size-sm); margin: 0;">${tutor.qualification || 'Tutor'} • ${tutor.experience || '0'} years exp</p>
                </div>
            </div>

            <div style="margin-bottom: var(--space-4);">
                <div style="display: flex; flex-wrap: wrap; gap: var(--space-2); margin-bottom: var(--space-3);">
                    ${subjectsHtml}
                </div>
                ${tutor.workExperience ? `
                <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); margin-bottom: var(--space-2); font-weight: 500;">
                    <i class="fas fa-briefcase" style="margin-right: 5px; color: var(--color-primary);"></i>
                    ${tutor.workExperience.length > 50 ? tutor.workExperience.substring(0, 50) + '...' : tutor.workExperience}
                </p>` : ''}
                <p style="color: var(--color-text-secondary); font-size: var(--font-size-sm); line-height: var(--line-height-relaxed); display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
                    ${tutor.bio || 'No bio available.'}
                </p>
            </div>

            <div class="card-footer" style="display: flex; justify-content: space-between; align-items: center;">
                <div>
                    <p style="font-size: var(--font-size-sm); color: var(--color-text-muted); margin-bottom: 0;">Starting from</p>
                    <p style="font-size: var(--font-size-2xl); font-weight: var(--font-weight-bold); color: var(--color-primary); margin: 0;">R${tutor.hourlyRate || 0}/hr</p>
                </div>

                <div style="display: flex; gap: 10px;">
                    ${(typeof auth !== 'undefined' && auth.getUser() && auth.getUser().role === 'admin') ?
                `<button class="btn btn-reject" style="padding: 8px 15px; background-color: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;" onclick="deleteTutor('${tutor._id}')">Delete</button>` : ''
            }
                     <a href="profile.html?id=${tutor._id}" class="btn btn-outline" style="padding: 8px 15px; text-decoration: none;">View Profile</a>
                    ${(typeof auth !== 'undefined' && auth.getUser() && auth.getUser().role === 'tutor') ? '' :
                `<button class="btn btn-primary" onclick="openBookingModal('${tutor._id}', '${safeName}', '${safeSubjects}', ${tutor.hourlyRate || 0})">Book Session</button>`
            }
                </div>
            </div>
        `;

        console.log('Appending card to grid...');
        tutorGrid.appendChild(card);
        console.log('Card appended. Total cards in grid:', tutorGrid.children.length);
    });

    console.log('Grid innerHTML length:', tutorGrid.innerHTML.length);
    console.log('Grid display style:', window.getComputedStyle(tutorGrid).display);
    console.log('Grid visibility:', window.getComputedStyle(tutorGrid).visibility);
}

// ========================
// BOOKING MODAL LOGIC
// ========================

function injectBookingModal() {
    // Check if modal already exists to prevent duplicates
    if (document.getElementById('bookingModal')) return;

    const modalHtml = `
    <div id="bookingModal" class="modal-overlay">
        <div class="modal-content">
            <button onclick="closeBookingModal()" class="modal-close">&times;</button>
            <div class="modal-header">
                <h2 id="bookingTitle" class="modal-title">Book a Session</h2>
                <p id="bookingTutorName" class="modal-subtitle"></p>
            </div>
            
            <!-- STEP 1: Details Form -->
            <form id="bookingForm" onsubmit="handleBookingNextStep(event)">
                <input type="hidden" id="bookingTutorId">
                
                <div class="form-group">
                    <label class="form-label">Your Name</label>
                    <input type="text" id="bookingName" required class="form-input" placeholder="Enter your full name">
                </div>

                <div class="form-group">
                    <label class="form-label">Your Email</label>
                    <input type="email" id="bookingEmail" required class="form-input" placeholder="Enter your email address">
                </div>

                <div class="form-group">
                    <label class="form-label">Subject</label>
                    <select id="bookingSubject" required class="form-select">
                        <option value="">Select Subject</option>
                    </select>
                </div>

                <div class="form-group">
                    <label class="form-label">Lesson Format</label>
                    <div style="display: flex; gap: 15px;">
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="bookingFormat" value="online" checked style="margin-right: 8px;"> Online
                        </label>
                        <label style="display: flex; align-items: center; cursor: pointer;">
                            <input type="radio" name="bookingFormat" value="in-person" style="margin-right: 8px;"> In-Person (Contact)
                        </label>
                    </div>
                </div>

                <div class="form-group">
                    <label class="form-label">Preferred Date & Time</label>
                    <input type="datetime-local" id="bookingDate" required class="form-input">
                </div>

                <div class="form-group">
                    <label class="form-label">Message (Optional)</label>
                    <textarea id="bookingMessage" rows="3" class="form-textarea" placeholder="Any specific topics you want to cover?"></textarea>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%;">Next: Choose Lesson Type</button>
            </form>

            <!-- STEP 2: Lesson Type Selection -->
            <div id="bookingStep2" style="display: none;">
                <p class="mb-4">Please select your session type:</p>
                
                <div id="trialOptionContainer" class="option-card" onclick="selectLessonType('trial')">
                    <div class="option-card-title" style="color: var(--color-primary);">Trial Lesson (30 min)</div>
                    <div class="option-card-desc">Free introduction session to meet your tutor.</div>
                    <span class="badge-trial">First time only</span>
                </div>

                <div class="option-card" onclick="selectLessonType('regular')">
                    <div class="option-card-title">Regular Lesson (1 hour)</div>
                    <div class="option-card-desc">Standard full-length tutoring session.</div>
                    <div id="regularPriceDisplay" class="mt-4" style="font-weight: bold; color: var(--color-primary);"></div>
                </div>

                <button class="btn btn-outline" style="width: 100%; margin-top: 10px;" onclick="backToStep1()">Back</button>
            </div>

            <!-- STEP 3: Payment -->
            <div id="bookingStep3" style="display: none;">
                <p class="mb-4" style="font-weight: 500;">Complete Payment</p>
                <div id="paymentAmountDisplay" class="payment-amount"></div>

                <!-- PayPal Button Container -->
                <div id="paypal-button-container" class="mb-4"></div>

                <!-- Credit/Debit Card Form -->
                <div id="cardPaymentForm" style="margin-top: 20px; border: 1px solid #e2e8f0; padding: 15px; border-radius: 8px; background: #f8fafc;">
                    <h4 style="margin-top: 0; margin-bottom: 15px; color: var(--color-text-primary);">Enter Card Details</h4>
                    
                    <div class="form-group">
                        <label class="form-label" style="font-size: 0.9rem;">Cardholder Name</label>
                        <input type="text" id="cardName" class="form-input" placeholder="Name on card" style="padding: 8px;">
                    </div>

                    <div class="form-group">
                        <label class="form-label" style="font-size: 0.9rem;">Card Number</label>
                        <div style="position: relative;">
                            <input type="text" id="cardNumber" class="form-input" placeholder="0000 0000 0000 0000" maxlength="19" style="padding: 8px; letter-spacing: 1px;">
                            <span style="position: absolute; right: 10px; top: 50%; transform: translateY(-50%); font-size: 1.2rem; color: #cbd5e1;">💳</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 15px;">
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label" style="font-size: 0.9rem;">Expiry Date</label>
                            <input type="text" id="cardExpiry" class="form-input" placeholder="MM/YY" maxlength="5" style="padding: 8px;">
                        </div>
                        <div class="form-group" style="flex: 1;">
                            <label class="form-label" style="font-size: 0.9rem;">CVV</label>
                            <input type="text" id="cardCvv" class="form-input" placeholder="123" maxlength="4" style="padding: 8px;">
                        </div>
                    </div>

                    <button id="payCardButton" class="btn btn-primary" style="width: 100%; margin-top: 10px;" onclick="processCardPayment()">
                        Pay Now
                    </button>
                </div>

                <button class="btn btn-outline" style="width: 100%; margin-top: 15px;" onclick="backToStep2()">Back</button>
            </div>
            
            <!-- Loading Indicator -->
             <div id="bookingLoading" style="display: none; text-align: center; padding: 20px;">
                <div class="spinner" style="border: 4px solid #f3f3f3; border-top: 4px solid var(--color-primary); border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; margin: 0 auto 15px;"></div>
                <p>Processing...</p>
            </div>
        </div>
    </div>
    <style>
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

let bookingData = {};
let selectedTutorRate = 0;

window.openBookingModal = async function (tutorId, tutorName, subjectsStr, rate) {
    try {
        injectBookingModal(); // Ensure modal exists

        // Indicate loading if desired, but for now just wait
        if (typeof auth !== 'undefined' && auth.isAuthenticated()) {
            await auth.refreshUser().catch(err => console.warn('Background auth refresh failed', err));
        }

        // Reset State
        const modal = document.getElementById('bookingModal');
        modal.style.display = 'flex';
        // Small delay to allow display flex to apply before adding opacity class for animation
        setTimeout(() => modal.classList.add('show'), 10);

        document.getElementById('bookingForm').style.display = 'block';
        document.getElementById('bookingStep2').style.display = 'none';
        document.getElementById('bookingStep3').style.display = 'none';
        document.getElementById('bookingLoading').style.display = 'none';
        document.getElementById('bookingTitle').textContent = 'Book a Session';

        document.getElementById('bookingTutorId').value = tutorId;
        document.getElementById('bookingTutorName').textContent = `with ${tutorName}`;

        selectedTutorRate = rate || 0;
        document.getElementById('regularPriceDisplay').textContent = `Rate: R${selectedTutorRate}/hr`;

        // Pre-fill user data if logged in
        const user = (typeof auth !== 'undefined') ? auth.getUser() : null;

        if (user) {
            const displayName = user.full_name || user.name || '';
            document.getElementById('bookingName').value = displayName;
            document.getElementById('bookingEmail').value = user.email || '';
            // Pre-fill card name too (saves typing on payment step)
            const cardNameEl = document.getElementById('cardName');
            if (cardNameEl && !cardNameEl.value) cardNameEl.value = displayName;

            // Critical Fix: Check updated hasUsedTrial status
            const trialContainer = document.getElementById('trialOptionContainer');
            if (user.hasUsedTrial) {
                trialContainer.style.display = 'none';
            } else {
                trialContainer.style.display = 'block';
            }
        } else {
            // Guest users: show trial option
            document.getElementById('trialOptionContainer').style.display = 'block';
        }

        // Populate subjects
        const subjectSelect = document.getElementById('bookingSubject');
        subjectSelect.innerHTML = '<option value="">Select Subject</option>';

        const subjects = subjectsStr.split(',');
        subjects.forEach(sub => {
            const option = document.createElement('option');
            option.value = sub;
            option.textContent = formatSubject(sub);
            subjectSelect.appendChild(option);
        });

    } catch (err) {
        console.error('Error opening booking modal:', err);
        alert('Could not open booking window. Please try refreshing the page.');
    }
}

window.closeBookingModal = function () {
    const modal = document.getElementById('bookingModal');
    modal.classList.remove('show');
    setTimeout(() => {
        modal.style.display = 'none';
    }, 300); // Match transition duration
}

window.handleBookingNextStep = function (e) {
    e.preventDefault();

    // Collect step 1 data
    bookingData = {
        studentName: document.getElementById('bookingName').value,
        studentEmail: document.getElementById('bookingEmail').value,
        tutorId: document.getElementById('bookingTutorId').value,
        subject: document.getElementById('bookingSubject').value,
        lessonFormat: document.querySelector('input[name="bookingFormat"]:checked').value,
        date: document.getElementById('bookingDate').value,
        message: document.getElementById('bookingMessage').value
    };

    // Go to Step 2
    document.getElementById('bookingForm').style.display = 'none';
    document.getElementById('bookingStep2').style.display = 'block';
    document.getElementById('bookingTitle').textContent = 'Choose Lesson Type';
}

window.backToStep1 = function () {
    document.getElementById('bookingStep2').style.display = 'none';
    document.getElementById('bookingForm').style.display = 'block';
    document.getElementById('bookingTitle').textContent = 'Book a Session';
}

window.selectLessonType = function (type) {
    bookingData.lessonType = type;

    // Visual selection feedback
    document.querySelectorAll('.option-card').forEach(el => el.classList.remove('selected'));
    if (type === 'trial') {
        document.getElementById('trialOptionContainer').classList.add('selected');
        // Trial is free, skip payment, submit directly
        setTimeout(() => {
            submitBooking({
                ...bookingData,
                paymentStatus: 'paid', // Free = paid
                amount: 0,
                paymentMethod: 'none'
            });
        }, 300);
    } else {
        // Regular: Go to Step 3 (Payment)
        bookingData.amount = selectedTutorRate;
        document.getElementById('bookingStep2').style.display = 'none';
        document.getElementById('bookingStep3').style.display = 'block';
        document.getElementById('bookingTitle').textContent = 'Payment';
        document.getElementById('paymentAmountDisplay').textContent = `Total: R${selectedTutorRate}`;

        // Initialize PayPal button if not already done
        renderPayPalButton();
    }
}

window.backToStep2 = function () {
    document.getElementById('bookingStep3').style.display = 'none';
    document.getElementById('bookingStep2').style.display = 'block';
    document.getElementById('bookingTitle').textContent = 'Choose Lesson Type';
}

function renderPayPalButton() {
    const container = document.getElementById('paypal-button-container');
    if (container.innerHTML !== '') return; // Already rendered

    if (window.paypal) {
        paypal.Buttons({
            createOrder: function (data, actions) {
                return actions.order.create({
                    purchase_units: [{
                        amount: {
                            value: (selectedTutorRate / 18).toFixed(2) // Convert Rands to USD approx or use ZAR if supported
                        }
                    }]
                });
            },
            onApprove: function (data, actions) {
                return actions.order.capture().then(function (details) {
                    // Successful PayPal payment
                    submitBooking({
                        ...bookingData,
                        paymentStatus: 'paid',
                        paymentMethod: 'paypal',
                        transactionId: details.id,
                        amount: selectedTutorRate
                    });
                });
            }
        }).render('#paypal-button-container');
    }
}

window.processCardPayment = async function () {
    // Collect Card Data
    const cardName = document.getElementById('cardName').value;
    const cardNumber = document.getElementById('cardNumber').value;
    const cardExpiry = document.getElementById('cardExpiry').value;
    const cardCvv = document.getElementById('cardCvv').value;

    // Basic Validation
    if (!cardName || !cardNumber || !cardExpiry || !cardCvv) {
        alert('Please fill in all card details.');
        return;
    }

    if (cardNumber.replace(/\s/g, '').length < 13) {
        alert('Please enter a valid card number.');
        return;
    }

    const button = document.getElementById('payCardButton');
    button.disabled = true;
    button.textContent = 'Processing...';

    // Simulate API Processing Delay
    setTimeout(() => {
        // Success
        submitBooking({
            ...bookingData,
            paymentStatus: 'paid',
            paymentMethod: 'credit_card', // Updated method
            transactionId: 'card_' + Date.now(),
            amount: selectedTutorRate
        });
        button.disabled = false;
        button.textContent = 'Pay Now';
    }, 2000);
}

window.submitBooking = async function (finalData) {
    document.getElementById('bookingForm').style.display = 'none';
    document.getElementById('bookingStep2').style.display = 'none';
    document.getElementById('bookingStep3').style.display = 'none';
    document.getElementById('bookingLoading').style.display = 'block';

    try {
        // Fetch tutor name for record
        const tResponse = await fetch(`${API_BASE}/tutors/${finalData.tutorId}`);
        const tutorData = await tResponse.json();
        const tutorName = tutorData?.fullName || '';

        const bookingPayload = {
            studentName: finalData.studentName,
            studentEmail: finalData.studentEmail,
            tutorId: finalData.tutorId,
            tutorName: tutorName,
            subject: finalData.subject,
            date: finalData.date,
            message: finalData.message || '',
            lessonType: finalData.lessonType || 'regular',
            lessonFormat: finalData.lessonFormat || 'online',
            paymentStatus: finalData.paymentStatus || 'pending',
            paymentMethod: finalData.paymentMethod || 'none',
            transactionId: finalData.transactionId || '',
            amount: finalData.amount || 0,
            status: 'pending'
        };

        const response = await fetch(`${API_BASE}/bookings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bookingPayload)
        });

        if (!response.ok) throw new Error(await response.text());

        // Update trial user status logic removed (profiles API not currently built out in local repo)
        // Can be added later when unified user profiles are implemented locally.

        alert('Booking confirmed successfully!');
        closeBookingModal();
    } catch (error) {
        console.error('Error booking:', error);
        alert('Booking failed: ' + (error.message || 'Unknown error'));
        document.getElementById('bookingLoading').style.display = 'none';
        document.getElementById('bookingForm').style.display = 'block';
    }
}

// ========================
// REVIEW MODAL LOGIC
// ========================

function injectReviewModal() {
    const modalHtml = `
    <div id="reviewModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
        <div style="background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 500px; position: relative;">
            <button onclick="closeReviewModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            <h2 style="margin-top: 0;">Write a Review</h2>
            <p id="reviewTutorName" style="color: var(--color-text-secondary); margin-bottom: 20px;"></p>
            
            <form id="reviewForm" onsubmit="submitReview(event)">
                <input type="hidden" id="reviewTutorId">
                <input type="hidden" id="reviewRating" value="5">
                
                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Rating</label>
                    <div id="starRating" style="display: flex; gap: 5px; cursor: pointer;">
                        <span data-value="1" style="font-size: 1.5rem; color: var(--color-warning);">★</span>
                        <span data-value="2" style="font-size: 1.5rem; color: var(--color-warning);">★</span>
                        <span data-value="3" style="font-size: 1.5rem; color: var(--color-warning);">★</span>
                        <span data-value="4" style="font-size: 1.5rem; color: var(--color-warning);">★</span>
                        <span data-value="5" style="font-size: 1.5rem; color: var(--color-warning);">★</span>
                    </div>
                </div>

                <div class="form-group" style="margin-bottom: 15px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Subject</label>
                    <select id="reviewSubject" required style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;">
                        <option value="">Select Subject</option>
                    </select>
                </div>

                <div class="form-group" style="margin-bottom: 20px;">
                    <label style="display: block; margin-bottom: 5px; font-weight: 500;">Your Review</label>
                    <textarea id="reviewComment" required rows="4" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 6px;" placeholder="Share your experience..."></textarea>
                </div>

                <button type="submit" class="btn btn-primary" style="width: 100%;">Submit Review</button>
            </form>
        </div>
    </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Star Rating Logic
    const stars = document.querySelectorAll('#starRating span');
    stars.forEach(star => {
        star.addEventListener('click', function () {
            const value = this.dataset.value;
            document.getElementById('reviewRating').value = value;
            updateStars(value);
        });
    });
}

function updateStars(value) {
    const stars = document.querySelectorAll('#starRating span');
    stars.forEach(star => {
        if (star.dataset.value <= value) {
            star.style.color = 'var(--color-warning)';
            star.textContent = '★';
        } else {
            star.style.color = '#ddd';
            star.textContent = '★'; // or '☆'
        }
    });
}

window.openReviewModal = function (tutorId, tutorName, subjectsStr) {
    if (typeof auth !== 'undefined' && !auth.isAuthenticated()) {
        alert('Please login to write a review.');
        window.location.href = 'login.html?redirect=tutors.html';
        return;
    }

    document.getElementById('reviewModal').style.display = 'flex';
    document.getElementById('reviewTutorId').value = tutorId;
    document.getElementById('reviewTutorName').textContent = `for ${tutorName}`;

    // Reset stars
    updateStars(5);
    document.getElementById('reviewRating').value = 5;

    // Populate subjects
    const subjectSelect = document.getElementById('reviewSubject');
    subjectSelect.innerHTML = '<option value="">Select Subject</option>';

    const subjects = subjectsStr.split(',');
    subjects.forEach(sub => {
        const option = document.createElement('option');
        option.value = sub;
        option.textContent = formatSubject(sub); // Use nice format
        subjectSelect.appendChild(option);
    });
}

window.closeReviewModal = function () {
    document.getElementById('reviewModal').style.display = 'none';
}

window.submitReview = async function (e) {
    e.preventDefault();

    const user = auth.getUser();
    if (!user) {
        alert('You must be logged in to submit a review.');
        return;
    }

    const tutorId = document.getElementById('reviewTutorId').value;
    const rating = Number(document.getElementById('reviewRating').value);
    const comment = document.getElementById('reviewComment').value;
    const subject = document.getElementById('reviewSubject').value;

    try {
        // Post review to local API
        const reviewPayload = {
            studentName: user.name || user.full_name || 'Student',
            rating,
            comment,
            subject
        };

        const res = await fetch(`${API_BASE}/tutors/${tutorId}/review`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': auth.getToken() || ''
            },
            body: JSON.stringify(reviewPayload)
        });

        if (!res.ok) throw new Error(await res.text());

        alert('Review submitted successfully!');
        closeReviewModal();
        document.getElementById('reviewForm').reset();
        fetchTutors();
    } catch (error) {
        console.error('Error submitting review:', error);
        alert('Error submitting review: ' + (error.message || 'Unknown error'));
    }
}

// ========================
// VIEW REVIEWS MODAL LOGIC
// ========================

function injectViewReviewsModal() {
    const modalHtml = `
    <div id="viewReviewsModal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
        <div style="background: white; padding: 30px; border-radius: 12px; width: 90%; max-width: 600px; max-height: 80vh; overflow-y: auto; position: relative;">
            <button onclick="closeViewReviewsModal()" style="position: absolute; top: 15px; right: 15px; border: none; background: none; font-size: 1.5rem; cursor: pointer;">&times;</button>
            <h2 style="margin-top: 0;">Student Reviews</h2>
            <div id="reviewsList" style="display: flex; flex-direction: column; gap: 15px;">
                <!-- Reviews injected here -->
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
}

window.openViewReviewsModal = async function (tutorId) {
    try {
        const reviewsList = document.getElementById('reviewsList');
        document.getElementById('viewReviewsModal').style.display = 'flex';
        reviewsList.innerHTML = '<p style="text-align:center;">Loading reviews...</p>';

        const response = await fetch(`${API_BASE}/tutors/${tutorId}`);
        if (!response.ok) throw new Error(await response.text());
        const tutor = await response.json();

        const reviews = tutor.reviews || [];

        if (!reviews || reviews.length === 0) {
            reviewsList.innerHTML = '<p class="text-muted" style="text-align: center;">No reviews yet.</p>';
            return;
        }

        reviewsList.innerHTML = reviews.map(review => `
            <div style="border-bottom: 1px solid #eee; padding-bottom: 15px;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                    <strong>${review.studentName || 'Anonymous Student'}</strong>
                    <span style="color: var(--color-text-muted); font-size: 0.9em;">${new Date(review.date).toLocaleDateString()}</span>
                </div>
                <div style="color: var(--color-warning); margin-bottom: 5px;">${'⭐'.repeat(review.rating)}</div>
                <div style="font-size: 0.9em; font-weight: 500; color: var(--color-primary); margin-bottom: 5px;">${review.subject ? formatSubject(review.subject) : ''}</div>
                <p style="margin: 0; color: var(--color-text-secondary);">${review.comment}</p>
            </div>
        `).join('');

    } catch (error) {
        console.error('Error fetching reviews:', error);
        alert('Failed to load reviews.');
    }
}

window.closeViewReviewsModal = function () {
    document.getElementById('viewReviewsModal').style.display = 'none';
}

window.formatSubject = function (code) {
    // Map of specific codes to nice labels
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

    // Fallback: Capitalize and replace hyphens
    return code.split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

// Map the old name for internal use within this file
const formatSubject = window.formatSubject;
