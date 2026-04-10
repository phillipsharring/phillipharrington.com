import './styles/style.css';

// Hamburger menu — toggles main nav open/closed on small screens.
window.onReady = function (fn) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', fn);
    } else {
        fn();
    }
};

window.onReady(() => {
    // Hamburger menu toggle
    const hamburger = document.getElementById('hamburger-menu');
    if (hamburger) {
        const body = document.getElementById('body');
        const header = hamburger.closest('header');
        const mainNav = document.getElementById('main-nav');
        const navLinks = mainNav.querySelectorAll('a');
        const bar1 = document.getElementById('bar-1');
        const bar2 = document.getElementById('bar-2');
        const bar3 = document.getElementById('bar-3');

        const bars = [
            { element: body, classLists: ['overflow-auto', 'overflow-hidden'] },
            { element: header, classLists: ['backdrop-blur-lg'] },
            { element: mainNav, classLists: ['hidden', 'flex flex-col pt-16'] },
            { element: bar1, classLists: ['-translate-y-0.5', 'rotate-45 translate-y-1'] },
            { element: bar2, classLists: ['opacity-100', 'opacity-0'] },
            { element: bar3, classLists: ['translate-y-0.5', '-rotate-45 -translate-y-1'] },
        ];

        let isOpen = false;

        const toggleOpen = () => {
            bars.forEach(({ element, classLists }) => {
                classLists.forEach((classList) => {
                    classList.split(' ').forEach((className) => {
                        element.classList.toggle(className);
                    });
                });
            });

            isOpen = !isOpen;

            navLinks.forEach((navLink) => {
                navLink.addEventListener(
                    'click',
                    () => {
                        setTimeout(() => {
                            toggleOpen();
                        }, 500);
                    },
                    { once: true },
                );
            });
        };

        hamburger.addEventListener('click', toggleOpen);
    }

    // Theme toggle — cycles light → dark → system
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const THEMES = ['light', 'dark', 'system'];

        function getStoredPref() {
            return localStorage.getItem('theme') || 'system';
        }

        function updateIcons(pref) {
            document.getElementById('theme-icon-light')?.classList.toggle('hidden', pref !== 'light');
            document.getElementById('theme-icon-dark')?.classList.toggle('hidden', pref !== 'dark');
            document.getElementById('theme-icon-system')?.classList.toggle('hidden', pref !== 'system');
        }

        function applyTheme(pref) {
            const isDark =
                pref === 'system' ? window.matchMedia('(prefers-color-scheme:dark)').matches : pref === 'dark';
            document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
            updateIcons(pref);
        }

        // Initialize icons for stored preference
        updateIcons(getStoredPref());

        // Cycle on click
        themeToggle.addEventListener('click', () => {
            const current = getStoredPref();
            const next = THEMES[(THEMES.indexOf(current) + 1) % THEMES.length];
            localStorage.setItem('theme', next);
            applyTheme(next);
        });

        // React to system preference changes when in "system" mode
        window.matchMedia('(prefers-color-scheme:dark)').addEventListener('change', () => {
            if (getStoredPref() === 'system') {
                applyTheme('system');
            }
        });
    }

    // Scroll reveal animations
    const reveals = document.querySelectorAll('.reveal');
    if (reveals.length) {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('revealed');
                        observer.unobserve(entry.target);
                    }
                });
            },
            { threshold: 0.1, rootMargin: '0px 0px -40px 0px' },
        );
        reveals.forEach((el) => observer.observe(el));
    }
});
