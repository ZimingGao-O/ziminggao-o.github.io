const header = document.querySelector('.site-header');
const menuButton = document.querySelector('.menu-button');
const navigation = document.querySelector('#site-nav');

function updateHeader() {
  header.classList.toggle('scrolled', window.scrollY > 18);
}

function closeMenu() {
  navigation.classList.remove('open');
  header.classList.remove('menu-open');
  menuButton.setAttribute('aria-expanded', 'false');
  document.body.style.overflow = '';
}

menuButton.addEventListener('click', () => {
  const open = !navigation.classList.contains('open');
  navigation.classList.toggle('open', open);
  header.classList.toggle('menu-open', open);
  menuButton.setAttribute('aria-expanded', String(open));
  document.body.style.overflow = open ? 'hidden' : '';
});

navigation.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') closeMenu();
});
window.addEventListener('resize', () => {
  if (window.innerWidth > 900) closeMenu();
});
window.addEventListener('scroll', updateHeader, { passive: true });
updateHeader();

document.documentElement.classList.add('js-ready');

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -30px' }
);

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
document.querySelector('#year').textContent = new Date().getFullYear();

// Motion is visible only when its research card is on screen.
const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
const motionToggle = document.querySelector('.motion-toggle');
const demos = [...document.querySelectorAll('[data-demo]')].map(element => ({
  element, buttons: [...element.querySelectorAll('[data-step]')],
  phase: 0, nextAt: 0, card: element.closest('.research-card')
}));
let motionPaused = false;
let demoTimer;
const visibleCards = new Set();

function setPhase(demo, value) {
  demo.phase = value;
  demo.element.dataset.phase = String(value);
  demo.element.querySelectorAll('[data-panel]').forEach(panel => {
    panel.setAttribute('aria-hidden', String(Number(panel.dataset.panel) !== value));
  });
  if (demo.element.dataset.demo === 'sbi') {
    demo.element.querySelector('.reminder-message').setAttribute('aria-hidden', String(value !== 2));
    demo.element.querySelector('.grounding-message').setAttribute('aria-hidden', String(value === 2));
  }
  demo.buttons.forEach((button, index) => button.setAttribute('aria-pressed', String(index === value)));
}
function syncMotion() {
  const paused = motionPaused || motionPreference.matches || document.hidden;
  document.documentElement.classList.toggle('motion-paused', paused);
  motionToggle.setAttribute('aria-pressed', String(paused));
  motionToggle.disabled = motionPreference.matches;
  motionToggle.innerHTML = motionPreference.matches ? 'Reduced motion enabled' : paused ? 'Resume motion <span aria-hidden="true">▷</span>' : 'Pause motion <span aria-hidden="true">Ⅱ</span>';
  clearInterval(demoTimer);
  if (!paused && visibleCards.size) {
    demos.forEach(demo => { demo.nextAt = performance.now() + 4800; });
    demoTimer = setInterval(() => {
      demos.forEach(demo => {
        if (visibleCards.has(demo.card) && performance.now() >= demo.nextAt) {
          setPhase(demo, (demo.phase + 1) % demo.buttons.length);
          demo.nextAt = performance.now() + 4800;
        }
      });
    }, 250);
  }
}
const motionObserver = new IntersectionObserver(entries => {
  entries.forEach(({target, isIntersecting}) => {
    target.classList.toggle('animation-running', isIntersecting);
    if (isIntersecting) visibleCards.add(target); else visibleCards.delete(target);
  });
  syncMotion();
}, { threshold: .15 });
document.querySelectorAll('.research-card').forEach(card => motionObserver.observe(card));
motionToggle.addEventListener('click', () => { motionPaused = !motionPaused; syncMotion(); });
motionPreference.addEventListener('change', syncMotion);
document.addEventListener('visibilitychange', syncMotion);
demos.forEach(demo => {
  setPhase(demo, 0);
  demo.buttons.forEach(button => button.addEventListener('click', () => {
    setPhase(demo, Number(button.dataset.step));
    demo.nextAt = performance.now() + 8000;
  }));
});
syncMotion();

// A quiet position cue keeps the compact navigation oriented.
const sectionObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navigation.querySelectorAll('a').forEach(link => {
        const active = link.getAttribute('href') === '#' + entry.target.id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'location'); else link.removeAttribute('aria-current');
      });
    }
  });
}, { rootMargin: '-15% 0px -60% 0px', threshold: 0 });
document.querySelectorAll('main section[id]').forEach(section => sectionObserver.observe(section));
