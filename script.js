// FRAGUA — scroll reveal, profundidad 3D y micro-interacciones

document.addEventListener('DOMContentLoaded', () => {
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canHover = window.matchMedia('(pointer: fine)').matches;

  setupStagger();
  setupPanelReveal();
  setupSvgDraw(reduceMotion);
  setupMetricCountUp(reduceMotion);
  if (!reduceMotion) {
    setupHeroParallax();
    if (canHover) setupTilt();
  }

  // ---------- Coreografía escalonada: asigna --stagger a los hijos de cada sección ----------
  function setupStagger() {
    const groups = [
      '.tagline-row', '.feature-tabs', '.two-col', '.metric-row',
      '.feature-list', '.process-row', '.projects-grid', '.contact-row'
    ];
    groups.forEach((sel) => {
      document.querySelectorAll(sel).forEach((group) => {
        Array.from(group.children).forEach((child, i) => {
          child.classList.add('reveal-item');
          child.style.setProperty('--stagger', i);
        });
      });
    });
    // Titulares y sub-bloques propios de cada panel, un paso antes de sus hijos.
    // (.hero-manifesto queda afuera: su transform lo maneja el parallax del hero.)
    document.querySelectorAll(
      '.eyebrow, .feature-heading, .callout-card, .cta-sub, .pill'
    ).forEach((el) => {
      if (!el.classList.contains('reveal-item')) {
        el.classList.add('reveal-item');
      }
    });
  }

  // ---------- Entrada 3D por sección ----------
  function setupPanelReveal() {
    const panels = document.querySelectorAll('.panel');
    if (!('IntersectionObserver' in window)) {
      panels.forEach((p) => p.classList.add('in-view'));
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -60px 0px' });
    panels.forEach((panel) => observer.observe(panel));
  }

  // ---------- Planos que se dibujan solos (stroke-dasharray) ----------
  function setupSvgDraw(reduceMotion) {
    const groups = document.querySelectorAll('.hero-art svg g[stroke], .feature-image svg g[stroke], .project-card svg g[stroke]');

    groups.forEach((g) => {
      const lines = g.querySelectorAll('polyline, line, path');
      lines.forEach((line, i) => {
        if (typeof line.getTotalLength !== 'function') return;
        const length = line.getTotalLength();
        if (reduceMotion) return;
        line.style.strokeDasharray = length;
        line.style.strokeDashoffset = length;
        line.style.transition = `stroke-dashoffset 1.1s var(--ease-out) ${i * 90}ms`;
      });
    });

    const draw = (g) => {
      g.querySelectorAll('polyline, line, path').forEach((line) => {
        line.style.strokeDashoffset = 0;
      });
    };

    const heroArtGroup = document.querySelector('.hero-art svg g[stroke]');
    if (heroArtGroup) {
      // El hero ya está en pantalla al cargar: se dibuja solo, con una breve demora de entrada.
      setTimeout(() => draw(heroArtGroup), reduceMotion ? 0 : 350);
    }

    const rest = document.querySelectorAll('.feature-image svg g[stroke], .project-card svg g[stroke]');
    if (!('IntersectionObserver' in window)) {
      rest.forEach(draw);
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          draw(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.3 });
    rest.forEach((g) => observer.observe(g));
  }

  // ---------- Conteo animado de métricas ----------
  function setupMetricCountUp(reduceMotion) {
    const nums = document.querySelectorAll('.metric-number');
    if (reduceMotion || !('IntersectionObserver' in window)) return;

    const parse = (raw) => {
      const match = raw.match(/(\d+)/);
      if (!match) return null;
      return {
        value: parseInt(match[1], 10),
        prefix: raw.slice(0, match.index),
        suffix: raw.slice(match.index + match[1].length)
      };
    };

    const animate = (el) => {
      const parsed = parse(el.textContent.trim());
      if (!parsed || parsed.value === 0) return;
      const duration = 1100;
      const start = performance.now();
      const ease = (t) => 1 - Math.pow(1 - t, 3);
      function frame(now) {
        const t = Math.min(1, (now - start) / duration);
        const current = Math.round(parsed.value * ease(t));
        el.textContent = `${parsed.prefix}${current}${parsed.suffix}`;
        if (t < 1) requestAnimationFrame(frame);
        else el.textContent = `${parsed.prefix}${parsed.value}${parsed.suffix}`;
      }
      requestAnimationFrame(frame);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          animate(entry.target);
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.6 });
    nums.forEach((el) => observer.observe(el));
  }

  // ---------- Parallax y profundidad 3D en el hero ----------
  function setupHeroParallax() {
    const hero = document.querySelector('.hero');
    const art = document.querySelector('.hero-art');
    const masthead = document.querySelector('.masthead');
    const tagline = document.querySelector('.tagline-row');
    const manifesto = document.querySelector('.hero-manifesto');
    if (!hero) return;

    let ticking = false;

    function update() {
      ticking = false;
      const heroHeight = hero.offsetHeight || window.innerHeight;
      const progress = Math.min(1, Math.max(0, window.scrollY / heroHeight));

      if (tagline) tagline.style.transform = `translateY(${progress * -16}px)`;
      if (masthead) masthead.style.transform = `translateY(${progress * -46}px)`;
      if (art) {
        art.style.transform =
          `translateY(${progress * -70}px) rotateY(${progress * 8}deg) rotateX(${progress * -3}deg) scale(${1 - progress * 0.06})`;
      }
      if (manifesto) manifesto.style.transform = `translateY(${progress * -12}px)`;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  // ---------- Tilt 3D al mover el mouse sobre las tarjetas ----------
  function setupTilt() {
    const cards = document.querySelectorAll('.content-card, .project-card, .feature-card--translucent');
    cards.forEach((card) => {
      card.classList.add('tilt');

      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        card.style.setProperty('--rx', `${px * 10}deg`);
        card.style.setProperty('--ry', `${py * -10}deg`);
      });

      card.addEventListener('mouseleave', () => {
        card.style.setProperty('--rx', '0deg');
        card.style.setProperty('--ry', '0deg');
      });
    });
  }
});
