// Smooth scroll for anchor links
document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (this: HTMLAnchorElement, e: Event) {
        e.preventDefault();
        const href = this.getAttribute("href");
        if (href && href !== "#") {
            const target = document.querySelector(href);
            if (target) {
                target.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }
        }
    });
});

// Header scroll effect
const header = document.querySelector(".header") as HTMLElement;
let lastScroll = 0;

window.addEventListener("scroll", () => {
    const currentScroll = window.scrollY;

    if (currentScroll > 50) {
        header.style.boxShadow = "0 4px 6px -1px rgba(0, 0, 0, 0.1)";
    } else {
        header.style.boxShadow = "none";
    }

    lastScroll = currentScroll;
});

// Mobile menu toggle
const mobileMenuBtn = document.querySelector(".mobile-menu-btn");
const navLinks = document.querySelector(".nav-links") as HTMLElement;

if (mobileMenuBtn && navLinks) {
    mobileMenuBtn.addEventListener("click", () => {
        const isOpen = navLinks.style.display === "flex";
        navLinks.style.display = isOpen ? "none" : "flex";
        navLinks.style.position = isOpen ? "" : "absolute";
        navLinks.style.top = isOpen ? "" : "70px";
        navLinks.style.left = isOpen ? "" : "0";
        navLinks.style.right = isOpen ? "" : "0";
        navLinks.style.flexDirection = isOpen ? "" : "column";
        navLinks.style.background = isOpen ? "" : "white";
        navLinks.style.padding = isOpen ? "" : "1rem";
        navLinks.style.boxShadow = isOpen ? "" : "0 4px 6px rgba(0,0,0,0.1)";
        navLinks.style.gap = isOpen ? "" : "1rem";
    });
}

// Add animation on scroll for feature cards
const observerOptions = {
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("animate-in");
        }
    });
}, observerOptions);

document.querySelectorAll(".feature-card, .grade-card").forEach((card) => {
    card.classList.add("animate-ready");
    observer.observe(card);
});

// Add styles for animations
const style = document.createElement("style");
style.textContent = `
    .animate-ready {
        opacity: 0;
        transform: translateY(20px);
        transition: opacity 0.5s ease, transform 0.5s ease;
    }

    .animate-in {
        opacity: 1;
        transform: translateY(0);
    }
`;
document.head.appendChild(style);



console.log("Exam Galaxy - Loaded Successfully");
