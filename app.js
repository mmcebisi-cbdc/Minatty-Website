const _isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
const API_BASE = _isLocal ? 'http://localhost:5000/api' : 'https://minatty-website.onrender.com/api';
window.API_BASE = API_BASE; // Make globally accessible to other scripts

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
