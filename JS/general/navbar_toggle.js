function initNavbarToggle() {
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('navLinks');

    if (hamburger && navLinks) {
        hamburger.addEventListener('click', function() {
            hamburger.classList.toggle('active');
            navLinks.classList.toggle('active');
        });

        // Închidere meniu când se face click pe un link
        const links = navLinks.querySelectorAll('a');
        links.forEach(link => {
            link.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        });

        // Închidere meniu când se face click pe butonul de logout din meniu mobil
        const logoutBtnMobile = navLinks.querySelector('.logout-btn-mobile');
        if (logoutBtnMobile) {
            logoutBtnMobile.addEventListener('click', function() {
                hamburger.classList.remove('active');
                navLinks.classList.remove('active');
            });
        }
    }
}

// Observ când navbar-ul se încarcă și inițializez toggle-ul
const observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
        if (document.getElementById('hamburger') && document.getElementById('navLinks')) {
            initNavbarToggle();
            observer.disconnect(); // Stop observing după ce s-a găsit navbarul
        }
    });
});

observer.observe(document.getElementById('navbar-placeholder'), { childList: true, subtree: true });