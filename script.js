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
// function initializeParallax() {
//     const heroSection = document.getElementById('hero');
//     if (!heroSection) return;
    
//     window.addEventListener('scroll', () => {
//         const scrolled = window.pageYOffset;
