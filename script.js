// Portfolio JavaScript - Modern Interactive Features

document.addEventListener('DOMContentLoaded', () => {
    // Initialize all components
    initializeLoader();
    initializeNavigation();
    initializeScrollEffects();
    initializeTypewriter();
    initializeAnimations();
    initializeMobileMenu();
    setCurrentYear();
    
    // Remove loader after everything is loaded
    window.addEventListener('load', () => {
        setTimeout(() => {
            const loader = document.getElementById('loading-screen');
            if (loader) {
                loader.style.opacity = '0';
                loader.style.visibility = 'hidden';
                setTimeout(() => loader.remove(), 500);
            }
        }, 1000);
    });
});

// Loader Animation
function initializeLoader() {
    const loader = document.getElementById('loading-screen');
    if (!loader) return;
    
    // Add some loading text animations
    const loadingTexts = [
        'Loading Portfolio...',
        'Preparing Experience...',
        'Almost Ready...',
        'Welcome!'
    ];
    
    let currentIndex = 0;
    const textElement = loader.querySelector('p');
    
    if (textElement) {
        const interval = setInterval(() => {
            textElement.style.opacity = '0';
            setTimeout(() => {
                textElement.textContent = loadingTexts[currentIndex];
                textElement.style.opacity = '1';
                currentIndex = (currentIndex + 1) % loadingTexts.length;
            }, 200);
        }, 800);
        
        // Clear interval when page loads
        window.addEventListener('load', () => {
            clearInterval(interval);
        });
    }
}

// Navigation and Header Effects
function initializeNavigation() {
    const header = document.getElementById('header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section[id]');
    
    // Navbar scroll effect
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const scrollY = window.scrollY;
        
        // Add/remove scrolled class
        if (scrollY > 100) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        
        // Hide/show navbar on scroll
        if (scrollY > lastScrollY && scrollY > 500) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScrollY = scrollY;
        
        // Update active navigation link
        updateActiveNavLink();
    });
    
    // Smooth scrolling for navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetId = link.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = header.offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                closeMobileMenu();
            }
        });
    });
    
    function updateActiveNavLink() {
        const headerHeight = header.offsetHeight;
        let currentSection = '';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop - headerHeight - 100;
            const sectionHeight = section.offsetHeight;
            
            if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
                currentSection = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSection}`) {
                link.classList.add('active');
            }
        });
    }
}

// Mobile Menu Functionality
function initializeMobileMenu() {
    const hamburger = document.getElementById('hamburger');
    const mobileMenu = document.getElementById('mobile-menu');
    const mobileNavLinks = document.querySelectorAll('.mobile-nav-link');
    
    if (hamburger && mobileMenu) {
        hamburger.addEventListener('click', () => {
            toggleMobileMenu();
        });
        
        // Close menu when clicking on a link
        mobileNavLinks.forEach(link => {
            link.addEventListener('click', () => {
                closeMobileMenu();
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
                closeMobileMenu();
            }
        });
    }
    
    function toggleMobileMenu() {
        hamburger.classList.toggle('active');
        mobileMenu.classList.toggle('active');
        
        // Prevent body scroll when menu is open
        if (mobileMenu.classList.contains('active')) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }
    
    function closeMobileMenu() {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('active');
        document.body.style.overflow = '';
    }
    
    // Make closeMobileMenu available globally
    window.closeMobileMenu = closeMobileMenu;
}

// Scroll to Top Button and General Scroll Effects
function initializeScrollEffects() {
    const scrollToTopBtn = document.getElementById('scrollToTop');
    
    window.addEventListener('scroll', () => {
        // Show/hide scroll to top button
        if (window.scrollY > 300) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });
    
    // Scroll to top functionality
    if (scrollToTopBtn) {
        scrollToTopBtn.addEventListener('click', () => {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
}

// Typewriter Effect
function initializeTypewriter() {
    const typewriterElement = document.getElementById('typewriter');
    if (!typewriterElement) return;
    
    const texts = [
        'MCA Student',
        'Aspiring Software Developer',
        'Full Stack Developer',
        'Problem Solver',
        'Tech Enthusiast'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typeDelay = 100;
    
    function typeWriter() {
        const currentText = texts[textIndex];
        
        if (isDeleting) {
            typewriterElement.textContent = currentText.substring(0, charIndex - 1);
            charIndex--;
            typeDelay = 50;
        } else {
            typewriterElement.textContent = currentText.substring(0, charIndex + 1);
            charIndex++;
            typeDelay = 100;
        }
        
        if (!isDeleting && charIndex === currentText.length) {
            typeDelay = 2000; // Pause at end
            isDeleting = true;
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            textIndex = (textIndex + 1) % texts.length;
            typeDelay = 500; // Pause before next text
        }
        
        setTimeout(typeWriter, typeDelay);
    }
    
    // Start typewriter effect
    setTimeout(typeWriter, 1000);
}

// Scroll-triggered Animations
function initializeAnimations() {
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Special handling for skills grid - stagger animation
                if (entry.target.classList.contains('skills-grid')) {
                    animateSkillCards();
                }
                
                // Special handling for project cards
                if (entry.target.classList.contains('projects-grid')) {
                    animateProjectCards();
                }
                
                // Counter animation for stats
                if (entry.target.classList.contains('stat-card')) {
                    animateCounter(entry.target);
                }
            }
        });
    }, observerOptions);
    
    // Observe elements for animation
    const animatedElements = document.querySelectorAll([
        '.fade-in-up',
        '.fade-in-left', 
        '.fade-in-right',
        '.skills-grid',
        '.projects-grid',
        '.stat-card',
        '.timeline-item',
        '.contact-card'
    ].join(', '));
    
    animatedElements.forEach(el => observer.observe(el));
}

// Skill Cards Animation
function animateSkillCards() {
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(30px)';
            card.style.transition = 'all 0.6s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 100);
    });
}

// Project Cards Animation
function animateProjectCards() {
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach((card, index) => {
        setTimeout(() => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(50px)';
            card.style.transition = 'all 0.8s ease';
            
            setTimeout(() => {
                card.style.opacity = '1';
                card.style.transform = 'translateY(0)';
            }, 50);
        }, index * 200);
    });
}

// Counter Animation for Stats
function animateCounter(element) {
    const numberElement = element.querySelector('div:first-child');
    if (!numberElement) return;
    
    const finalNumber = parseInt(numberElement.textContent);
    const suffix = numberElement.textContent.replace(/[0-9]/g, '');
    let currentNumber = 0;
    const increment = finalNumber / 30;
    
    const counter = setInterval(() => {
        currentNumber += increment;
        if (currentNumber >= finalNumber) {
            numberElement.textContent = finalNumber + suffix;
            clearInterval(counter);
        } else {
            numberElement.textContent = Math.floor(currentNumber) + suffix;
        }
    }, 50);
}

// Utility Functions
function setCurrentYear() {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
}

// Smooth Reveal Animation for Elements
function revealElement(element, delay = 0) {
    setTimeout(() => {
        element.style.opacity = '0';
        element.style.transform = 'translateY(30px)';
        element.style.transition = 'all 0.8s cubic-bezier(0.4, 0, 0.2, 1)';
        
        requestAnimationFrame(() => {
            element.style.opacity = '1';
            element.style.transform = 'translateY(0)';
        });
    }, delay);
}

// Parallax Effect for Hero Section
function initializeParallax() {
    const heroSection = document.getElementById('hero');
    if (!heroSection) return;
    
    window.addEventListener('scroll', () => {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        heroSection.style.transform = `translateY(${rate}px)`;
    });
}

// Interactive Hover Effects
function initializeInteractiveEffects() {
    // Skill cards hover effect
    const skillCards = document.querySelectorAll('.skill-card');
    skillCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-10px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
    
    // Project cards hover effect
    const projectCards = document.querySelectorAll('.project-card');
    projectCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            const image = card.querySelector('.project-image img');
            if (image) {
                image.style.transform = 'scale(1.1)';
            }
        });
        
        card.addEventListener('mouseleave', () => {
            const image = card.querySelector('.project-image img');
            if (image) {
                image.style.transform = 'scale(1)';
            }
        });
    });
}

// Mouse Trail Effect
function initializeMouseTrail() {
    const trail = [];
    const maxTrailLength = 10;
    
    document.addEventListener('mousemove', (e) => {
        // Create trail dot
        const dot = document.createElement('div');
        dot.className = 'mouse-trail';
        dot.style.cssText = `
            position: fixed;
            width: 4px;
            height: 4px;
            background: linear-gradient(45deg, var(--primary-color), #8b5cf6);
            border-radius: 50%;
            pointer-events: none;
            z-index: 9999;
            left: ${e.clientX - 2}px;
            top: ${e.clientY - 2}px;
            transition: opacity 0.5s ease;
        `;
        
        document.body.appendChild(dot);
        trail.push(dot);
        
        // Remove excess trail dots
        if (trail.length > maxTrailLength) {
            const oldDot = trail.shift();
            if (oldDot) {
                oldDot.style.opacity = '0';
                setTimeout(() => oldDot.remove(), 500);
            }
        }
    });
}

// Easter Egg - Konami Code
function initializeEasterEgg() {
    const konamiCode = [38, 38, 40, 40, 37, 39, 37, 39, 66, 65]; // ↑↑↓↓←→←→BA
    let konamiIndex = 0;
    
    document.addEventListener('keydown', (e) => {
        if (e.keyCode === konamiCode[konamiIndex]) {
            konamiIndex++;
            if (konamiIndex === konamiCode.length) {
                triggerEasterEgg();
                konamiIndex = 0;
            }
        } else {
            konamiIndex = 0;
        }
    });
    
    function triggerEasterEgg() {
        // Create confetti effect
        createConfetti();
        
        // Show easter egg message
        const message = document.createElement('div');
        message.innerHTML = `
            <div style="
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: linear-gradient(45deg, var(--primary-color), #8b5cf6);
                color: white;
                padding: 2rem;
                border-radius: 1rem;
                text-align: center;
                z-index: 10000;
                box-shadow: var(--shadow-xl);
                animation: bounceIn 0.6s ease;
            ">
                <h3>🎉 Easter Egg Found! 🎉</h3>
                <p>You discovered the Konami Code!</p>
                <p>Thanks for exploring my portfolio!</p>
                <button onclick="this.parentElement.parentElement.remove()" style="
                    background: white;
                    color: var(--primary-color);
                    border: none;
                    padding: 0.5rem 1rem;
                    border-radius: 0.5rem;
                    margin-top: 1rem;
                    cursor: pointer;
                    font-weight: 600;
                ">Close</button>
            </div>
        `;
        document.body.appendChild(message);
        
        // Remove after 10 seconds if not closed manually
        setTimeout(() => {
            if (message.parentElement) {
                message.remove();
            }
        }, 10000);
    }
}

// Confetti Effect
function createConfetti() {
    const colors = ['#3b82f6', '#8b5cf6', '#f59e0b', '#10b981', '#ef4444'];
    const confettiCount = 100;
    
    for (let i = 0; i < confettiCount; i++) {
        setTimeout(() => {
            const confetti = document.createElement('div');
            confetti.style.cssText = `
                position: fixed;
                width: 10px;
                height: 10px;
                background: ${colors[Math.floor(Math.random() * colors.length)]};
                left: ${Math.random() * window.innerWidth}px;
                top: -10px;
                z-index: 9999;
                pointer-events: none;
                border-radius: ${Math.random() > 0.5 ? '50%' : '0'};
                animation: confettiFall 3s linear forwards;
            `;
            
            document.body.appendChild(confetti);
            
            setTimeout(() => confetti.remove(), 3000);
        }, i * 30);
    }
}

// Add CSS for animations
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        @keyframes bounceIn {
            0% {
                transform: translate(-50%, -50%) scale(0.3);
                opacity: 0;
            }
            50% {
                transform: translate(-50%, -50%) scale(1.05);
            }
            70% {
                transform: translate(-50%, -50%) scale(0.9);
            }
            100% {
                transform: translate(-50%, -50%) scale(1);
                opacity: 1;
            }
        }
        
        @keyframes confettiFall {
            to {
                transform: translateY(${window.innerHeight + 20}px) rotate(720deg);
                opacity: 0;
            }
        }
        
        .mouse-trail {
            animation: trailFade 0.5s ease-out forwards;
        }
        
        @keyframes trailFade {
            from {
                opacity: 1;
                transform: scale(1);
            }
            to {
                opacity: 0;
                transform: scale(0);
            }
        }
        
        /* Loading animations */
        .fade-in-up {
            opacity: 0;
            transform: translateY(50px);
            animation: fadeInUp 0.8s ease forwards;
        }
        
        .fade-in-left {
            opacity: 0;
            transform: translateX(-50px);
            animation: fadeInLeft 0.8s ease forwards;
        }
        
        .fade-in-right {
            opacity: 0;
            transform: translateX(50px);
            animation: fadeInRight 0.8s ease forwards;
        }
        
        /* Stagger animations */
        .fade-in-left:nth-child(1) { animation-delay: 0.1s; }
        .fade-in-left:nth-child(2) { animation-delay: 0.2s; }
        .fade-in-left:nth-child(3) { animation-delay: 0.3s; }
        
        .contact-card:nth-child(1) { animation-delay: 0.1s; }
        .contact-card:nth-child(2) { animation-delay: 0.2s; }
        .contact-card:nth-child(3) { animation-delay: 0.3s; }
        
        /* Responsive animations */
        @media (prefers-reduced-motion: reduce) {
            *,
            *::before,
            *::after {
                animation-duration: 0.01ms !important;
                animation-iteration-count: 1 !important;
                transition-duration: 0.01ms !important;
            }
        }
        
        /* Smooth focus styles */
        .nav-link:focus,
        .btn-primary:focus,
        .btn-secondary:focus,
        .social-link:focus {
            outline: 2px solid var(--primary-color);
            outline-offset: 2px;
        }
        
        /* Dark mode media query support */
        @media (prefers-color-scheme: dark) {
            :root {
                --text-dark: #f8fafc;
                --text-light: #cbd5e1;
                --bg-light: #1e293b;
            }
        }
    `;
    document.head.appendChild(style);
}

// Performance optimization - Lazy loading for images
function initializeLazyLoading() {
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.classList.remove('lazy');
                    observer.unobserve(img);
                }
            });
        });
        
        images.forEach(img => imageObserver.observe(img));
    } else {
        // Fallback for older browsers
        images.forEach(img => {
            img.src = img.dataset.src;
            img.classList.remove('lazy');
        });
    }
}

// Theme toggle functionality (bonus feature)
function initializeThemeToggle() {
    // Check for saved theme or default to light
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    // Create theme toggle button (optional)
    const themeToggle = document.createElement('button');
    themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    themeToggle.className = 'theme-toggle';
    themeToggle.style.cssText = `
        position: fixed;
        top: 50%;
        right: 1rem;
        transform: translateY(-50%);
        width: 50px;
        height: 50px;
        border-radius: 50%;
        border: none;
        background: var(--primary-color);
        color: white;
        font-size: 1.2rem;
        cursor: pointer;
        transition: all 0.3s ease;
        z-index: 1000;
        box-shadow: var(--shadow-md);
    `;
    
    themeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
        
        themeToggle.innerHTML = newTheme === 'dark' 
            ? '<i class="fas fa-sun"></i>' 
            : '<i class="fas fa-moon"></i>';
    });
    
    // Uncomment to add theme toggle
    // document.body.appendChild(themeToggle);
}

// Initialize all interactive features
function initializeAllFeatures() {
    addDynamicStyles();
    initializeInteractiveEffects();
    initializeEasterEgg();
    initializeLazyLoading();
    initializeThemeToggle();
    // initializeMouseTrail(); // Uncomment if you want mouse trail effect
    // initializeParallax(); // Uncomment if you want parallax effect
}

// Call initialization after DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Add a small delay to ensure everything is ready
    setTimeout(initializeAllFeatures, 100);
});

// Error handling for missing elements
function safeQuerySelector(selector, callback) {
    const element = document.querySelector(selector);
    if (element && typeof callback === 'function') {
        callback(element);
    }
}

// Utility function for debouncing scroll events
function debounce(func, wait, immediate) {
    let timeout;
    return function executedFunction() {
        const context = this;
        const args = arguments;
        const later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        const callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
}