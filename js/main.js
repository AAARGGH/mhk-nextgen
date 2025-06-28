// Förderfelder Popup
document.querySelectorAll('.field-card').forEach(card => {
  card.addEventListener('click', () => {
    document.getElementById('field-modal-title').textContent = card.getAttribute('data-title');
    document.getElementById('field-modal-desc').textContent = card.getAttribute('data-desc');
    document.getElementById('field-modal-icon').innerHTML = card.getAttribute('data-icon');
    document.getElementById('field-modal-bg').classList.add('active');
  });
});
document.getElementById('field-modal-close').onclick = function() {
  document.getElementById('field-modal-bg').classList.remove('active');
};
document.getElementById('field-modal-bg').onclick = function(e) {
  if (e.target === this) this.classList.remove('active');
};

// Team/Beirat Popup
function showMember(card) {
  document.getElementById('member-modal-name').textContent = card.getAttribute('data-name');
  document.getElementById('member-modal-role').textContent = card.getAttribute('data-role');
  document.getElementById('member-modal-bio').textContent = card.getAttribute('data-bio');
  document.getElementById('member-modal-img').src = card.getAttribute('data-img');
  document.getElementById('member-modal-img').alt = card.getAttribute('data-name');
  document.getElementById('member-modal-bg').classList.add('active');
}
document.querySelectorAll('.team-card, .beirat-card').forEach(card => {
  card.addEventListener('click', () => showMember(card));
});
document.getElementById('member-modal-close').onclick = function() {
  document.getElementById('member-modal-bg').classList.remove('active');
};
document.getElementById('member-modal-bg').onclick = function(e) {
  if (e.target === this) this.classList.remove('active');
};

// Projekte Popup
document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => {
    document.getElementById('project-modal-title').textContent = card.getAttribute('data-title');
    document.getElementById('project-modal-desc').innerHTML = card.getAttribute('data-desc');
    const img = document.getElementById('project-modal-img');
    img.src = card.getAttribute('data-img');
    img.alt = card.getAttribute('data-title');
    document.getElementById('project-modal-bg').classList.add('active');
  });
});
document.getElementById('project-modal-close').onclick = function() {
  document.getElementById('project-modal-bg').classList.remove('active');
};
document.getElementById('project-modal-bg').onclick = function(e) {
  if (e.target === this) this.classList.remove('active');
};

// Mobile Navigation Toggle
const nav = document.querySelector('nav');
const navToggle = document.getElementById('nav-toggle');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', nav.classList.contains('open'));
});

document.querySelectorAll('nav ul a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

// Show scroll hints only when lists overflow
function updateScrollHints() {
  document.querySelectorAll('.team-section, .beirat-section').forEach(section => {
    const list = section.querySelector('.team-list, .beirat-list');
    const hint = section.querySelector('.scroll-hint');
    if (!list || !hint) return;
    if (list.scrollWidth > list.clientWidth) {
      hint.style.display = '';
    } else {
      hint.style.display = 'none';
    }
  });
}

window.addEventListener('load', updateScrollHints);
window.addEventListener('resize', updateScrollHints);
