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
