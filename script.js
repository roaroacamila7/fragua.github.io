// FRAGUA — scroll reveal + micro-interacciones

document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });

    cards.forEach((card) => observer.observe(card));
  } else {
    cards.forEach((card) => card.classList.add('in-view'));
  }
});
