const at = String.fromCharCode(64);
const domainParts = ['mhk', '-nextgeneration', '.de'];

function applyEmailLinks(root = document) {
  root.querySelectorAll('a.email').forEach(el => {
    const user = el.getAttribute('data-user');
    if (!user) return;
    const email = `${user}${at}${domainParts.join('')}`;
    let href = `mailto:${email}`;
    const subject = el.getAttribute('data-subject');
    if (subject) {
      href += `?subject=${encodeURIComponent(subject)}`;
    }
    el.setAttribute('href', href);
    if (el.classList.contains('show-email')) {
      el.textContent = email;
    }
  });
}

// Förderfelder Popup
document.querySelectorAll('.field-card').forEach(card => {
  card.addEventListener('click', () => {
    document.getElementById('field-modal-title').textContent = card.getAttribute('data-title');
    document.getElementById('field-modal-desc').textContent = card.getAttribute('data-desc');
    document.getElementById('field-modal-icon').innerHTML = card.getAttribute('data-icon');
    document.getElementById('field-modal-bg').classList.add('active');
  });
});
const fieldModalClose = document.getElementById('field-modal-close');
const fieldModalBg = document.getElementById('field-modal-bg');
if (fieldModalClose && fieldModalBg) {
  fieldModalClose.onclick = function() {
    fieldModalBg.classList.remove('active');
  };
  fieldModalBg.onclick = function(e) {
    if (e.target === fieldModalBg) fieldModalBg.classList.remove('active');
  };
}

// Team/Beirat Popup
function showMember(card) {
  document.getElementById('member-modal-name').textContent = card.getAttribute('data-name');
  const emailContainer = document.getElementById('member-modal-email');
  const user = card.getAttribute('data-user');
  if (user) {
    emailContainer.innerHTML = `<a class="email show-email" data-user="${user}"></a>`;
    applyEmailLinks(emailContainer);
    emailContainer.style.display = '';
  } else {
    emailContainer.style.display = 'none';
  }
  document.getElementById('member-modal-role').textContent = card.getAttribute('data-role');
  document.getElementById('member-modal-bio').textContent = card.getAttribute('data-bio');
  document.getElementById('member-modal-img').src = card.getAttribute('data-img');
  document.getElementById('member-modal-img').alt = card.getAttribute('data-name');
  document.getElementById('member-modal-bg').classList.add('active');
}
document.querySelectorAll('.team-card, .beirat-card').forEach(card => {
  card.addEventListener('click', () => showMember(card));
});
const memberModalClose = document.getElementById('member-modal-close');
const memberModalBg = document.getElementById('member-modal-bg');
if (memberModalClose && memberModalBg) {
  memberModalClose.onclick = function() {
    memberModalBg.classList.remove('active');
  };
  memberModalBg.onclick = function(e) {
    if (e.target === memberModalBg) memberModalBg.classList.remove('active');
  };
}

const projectModalTitle = document.getElementById('project-modal-title');
const projectModalDesc = document.getElementById('project-modal-desc');
const projectModalImg = document.getElementById('project-modal-img');
const projectCarousel = document.getElementById('project-carousel');
const projectCarouselPrev = document.getElementById('project-carousel-prev');
const projectCarouselNext = document.getElementById('project-carousel-next');
const projectModalClose = document.getElementById('project-modal-close');
const projectModalBg = document.getElementById('project-modal-bg');
const projectModalState = {
  images: [],
  currentIndex: 0,
  intervalId: null
};

const parseProjectImages = (card) => {
  const imagesAttr = card.getAttribute('data-images');
  if (imagesAttr) {
    return imagesAttr.split('|').map(item => item.trim()).filter(Boolean);
  }
  const fallback = card.getAttribute('data-img');
  return fallback ? [fallback] : [];
};

const updateProjectCarousel = (index) => {
  if (!projectModalImg || !projectModalState.images.length) return;
  const total = projectModalState.images.length;
  const nextIndex = ((index % total) + total) % total;
  projectModalState.currentIndex = nextIndex;
  projectModalImg.src = projectModalState.images[nextIndex];
  const title = projectModalTitle ? projectModalTitle.textContent : 'Projekt';
  projectModalImg.alt = `${title} (${nextIndex + 1}/${total})`;
};

const stopProjectCarousel = () => {
  if (projectModalState.intervalId) {
    clearInterval(projectModalState.intervalId);
    projectModalState.intervalId = null;
  }
};

const startProjectCarousel = () => {
  stopProjectCarousel();
  if (projectModalState.images.length > 1) {
    projectModalState.intervalId = setInterval(() => {
      updateProjectCarousel(projectModalState.currentIndex + 1);
    }, 5000);
  }
};

const closeProjectModal = () => {
  stopProjectCarousel();
  if (projectModalBg) {
    projectModalBg.classList.remove('active');
  }
};

if (projectCarouselPrev) {
  projectCarouselPrev.addEventListener('click', () => {
    updateProjectCarousel(projectModalState.currentIndex - 1);
    startProjectCarousel();
  });
}

if (projectCarouselNext) {
  projectCarouselNext.addEventListener('click', () => {
    updateProjectCarousel(projectModalState.currentIndex + 1);
    startProjectCarousel();
  });
}

if (projectCarousel) {
  let startX = 0;
  let isPointerDown = false;
  projectCarousel.addEventListener('pointerdown', (event) => {
    if (event.target.closest('.carousel-btn')) return;
    isPointerDown = true;
    startX = event.clientX;
  });
  projectCarousel.addEventListener('pointerup', (event) => {
    if (!isPointerDown) return;
    const deltaX = event.clientX - startX;
    if (Math.abs(deltaX) > 40) {
      if (deltaX < 0) {
        updateProjectCarousel(projectModalState.currentIndex + 1);
      } else {
        updateProjectCarousel(projectModalState.currentIndex - 1);
      }
      startProjectCarousel();
    }
    isPointerDown = false;
  });
  projectCarousel.addEventListener('pointercancel', () => {
    isPointerDown = false;
  });
}

document.querySelectorAll('.project-card').forEach(card => {
  card.addEventListener('click', () => {
    if (projectModalTitle) {
      projectModalTitle.textContent = card.getAttribute('data-title');
    }
    if (projectModalDesc) {
      projectModalDesc.innerHTML = card.getAttribute('data-desc');
    }
    projectModalState.images = parseProjectImages(card);
    projectModalState.currentIndex = 0;
    if (projectCarousel) {
      projectCarousel.classList.toggle('single', projectModalState.images.length <= 1);
    }
    updateProjectCarousel(0);
    if (projectModalBg) {
      projectModalBg.classList.add('active');
    }
    startProjectCarousel();
  });
});

if (projectModalClose && projectModalBg) {
  projectModalClose.onclick = closeProjectModal;
  projectModalBg.onclick = function(e) {
    if (e.target === projectModalBg) closeProjectModal();
  };
}

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

// Wiggle cards when their section enters view on mobile
if (window.matchMedia('(max-width: 570px)').matches) {
  const addWiggleOnView = (sectionSelector, cardSelector) => {
    const section = document.querySelector(sectionSelector);
    if (!section) return;
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          section.querySelectorAll(cardSelector).forEach(card => {
            card.classList.add('wiggle');
            card.addEventListener('animationend', () => card.classList.remove('wiggle'), { once: true });
          });
        }
      });
    }, { threshold: 0.3 });
    observer.observe(section);
  };
  addWiggleOnView('.team-section', '.team-card');
  addWiggleOnView('.beirat-section', '.beirat-card');
}

// set up email links
applyEmailLinks();
