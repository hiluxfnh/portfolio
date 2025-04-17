// certificates.js

// Filter functionality
const filterBtns = document.querySelectorAll('.filter-btn');
const cards = document.querySelectorAll('.cert-card');
const searchInput = document.getElementById('certSearch');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelector('.filter-btn.active').classList.remove('active');
    btn.classList.add('active');
    filterCards(btn.dataset.filter);
  });
});

searchInput.addEventListener('input', () => {
  const term = searchInput.value.trim().toLowerCase();
  cards.forEach(card => {
    const title = card.dataset.title.toLowerCase();
    card.style.display = title.includes(term) ? '' : 'none';
  });
});

function filterCards(category) {
  cards.forEach(card => {
    card.style.display = (category === 'all' || card.dataset.category === category)
      ? '' : 'none';
  });
}

// Modal functionality
const modal = document.getElementById('certModal');
const modalBody = modal.querySelector('.modal-body');
const modalClose = modal.querySelector('.modal-close');

cards.forEach(card => {
  card.querySelector('.view-btn').addEventListener('click', () => {
    const src = card.querySelector('.card-data').dataset.src;
    // Determine if PDF or image
    if (src.endsWith('.pdf')) {
      modalBody.innerHTML = `<object data="${src}" type="application/pdf"></object>`;
    } else {
      modalBody.innerHTML = `<img src="${src}" alt="Certificate" style="width:100%;">`;
    }
    modal.style.display = 'flex';
  });
});

modalClose.addEventListener('click', () => modal.style.display = 'none');
modal.addEventListener('click', e => {
  if (e.target === modal) modal.style.display = 'none';
});
