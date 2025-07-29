document.addEventListener('DOMContentLoaded', function() {
    window.onload = function() {

    let isDarkMode = false;

    const toggleBtn = document.getElementById('themeToggle');
    const body = document.body;
    const openBtn = document.getElementById('openBtn');
    const sideNav = document.getElementById('mySidenav');

    // Check for saved theme preference or default to light mode
    const savedTheme = false; // localStorage not available, so default to light

    function updateTheme() {
        if (isDarkMode) {
            body.classList.add('dark');
            toggleBtn.classList.add('dark');
            openBtn.classList.add('dark');
            sideNav.classList.add('dark');
        } else {
            body.classList.remove('dark');
            toggleBtn.classList.remove('dark');
            openBtn.classList.remove('dark');
            sideNav.classList.remove('dark');
        }

        // Add a pulse effect to show the change
        toggleBtn.classList.add('pulse');
        setTimeout(() => {
            toggleBtn.classList.remove('pulse');
        }, 2000);
    }

    toggleBtn.addEventListener('click', () => {
        isDarkMode = !isDarkMode;
        updateTheme();
    });

    // Initialize theme
    updateTheme();

    // Add keyboard support
    toggleBtn.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            isDarkMode = !isDarkMode;
            updateTheme();
        }
    });

    // Add some interactive hover effects
    const cards = document.querySelectorAll('.demo-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            card.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        card.addEventListener('mouseleave', () => {
            card.style.transform = 'translateY(0) scale(1)';
        });
    });
}
});

function toggleNav() {
    const sidenav = document.getElementById("mySidenav");
    const main = document.getElementById("main");
    
    if (sidenav.style.width === "250px") {
        // Close the nav
        sidenav.style.width = "0";
        main.classList.remove("nav-open");
    } else {
        // Open the nav
        sidenav.style.width = "250px";
        main.classList.add("nav-open");
    }
}

// Keep closeNav function for the X button
function closeNav() {
    document.getElementById("mySidenav").style.width = "0";
    document.getElementById("main").classList.remove("nav-open");
}

// Updated click outside listener
document.addEventListener("click", function(event) {
    const sidenav = document.getElementById('mySidenav');
    const openBtn = document.getElementById('open-btn');
    
    if (!sidenav.contains(event.target) && !openBtn.contains(event.target)) {
        if (sidenav.style.width === "250px") {
            closeNav();
        }
    }
});