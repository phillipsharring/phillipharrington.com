document.getElementById('hamburger-menu').addEventListener('click', () => {
  toggleOpen();
});

const body = document.getElementById('body');
// const wrapper = document.getElementById('wrapper');
const mainNav = document.getElementById('main-nav');

const navLinks = mainNav.querySelectorAll('a');

const bar1 = document.getElementById('bar-1');
const bar2 = document.getElementById('bar-2');
const bar3 = document.getElementById('bar-3');

// closed, open
const bars = [
  {
    element: body,
    classLists: ['overflow-auto', 'overflow-hidden'],
  },
  {
    element: mainNav,
    classLists: ['hidden', 'flex flex-col inset-x-0 top-0'],
  },
  {
    element: bar1,
    classLists: [
      '-translate-y-0.5 bg-stone-300',
      'bg-stone-800 rotate-45 translate-y-1',
    ],
  },
  {
    element: bar2,
    classLists: ['opacity-100 bg-stone-300', 'bg-stone-800 opacity-0'],
  },
  {
    element: bar3,
    classLists: [
      'translate-y-0.5 bg-stone-300',
      'bg-stone-800 -rotate-45 -translate-y-1',
    ],
  },
];

let isOpen = false;

const toggleOpen = () => {
  bars.forEach(({ element, classLists }) => {
    classLists.forEach((classList) => {
      const classes = classList.split(' ');
      classes.forEach((className) => {
        element.classList.toggle(className);
      });
    });
  });

  isOpen = !isOpen;

  navLinks.forEach((navLink) => {
    navLink.addEventListener(
      'click',
      () => {
        // e
        // e.preventDefault();
        // const target = e.target;
        // const href = target.getAttribute("href");
        // window.location.href = href;
        setTimeout(() => {
          toggleOpen();
        }, 500);
      },
      { once: true },
    );
  });
};

// toggleOpen();
