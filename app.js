var _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
var API_BASE = _isLocal ? 'http://localhost:5000/api' : 'https://minatty-website.onrender.com/api';
window.API_BASE = API_BASE;

/**
 * Robust helper to get the full URL for a tutor image or document.
 * Handles local paths, Cloudinary URLs, and corrects localhost URLs in production.
 */
window.getTutorImageUrl = function(path) {
    if (!path) return '';
    if (path.startsWith('http')) {
        // If we are on production but the path points to localhost (common DB legacy), swap it
        if (!_isLocal && path.includes('localhost:5000')) {
            return path.replace('http://localhost:5000', 'https://minatty-website.onrender.com');
        }
        return path; // Already a full URL (Cloudinary or corrected)
    }
    
    // For relative paths like "/uploads/..." or "uploads/..."
    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = API_BASE.split('/api')[0];
    return `${baseUrl}${cleanPath}`;
};

// ===================================
// TUTORING WEBSITE - JAVASCRIPT
// Math & Physical Science
// ===================================

document.addEventListener('DOMContentLoaded', function () {
    console.log('App.js DOMContentLoaded fired');
    
    // ===================================
    // MOBILE NAVIGATION
    // ===================================
    const mobileMenuToggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    if (mobileMenuToggle) {
        mobileMenuToggle.addEventListener('click', function () {
            mobileMenuToggle.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Close mobile menu when clicking a link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function () {
                mobileMenuToggle.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });
    }

    // ===================================
    // HEADER SCROLL EFFECT
    // ===================================
    const header = document.getElementById('header');

    if (header) {
        window.addEventListener('scroll', function () {
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    // ===================================
    // SMOOTH SCROLLING FOR ANCHOR LINKS
    // ===================================
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const href = this.getAttribute('href');

            if (href === '#' || href === '#!') return;

            try {
                const target = document.querySelector(href);
                if (target) {
                    e.preventDefault();
                    const headerOffset = 80;
                    const elementPosition = target.getBoundingClientRect().top;
                    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

                    window.scrollTo({
                        top: offsetPosition,
                        behavior: 'smooth'
                    });
                }
            } catch (err) {
                console.warn('Invalid selector for smooth scroll:', href);
            }
        });
    });

    // ===================================
    // SCROLL ANIMATIONS
    // ===================================
    if ('IntersectionObserver' in window) {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver(function (entries) {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        }, observerOptions);

        document.querySelectorAll('.card, .hero-content > *').forEach(el => {
            el.style.opacity = '0';
            el.style.transform = 'translateY(20px)';
            el.style.transition = 'opacity 0.6s ease-out, transform 0.6s ease-out';
            observer.observe(el);
        });
    }

    // ===================================
    // SEARCH BAR FUNCTIONALITY (Homepage)
    // ===================================
    const searchButton = document.querySelector('.search-bar button');
    if (searchButton) {
        searchButton.addEventListener('click', function () {
            const subject = document.getElementById('subject')?.value;
            const grade = document.getElementById('grade')?.value;
            const location = document.getElementById('location')?.value;

            // Build query string
            let query = 'tutors.html?';
            if (subject) query += `subject=${subject}&`;
            if (grade) query += `grade=${grade}&`;
            if (location) query += `location=${encodeURIComponent(location)}&`;

            // Navigate to tutors page with filters
            window.location.href = query;
        });
    }

    // ===================================
    // CARD HOVER EFFECTS
    // ===================================
    document.querySelectorAll('.card').forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.borderColor = 'var(--color-primary-light)';
        });
        card.addEventListener('mouseleave', function () {
            this.style.borderColor = 'var(--color-border-light)';
        });
    });

    // ===================================
    // CUSTOM MULTI-SELECT DROPDOWN
    // ===================================
    const subjectDropdown = document.getElementById('subjectDropdown');
    if (subjectDropdown) {
        const trigger = subjectDropdown.querySelector('.dropdown-trigger');
        const checkboxes = subjectDropdown.querySelectorAll('input[type="checkbox"]');

        trigger.addEventListener('click', function (e) {
            e.stopPropagation();
            subjectDropdown.classList.toggle('active');
        });

        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', function () {
                updateDropdownText();
            });
        });

        function updateDropdownText() {
            const selected = Array.from(checkboxes)
                .filter(cb => cb.checked)
                .map(cb => cb.parentElement.textContent.trim());

            if (selected.length === 0) {
                trigger.textContent = 'Select subjects...';
            } else if (selected.length <= 2) {
                trigger.textContent = selected.join(', ');
            } else {
                trigger.textContent = `${selected.length} subjects selected`;
            }
        }

        // Close when clicking outside
        document.addEventListener('click', function (e) {
            if (!subjectDropdown.contains(e.target)) {
                subjectDropdown.classList.remove('active');
            }
        });
    }

    // ===================================
    // FAQ ACCORDION
    // ===================================
    document.body.addEventListener('click', (e) => {
        const question = e.target.closest('.faq-question');
        if (question) {
            const item = question.closest('.faq-item');
            if (item) {
                item.classList.toggle('active');
            }
        }
    });

    // ===================================
    // BECOME A TUTOR FORM VALIDATION
    // ===================================
    const tutorForm = document.getElementById('tutorApplicationForm');
    if (tutorForm) {
        tutorForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            const submitBtn = tutorForm.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            
            // Get values
            const fullName = document.getElementById('fullName').value.trim();
            const email = document.getElementById('email').value.trim();
            const phone = document.getElementById('phone').value.trim();
            
            if (!isValidEmail(email)) {
                alert('Please enter a valid email address.');
                return;
            }
            
            if (!isValidPhone(phone)) {
                alert('Please enter a valid South African phone number.');
                return;
            }
            
            // Show loading
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Submitting...';
            
            try {
                const formData = new FormData(tutorForm);
                const response = await fetch(`${API_BASE}/applications`, {
                    method: 'POST',
                    body: formData
                });
                
                if (response.ok) {
                    alert('Application submitted successfully! We will contact you soon.');
                    tutorForm.reset();
                } else {
                    const error = await response.json();
                    throw new Error(error.error || 'Failed to submit application');
                }
            } catch (err) {
                alert('Error: ' + err.message);
            } finally {
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalText;
            }
        });
    }
});

// ===================================
// UTILITY FUNCTIONS
// ===================================

function isValidEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function isValidPhone(phone) {
    // Basic South African phone validation
    const re = /^(\+27|0)[0-9]{9}$/;
    return re.test(phone.replace(/\s/g, ''));
}

function formatCurrency(amount) {
    return 'R' + amount.toFixed(0);
}

// ===================================
// JUNE STUDY CAMP POPUP FUNNEL
// ===================================
document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('campModalOverlay');
    if (!overlay) return; // Only execute on pages where the modal HTML exists (index.html)

    const step1 = document.getElementById('campStep1');
    const step2 = document.getElementById('campStep2');
    const step3 = document.getElementById('campStep3');
    const registerBtn = document.getElementById('campRegisterBtn');
    const form = document.getElementById('campRegistrationForm');
    const submitBtn = document.getElementById('campSubmitBtn');
    
    // Check if already shown in this session
    if (sessionStorage.getItem('campPopupShown') === 'true') {
        return;
    }

    let popupTriggered = false;

    function showPopup() {
        if (popupTriggered) return;
        popupTriggered = true;
        sessionStorage.setItem('campPopupShown', 'true');
        
        // Reset sub-steps
        step1.style.display = 'block';
        step2.style.display = 'none';
        step3.style.display = 'none';
        
        overlay.classList.add('active');
    }

    // Trigger 1: 4 seconds timer
    setTimeout(showPopup, 4000);

    // Trigger 2: 50% scroll depth
    window.addEventListener('scroll', () => {
        if (popupTriggered) return;
        const scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
        if (scrollPercent >= 50) {
            showPopup();
        }
    });

    // Trigger 3: Exit intent (desktop only)
    document.addEventListener('mouseleave', (e) => {
        if (popupTriggered) return;
        if (e.clientY < 0) {
            showPopup();
        }
    });

    // Step 1 to Step 2 transition
    if (registerBtn) {
        registerBtn.addEventListener('click', () => {
            step1.style.display = 'none';
            step2.style.display = 'block';
        });
    }

    // Form Submission (Mock to Step 3)
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Gather data for real submit if needed
            const formData = {
                firstName: document.getElementById('campFirstName').value,
                lastName: document.getElementById('campLastName').value,
                studentContact: document.getElementById('campStudentContact').value,
                parentName: document.getElementById('campParentName').value,
                parentContact: document.getElementById('campParentContact').value,
                subject: '[Study Camp 2026 Registration]',
                message: 'Auto-submitted via popup funnel'
            };

            const originalText = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = 'Submitting...';

            try {
                // Actually submit to the backend /api/contact endpoint (similar to how messages work)
                await fetch(`${API_BASE}/contact`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        name: `${formData.firstName} ${formData.lastName} (Parent: ${formData.parentName})`,
                        email: formData.parentContact, // Assuming email for general contact, or phone
                        subject: formData.subject,
                        message: `Student Contact: ${formData.studentContact}\nParent Contact: ${formData.parentContact}\n${formData.message}`
                    })
                });
            } catch (err) {
                console.warn('Backend submit failed, proceeding to success locally:', err);
            }

            // Move to Step 3
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            step2.style.display = 'none';
            step3.style.display = 'block';
        });
    }
});
