document.addEventListener('DOMContentLoaded', () => {
    const navbar = document.getElementById('navbar');
    const navMenu = document.querySelector('#navbar .nav-menu');
    const hamburger = document.querySelector('.hamburger');
    const navLinks = document.querySelectorAll('#navbar .nav-link');
    const sections = document.querySelectorAll('section[id]'); // Get all sections with an ID
    const scrollToTopBtn = document.querySelector('.scroll-to-top');
    const contactForm = document.getElementById('contact-form');
    const formMessage = document.getElementById('form-message');
    const currentYearSpan = document.getElementById('currentYear');

    // Set current year in footer
    if (currentYearSpan) {
        currentYearSpan.textContent = new Date().getFullYear();
    }

    // --- Navbar Logic ---

    // Hamburger menu toggle
    if (hamburger && navMenu) {
        hamburger.addEventListener('click', () => {
            hamburger.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when a link is clicked
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                if (navMenu.classList.contains('active')) {
                    hamburger.classList.remove('active');
                    navMenu.classList.remove('active');
                }
            });
        });
    }

    // Sticky navbar and active link highlighting on scroll
    function handleScroll() {
        // Sticky navbar
        if (window.scrollY > navbar.offsetHeight) {
            navbar.classList.add('sticky');
        } else {
            navbar.classList.remove('sticky'); // This class isn't explicitly styled yet but can be used
        }

        // Scroll to top button visibility
        if (scrollToTopBtn) {
            if (window.scrollY > 300) {
                scrollToTopBtn.classList.add('visible');
            } else {
                scrollToTopBtn.classList.remove('visible');
            }
        }

        // Active link highlighting
        let currentSectionId = '';
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            // Adjust offset for navbar height if it's fixed and opaque
            const activationOffset = navbar.offsetHeight + 50;

            if (pageYOffset >= sectionTop - activationOffset && pageYOffset < sectionTop + sectionHeight - activationOffset) {
                currentSectionId = section.getAttribute('id');
            }
        });
        
        // Special case for hero when at the very top
        if (window.scrollY < sections[0].offsetTop + sections[0].clientHeight - (navbar.offsetHeight + 50)) {
             if (sections[0].id === 'hero') currentSectionId = 'hero';
        }


        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href').substring(1) === currentSectionId) {
                link.classList.add('active');
            }
        });
    }

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial call to set active link on page load

    // --- Smooth Scrolling for all anchor links ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);

            if (targetElement) {
                let offset = navbar.offsetHeight;
                // If target is hero, scroll to very top (0)
                if (targetId === '#hero') {
                    offset = 0;
                     window.scrollTo({
                        top: 0,
                        behavior: 'smooth'
                    });
                } else {
                     window.scrollTo({
                        top: targetElement.offsetTop - offset + 1, // +1 for pixel perfection with some browsers
                        behavior: 'smooth'
                    });
                }
            }
        });
    });


    // --- Contact Form Submission (Basic Example) ---
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            e.preventDefault(); // Prevent default form submission

            // Basic validation example (can be more robust)
            const name = this.elements['name'].value.trim();
            const email = this.elements['email'].value.trim();
            const message = this.elements['message'].value.trim();

            if (!name || !email || !message) {
                displayFormMessage('Please fill in all required fields.', 'error');
                return;
            }
            if (!isValidEmail(email)) {
                displayFormMessage('Please enter a valid email address.', 'error');
                return;
            }

            // Simulate form submission (replace with actual AJAX call)
            displayFormMessage('Sending your message...', 'info'); // Optional: show sending status

            // Example: Using Fetch API (you'd need a backend endpoint)
            /*
            const formData = new FormData(this);
            fetch('YOUR_BACKEND_ENDPOINT', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json()) // Or .text() depending on backend response
            .then(data => {
                if (data.success) { // Assuming backend returns { success: true }
                    displayFormMessage('Message sent successfully! Thank you.', 'success');
                    contactForm.reset();
                } else {
                    displayFormMessage(data.message || 'An error occurred. Please try again.', 'error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                displayFormMessage('An error occurred. Please try again later.', 'error');
            });
            */

            // For this demo, we'll just show a success message after a delay
            setTimeout(() => {
                displayFormMessage('Message sent successfully! (This is a demo)', 'success');
                contactForm.reset();
                setTimeout(() => displayFormMessage('', ''), 3000); // Clear message after a few seconds
            }, 1500);
        });
    }

    function displayFormMessage(message, type) {
        if (formMessage) {
            formMessage.textContent = message;
            formMessage.className = `form-message ${type}`; // type can be 'success', 'error', or 'info'
        }
    }

    function isValidEmail(email) {
        // Basic email validation regex
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    // --- Scroll Reveal / Animations (Simple Example) ---
    // You can use a library like ScrollReveal.js for more advanced effects
    // This is a very basic version:
    const revealElements = document.querySelectorAll('.section-title, .skill-item, .project-card, .timeline-item, .hero-text > *, .hero-image-container');

    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed'); // Add a class to trigger CSS animation
                // observer.unobserve(entry.target); // Optional: stop observing once revealed
            } else {
                // entry.target.classList.remove('revealed'); // Optional: remove class to re-animate on scroll up
            }
        });
    }, { threshold: 0.1 }); // Trigger when 10% of the element is visible

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });
    // Add CSS for .revealed class (e.g., opacity, transform) in style.css if you want animations
    // Example CSS for reveal (add to style.css):
    /*
    .section-title, .skill-item, .project-card, .timeline-item, .hero-text > *, .hero-image-container {
        opacity: 0;
        transform: translateY(30px);
        transition: opacity 0.6s ease-out, transform 0.6s ease-out;
    }
    .revealed {
        opacity: 1;
        transform: translateY(0);
    }
    */
    // Note: The above CSS is commented out. You'd add it to your style.css and uncomment it,
    // then uncomment the .revealed class addition in the JS observer.
    // For simplicity in this example, I'm not including the CSS animation part directly,
    // but the JS setup is here if you want to implement it.

});