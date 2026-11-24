/* Monochrome · motor de los casos (sin dependencias).
   Todo el contenido es visible sin JS; aquí solo se añade movimiento. */
(() => {
  const root = document.documentElement;
  root.classList.add('js');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const vh = () => innerHeight;
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

  /* 1 · Revelados: solo se arma lo que está por debajo del pliegue */
  const reveals = [...document.querySelectorAll('[data-reveal]')];
  if (!reduce && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    reveals.forEach((el, i) => {
      const r = el.getBoundingClientRect();
      if (r.top > vh() * 0.95) {
        el.classList.add('is-armed');
        const d = el.dataset.delay ? +el.dataset.delay : (el.dataset.stagger ? (i % 4) * 75 : 0);
        if (d) el.style.transitionDelay = d + 'ms';
        io.observe(el);
      }
    });
  }

  /* 2 · Disparadores únicos (animaciones CSS al entrar) */
  const plays = [...document.querySelectorAll('[data-play]')];
  if (reduce) plays.forEach((el) => el.classList.add('is-play', 'is-done'));
  else if ('IntersectionObserver' in window) {
    root.classList.add('can-play');
    const io2 = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('is-play'); io2.unobserve(e.target); } });
    }, { threshold: 0.35 });
    plays.forEach((el) => io2.observe(el));
  }

  /* 3 · Contadores */
  const fmt = (n, dec) => n.toLocaleString('es-ES', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  document.querySelectorAll('[data-count-to]').forEach((el) => {
    if (reduce || !('IntersectionObserver' in window)) return;
    const to = parseFloat(el.dataset.countTo), from = parseFloat(el.dataset.countFrom || 0);
    const dec = +(el.dataset.dec || 0), pre = el.dataset.pre || '', suf = el.dataset.suf || '';
    const io3 = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return; io3.disconnect();
      const t0 = performance.now(), dur = 1400;
      const step = (t) => {
        const k = clamp((t - t0) / dur), ease = 1 - Math.pow(1 - k, 4);
        el.textContent = pre + fmt(from + (to - from) * ease, dec) + suf;
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io3.observe(el);
  });

  /* 4 · Scroll: progreso (--p), parallax y galerías horizontales */
  const scrubs = [...document.querySelectorAll('[data-scrub]')];
  const paras = reduce ? [] : [...document.querySelectorAll('[data-parallax]')];
  const hs = reduce ? [] : [...document.querySelectorAll('.hscroll')];
  const desk = matchMedia('(min-width: 820px)');

  const sizeHs = () => hs.forEach((h) => {
    const track = h.querySelector('.hscroll__track');
    if (!desk.matches) { h.classList.remove('is-live'); track.style.removeProperty('--hs-x'); return; }
    h.classList.add('is-live');
    const extra = Math.max(0, track.scrollWidth - innerWidth + parseFloat(getComputedStyle(h).paddingLeft || 0) * 2);
    h.dataset.extra = extra;
    h.style.setProperty('--hs-h', (extra + vh()) + 'px');
  });

  const progress = (el, mode) => {
    const r = el.getBoundingClientRect(), H = vh();
    if (mode === 'pin') return clamp(-r.top / Math.max(1, r.height - H));
    if (mode === 'through') return clamp((H - r.top) / (r.height + H));
    if (mode === 'center') return clamp((H - r.top) / (H * 0.6 + r.height * 0.5));
    return clamp((H - r.top) / H); // enter
  };

  let ticking = false;
  const update = () => {
    ticking = false;
    if (!reduce) scrubs.forEach((el) => el.style.setProperty('--p', progress(el, el.dataset.scrub).toFixed(4)));
    paras.forEach((el) => {
      const k = parseFloat(el.dataset.parallax) || 0.1;
      const r = el.parentElement.getBoundingClientRect();
      const c = (r.top + r.height / 2 - vh() / 2) / vh();
      el.style.transform = `translate3d(0,${(-c * k * 100).toFixed(2)}%,0) scale(${(1 + k * 2).toFixed(3)})`;
    });
    hs.forEach((h) => {
      if (!h.classList.contains('is-live')) return;
      const p = progress(h, 'pin');
      h.querySelector('.hscroll__track').style.setProperty('--hs-x', (-p * (+h.dataset.extra || 0)).toFixed(1) + 'px');
    });
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  if (reduce) scrubs.forEach((el) => el.style.setProperty('--p', 1));
  sizeHs(); update();
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('resize', () => { sizeHs(); update(); });
  addEventListener('load', () => { sizeHs(); update(); });

  /* 5 · Antes / después */
  document.querySelectorAll('.compare').forEach((c) => {
    const input = c.querySelector('input');
    const set = () => c.style.setProperty('--pos', input.value + '%');
    input.addEventListener('input', set); set();
  });

  /* 6 · Índice de capítulos */
  const links = [...document.querySelectorAll('.chapters a')];
  if (links.length && 'IntersectionObserver' in window) {
    const map = new Map(links.map((a) => [a.getAttribute('href').slice(1), a]));
    const io4 = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        const a = map.get(e.target.id); if (a) a.setAttribute('aria-current', 'true');
        if (e.target.dataset.bar) root.dataset.bar = e.target.dataset.bar;
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    document.querySelectorAll('[data-chapter]').forEach((s) => io4.observe(s));
  }

  /* 7 · Copiar códigos de color */
  const toast = document.createElement('div');
  toast.className = 'toast'; toast.setAttribute('role', 'status'); (document.querySelector('.case') || document.body).appendChild(toast);
  let tt;
  document.querySelectorAll('[data-copy]').forEach((el) => {
    el.addEventListener('click', async () => {
      try { await navigator.clipboard.writeText(el.dataset.copy); toast.textContent = el.dataset.copy + ' copiado'; }
      catch { toast.textContent = el.dataset.copy; }
      toast.classList.add('is-on'); clearTimeout(tt); tt = setTimeout(() => toast.classList.remove('is-on'), 1600);
    });
  });
})();

/* Web Monochrome: el índice de capítulos solo se ve con el caso ocupando la pantalla */
(() => {
  const c = document.querySelector('.case'), root = document.documentElement;
  if (!c) return;
  let raf = 0;
  const check = () => { raf = 0; const r = c.getBoundingClientRect(), H = innerHeight;
    root.classList.toggle('in-case', r.top < H * 0.5 && r.bottom > H * 0.75); };
  const on = () => { if (!raf) raf = requestAnimationFrame(check); };
  addEventListener('scroll', on, { passive: true }); addEventListener('resize', on); check();
})();
