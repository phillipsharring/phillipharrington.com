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
    const hamburger = document.getElementById('hamburger-menu');
    if (!hamburger) return;

    const body = document.getElementById('body');
    const mainNav = document.getElementById('main-nav');
    const navLinks = mainNav.querySelectorAll('a');
    const bar1 = document.getElementById('bar-1');
    const bar2 = document.getElementById('bar-2');
    const bar3 = document.getElementById('bar-3');

    const bars = [
        { element: body, classLists: ['overflow-auto', 'overflow-hidden'] },
        { element: mainNav, classLists: ['hidden', 'flex flex-col inset-x-0 top-0'] },
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
                { once: true }
            );
        });
    };

    hamburger.addEventListener('click', toggleOpen);
});
