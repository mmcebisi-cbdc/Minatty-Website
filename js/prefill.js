/**
 * Minatty Hub — Form Pre-fill Utility
 *
 * Reads the logged-in user from localStorage and pre-populates
 * form fields across the site so users never have to re-type info.
 *
 * Pages covered:
 *   contact.html        → #name, #email
 *   become-tutor.html   → #fullName, #email, #phone, #qualification
 *   tutors.html (modal) → #bookingName, #bookingEmail, #cardName
 */

export function prefillForms() {
    const raw = localStorage.getItem('user');
    if (!raw) return;

    let user;
    try { user = JSON.parse(raw); } catch { return; }
    if (!user) return;

    const name = user.full_name || user.name || '';
    const email = user.email || '';
    const phone = user.phone || '';

    // Map of fieldId → value to fill
    const textFields = {
        // Contact form
        name: name,
        // Tutor application form
        fullName: name,
        studentName: name,
        email: email,
        phone: phone,
        phoneNumber: phone,
        parentPhone: user.parent_guardian_number || '',
        parentGuardianNumber: user.parent_guardian_number || '',
        // Booking modal (tutors.html)
        bookingName: name,
        bookingEmail: email,
        // Card payment
        cardName: name,
    };

    Object.entries(textFields).forEach(([id, value]) => {
        if (!value) return;
        const el = document.getElementById(id);
        if (el && !el.value) {
            el.value = value;
            // Subtle green tint so user sees it was auto-filled
            el.style.background = '#f0fdf4';
            el.addEventListener('focus', () => { el.style.background = ''; }, { once: true });
        }
    });

    // Select dropdowns
    const selectFields = {
        grade: String(user.grade || ''),
        qualification: user.qualification || '',
    };

    Object.entries(selectFields).forEach(([id, value]) => {
        if (!value) return;
        const el = document.getElementById(id);
        if (!el) return;
        const option = [...el.options].find(
            o => o.value === value || o.value.toLowerCase().includes(value.toLowerCase())
        );
        if (option) el.value = option.value;
    });
}

// Auto-run on static forms when the DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', prefillForms);
} else {
    prefillForms();
}
