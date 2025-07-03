// Custom cursor functionality
let customCursor = null;
let mouseX = 0;
let mouseY = 0;

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    initCustomCursor();
    initRippleEffect();
    initFloatingParticles();
    initScrollAnimations();
    initTimelineParticles();
    initRocketSystem();
});

// Custom Cursor
function initCustomCursor() {
    // Create custom cursor element
    customCursor = document.createElement('div');
    customCursor.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 12px;
        height: 12px;
        background: rgba(255, 255, 255, 0.8);
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        transition: all 0.1s ease;
        transform: translate(-50%, -50%);
    `;
    document.body.appendChild(customCursor);

    // Track mouse movement
    document.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        
        if (customCursor) {
            customCursor.style.left = mouseX + 'px';
            customCursor.style.top = mouseY + 'px';
        }
    });

    // Cursor hover effects
    const interactiveElements = document.querySelectorAll('.timeline-item, .timeline-dot, .timeline-card');
    
    interactiveElements.forEach(element => {
        element.addEventListener('mouseenter', () => {
            if (customCursor) {
                customCursor.style.transform = 'translate(-50%, -50%) scale(2)';
                customCursor.style.background = 'rgba(79, 172, 254, 0.8)';
            }
        });
        
        element.addEventListener('mouseleave', () => {
            if (customCursor) {
                customCursor.style.transform = 'translate(-50%, -50%) scale(1)';
                customCursor.style.background = 'rgba(255, 255, 255, 0.8)';
            }
        });
    });
}

// Ripple Effect
function initRippleEffect() {
    const rippleContainer = document.querySelector('.ripple-container');
    
    document.addEventListener('click', (e) => {
        createRipple(e.clientX, e.clientY);
    });
    
    // Create ripples on timeline item hover
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
        item.addEventListener('mouseenter', (e) => {
            const rect = item.getBoundingClientRect();
            const x = rect.left + rect.width / 2;
            const y = rect.top + rect.height / 2;
            createRipple(x, y, 0.5);
        });
    });
    
    function createRipple(x, y, scale = 1) {
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.transform = `scale(0)`;
        
        // Add some randomness to the ripple color
        const colors = [
            'rgba(255, 255, 255, 0.3)',
            'rgba(79, 172, 254, 0.3)',
            'rgba(0, 242, 254, 0.3)'
        ];
        const randomColor = colors[Math.floor(Math.random() * colors.length)];
        ripple.style.border = `2px solid ${randomColor}`;
        
        rippleContainer.appendChild(ripple);
        
        // Animate the ripple
        requestAnimationFrame(() => {
            ripple.style.transform = `scale(${4 * scale})`;
            ripple.style.opacity = '0';
        });
        
        // Remove ripple after animation
        setTimeout(() => {
            ripple.remove();
        }, 800);
    }
}

// Floating Particles
function initFloatingParticles() {
    const particleContainer = document.querySelector('.floating-particles');
    const particleCount = 30;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle();
    }
    
    function createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random positioning
        const x = Math.random() * window.innerWidth;
        const y = Math.random() * window.innerHeight;
        const size = Math.random() * 3 + 1;
        const animationDuration = Math.random() * 4 + 4;
        const delay = Math.random() * 2;
        
        particle.style.cssText = `
            position: absolute;
            left: ${x}px;
            top: ${y}px;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.3});
            border-radius: 50%;
            animation: float ${animationDuration}s ease-in-out infinite;
            animation-delay: ${delay}s;
            pointer-events: none;
        `;
        
        particleContainer.appendChild(particle);
        
        // Remove and recreate particle after animation cycle
        setTimeout(() => {
            particle.remove();
            createParticle();
        }, (animationDuration + delay) * 1000);
    }
}

// Scroll Animations
function initScrollAnimations() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    // Intersection Observer for scroll animations
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('animate');
                
                // Add staggered animation to timeline items
                const index = Array.from(timelineItems).indexOf(entry.target);
                entry.target.style.animationDelay = `${index * 0.1}s`;
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -100px 0px'
    });
    
    timelineItems.forEach(item => {
        observer.observe(item);
    });
}

// Enhanced timeline interactions
document.addEventListener('DOMContentLoaded', function() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    
    timelineItems.forEach((item, index) => {
        // Add dynamic glow effect on hover
        item.addEventListener('mouseenter', () => {
            const dot = item.querySelector('.timeline-dot');
            const card = item.querySelector('.timeline-card');
            
            // Enhanced glow effect
            dot.style.boxShadow = '0 0 40px rgba(79, 172, 254, 1)';
            
            // Smooth card appearance with spring animation
            card.style.transform = 'translateY(-50%) scale(1.05)';
            card.style.boxShadow = '0 20px 40px rgba(0, 0, 0, 0.3)';
            
            // Create extra particles around the dot
            createHoverParticles(dot);
            
            // Create timeline line energy surge
            createEnergysurge(dot);
        });
        
        item.addEventListener('mouseleave', () => {
            const dot = item.querySelector('.timeline-dot');
            const card = item.querySelector('.timeline-card');
            
            // Reset effects
            dot.style.boxShadow = '';
            card.style.transform = 'translateY(-50%) scale(0.8)';
            card.style.boxShadow = '';
        });
    });
    
    function createHoverParticles(element) {
        const rect = element.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        
        for (let i = 0; i < 12; i++) {
            const particle = document.createElement('div');
            const angle = (i * 30) * Math.PI / 180;
            const distance = 40 + Math.random() * 20;
            const x = centerX + Math.cos(angle) * distance;
            const y = centerY + Math.sin(angle) * distance;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${Math.random() * 3 + 2}px;
                height: ${Math.random() * 3 + 2}px;
                background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5});
                border-radius: 50%;
                pointer-events: none;
                z-index: 1000;
                animation: particleBurst ${Math.random() * 0.5 + 0.8}s ease-out forwards;
                box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
            `;
            
            document.body.appendChild(particle);
            
            setTimeout(() => {
                particle.remove();
            }, 1300);
        }
    }
    
    function createEnergysurge(element) {
        const rect = element.getBoundingClientRect();
        const timelineContainer = document.querySelector('.timeline-container');
        const timelineRect = timelineContainer.getBoundingClientRect();
        
        // Create energy pulse that travels up and down the timeline
        for (let direction of [-1, 1]) {
            const pulse = document.createElement('div');
            pulse.style.cssText = `
                position: fixed;
                left: ${timelineRect.left + timelineRect.width / 2}px;
                top: ${rect.top + rect.height / 2}px;
                width: 4px;
                height: 20px;
                background: linear-gradient(to bottom, 
                    rgba(255, 255, 255, 1), 
                    rgba(79, 172, 254, 0.8),
                    rgba(255, 255, 255, 1));
                border-radius: 2px;
                pointer-events: none;
                z-index: 999;
                transform: translateX(-50%);
                box-shadow: 0 0 10px rgba(255, 255, 255, 0.9);
                animation: energyPulse 1.5s ease-out forwards;
                --direction: ${direction};
            `;
            
            document.body.appendChild(pulse);
            
            setTimeout(() => {
                pulse.remove();
            }, 1500);
        }
    }
});

// Add particle burst animation
const style = document.createElement('style');
style.textContent = `
    @keyframes particleBurst {
        0% {
            transform: scale(0);
            opacity: 1;
        }
        50% {
            transform: scale(1.5);
            opacity: 0.8;
        }
        100% {
            transform: scale(0);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Smooth scrolling for better UX
document.documentElement.style.scrollBehavior = 'smooth';

// Timeline Particle System
function initTimelineParticles() {
    const particleContainer = document.querySelector('.timeline-particles');
    const timelineContainer = document.querySelector('.timeline-container');
    
    if (!particleContainer || !timelineContainer) return;
    
    const containerHeight = timelineContainer.offsetHeight;
    const particleCount = 150; // Increased for more particles
    
    // Create continuous particle emission
    setInterval(() => {
        createTimelineParticle();
    }, 50); // Emit particle every 50ms
    
    // Create sparks less frequently
    setInterval(() => {
        createTimelineSpark();
    }, 200);
    
    function createTimelineParticle() {
        const particle = document.createElement('div');
        particle.className = 'line-particle';
        
        // Random starting position along the timeline
        const startY = Math.random() * containerHeight;
        const driftX = (Math.random() - 0.5) * 60; // Random horizontal drift
        const size = Math.random() * 4 + 2;
        const duration = Math.random() * 3 + 2;
        const delay = Math.random() * 0.5;
        
        particle.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${startY}px;
            width: ${size}px;
            height: ${size}px;
            background: rgba(255, 255, 255, ${Math.random() * 0.5 + 0.5});
            border-radius: 50%;
            pointer-events: none;
            --drift-x: ${driftX}px;
            animation: lineParticleFloat ${duration}s linear ${delay}s forwards;
            box-shadow: 0 0 6px rgba(255, 255, 255, 0.8);
        `;
        
        particleContainer.appendChild(particle);
        
        // Remove particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
            }
        }, (duration + delay) * 1000);
    }
    
    function createTimelineSpark() {
        const spark = document.createElement('div');
        spark.className = 'line-particle-spark';
        
        const startY = Math.random() * containerHeight;
        const duration = Math.random() * 2 + 1.5;
        const delay = Math.random() * 0.3;
        
        spark.style.cssText = `
            position: absolute;
            left: 50%;
            top: ${startY}px;
            width: 2px;
            height: ${Math.random() * 10 + 6}px;
            background: linear-gradient(to bottom, 
                rgba(255, 255, 255, 1), 
                rgba(255, 255, 255, 0.5),
                transparent);
            pointer-events: none;
            animation: sparkFloat ${duration}s linear ${delay}s forwards;
            box-shadow: 0 0 4px rgba(255, 255, 255, 0.9);
        `;
        
        particleContainer.appendChild(spark);
        
        setTimeout(() => {
            if (spark.parentNode) {
                spark.remove();
            }
        }, (duration + delay) * 1000);
    }
}

// Enhanced dynamic background - keep it mostly black
document.addEventListener('mousemove', throttle((e) => {
    const x = e.clientX / window.innerWidth;
    const y = e.clientY / window.innerHeight;
    
    document.body.style.background = `
        radial-gradient(circle at ${x * 100}% ${y * 100}%, 
        rgba(255, 255, 255, 0.02) 0%, 
        rgba(0, 0, 0, 1) 30%),
        #000000
    `;
}, 16));

// Rocket System
function initRocketSystem() {
    const rocketContainer = document.querySelector('.rocket-container');
    
    // Launch rockets periodically
    setInterval(() => {
        launchRocket();
    }, 8000); // Launch every 8 seconds
    
    // Launch initial rocket after 2 seconds
    setTimeout(() => {
        launchRocket();
    }, 2000);
    
    function launchRocket() {
        const rocket = document.createElement('div');
        rocket.className = 'rocket-line';
        
        // Random vertical position
        const y = Math.random() * (window.innerHeight - 100) + 50;
        rocket.style.top = y + 'px';
        rocket.style.left = '-50px';
        
        rocketContainer.appendChild(rocket);
        
        // Create trail particles as rocket moves
        const trailInterval = setInterval(() => {
            if (rocket.offsetWidth > 0) {
                createTrailParticles(rocket.offsetWidth * 0.8, y);
            }
        }, 30);
        
        // Stop trail and create explosion when rocket reaches end
        setTimeout(() => {
            clearInterval(trailInterval);
            createRocketExplosion(window.innerWidth - 50, y);
        }, 3200); // Explosion just before rocket fades
        
        // Remove rocket after animation
        setTimeout(() => {
            rocket.remove();
        }, 4000);
    }
    
    function createTrailParticles(x, y) {
        const particleCount = Math.random() * 3 + 2; // 2-5 particles
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'rocket-particle rocket-trail-particle';
            
            // Position behind the rocket head
            const offsetX = Math.random() * 40 - 20;
            const offsetY = Math.random() * 20 - 10;
            
            particle.style.left = (x + offsetX) + 'px';
            particle.style.top = (y + offsetY) + 'px';
            
            // Random drift
            const driftX = (Math.random() - 0.5) * 60;
            const driftY = (Math.random() - 0.5) * 40;
            
            particle.style.setProperty('--drift-x', driftX + 'px');
            particle.style.setProperty('--drift-y', driftY + 'px');
            
            // Random size and opacity
            const size = Math.random() * 2 + 1;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.opacity = Math.random() * 0.5 + 0.5;
            
            rocketContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 2000);
        }
    }
    
    function createRocketExplosion(x, y) {
        // Create explosion particles (80% less = 20% of normal amount)
        const explosionCount = Math.floor((Math.random() * 15 + 10) * 0.2); // 2-5 particles instead of 10-25
        
        for (let i = 0; i < explosionCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'rocket-particle rocket-explosion-particle';
            
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            
            // Random explosion direction
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * 100 + 50;
            const driftX = Math.cos(angle) * distance;
            const driftY = Math.sin(angle) * distance;
            
            particle.style.setProperty('--drift-x', driftX + 'px');
            particle.style.setProperty('--drift-y', driftY + 'px');
            
            // Random size
            const size = Math.random() * 3 + 1;
            particle.style.width = size + 'px';
            particle.style.height = size + 'px';
            particle.style.opacity = Math.random() * 0.6 + 0.4;
            
            rocketContainer.appendChild(particle);
            
            // Remove particle after animation
            setTimeout(() => {
                particle.remove();
            }, 3000);
        }
    }
}

// Performance optimization: throttle expensive operations
function throttle(func, delay) {
    let timeoutId;
    let lastExecTime = 0;
    return function (...args) {
        const currentTime = Date.now();
        
        if (currentTime - lastExecTime > delay) {
            func.apply(this, args);
            lastExecTime = currentTime;
        } else {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
                lastExecTime = Date.now();
            }, delay - (currentTime - lastExecTime));
        }
    };
} 