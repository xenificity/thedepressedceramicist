(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(pointer: fine)').matches;

  $('#year').textContent = new Date().getFullYear();

  /* ---------- Open now badge + today's hours (studio is in Central time) ---------- */
  const HOURS = { 5: [12, 18], 6: [12, 18], 0: [13, 17] }; // day -> [open, close], 24h
  const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const fmt = h => (h % 12 || 12) + (h < 12 ? ' am' : ' pm');
  function chicagoNow() {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Chicago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false
    }).formatToParts(new Date());
    const get = t => parts.find(p => p.type === t).value;
    return { day: DAY_NAMES.indexOf(get('weekday')), hour: (+get('hour') % 24) + get('minute') / 60 };
  }
  function updateOpen() {
    const { day, hour } = chicagoNow();
    const badge = $('#openBadge'), text = $('.open-text', badge);
    const today = HOURS[day];
    if (today && hour >= today[0] && hour < today[1]) {
      badge.classList.add('is-open');
      text.textContent = `Open now · until ${fmt(today[1])}`;
    } else {
      badge.classList.remove('is-open');
      if (today && hour < today[0]) {
        text.textContent = `Opens today at ${fmt(today[0])}`;
      } else {
        let d = day;
        for (let i = 1; i <= 7; i++) { d = (day + i) % 7; if (HOURS[d]) break; }
        const label = d === (day + 1) % 7 ? 'tomorrow' : ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][d];
        text.textContent = `Closed now · opens ${label} at ${fmt(HOURS[d][0])}`;
      }
    }
    $$('#hours li').forEach(li => li.classList.toggle('today', li.dataset.days.split(',').includes(String(day))));
  }
  updateOpen();
  setInterval(updateOpen, 60_000);

  /* ---------- Rain canvas ---------- */
  const canvas = $('#rain');
  if (canvas && !reduceMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, drops = [], running = true;
    const resize = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      w = canvas.offsetWidth; h = canvas.offsetHeight;
      canvas.width = w * dpr; canvas.height = h * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const count = Math.round(w * h / 9000);
      drops = Array.from({ length: count }, () => newDrop(true));
    };
    const newDrop = (anywhere) => ({
      x: Math.random() * (w + 200) - 100, y: anywhere ? Math.random() * h : -20,
      len: 10 + Math.random() * 22, speed: 5 + Math.random() * 9, a: .15 + Math.random() * .45
    });
    let wind = -1.6, targetWind = -1.6;
    window.addEventListener('pointermove', e => { targetWind = -1.6 + (e.clientX / innerWidth - .5) * 3; }, { passive: true });
    const tick = () => {
      if (!running) return;
      wind += (targetWind - wind) * .03;
      ctx.clearRect(0, 0, w, h);
      ctx.lineCap = 'round';
      for (const d of drops) {
        ctx.strokeStyle = `rgba(169,195,214,${d.a})`;
        ctx.lineWidth = 1.2;
        ctx.beginPath(); ctx.moveTo(d.x, d.y); ctx.lineTo(d.x + wind * d.len / 6, d.y + d.len); ctx.stroke();
        d.y += d.speed; d.x += wind * d.speed / 6;
        if (d.y > h) Object.assign(d, newDrop(false));
      }
      requestAnimationFrame(tick);
    };
    resize();
    addEventListener('resize', resize);
    new IntersectionObserver(([e]) => { const was = running; running = e.isIntersecting; if (running && !was) tick(); }).observe(canvas);
    tick();
  }

  /* ---------- Nav: solid on scroll, hide on scroll down ---------- */
  const nav = $('#nav');
  let lastY = 0;
  const onScroll = () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hidden', y > innerHeight * .8 && y > lastY && !menuOpen);
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });

  /* ---------- Mobile menu ---------- */
  const menuBtn = $('#menuBtn'), links = $('#navLinks');
  let menuOpen = false;
  const setMenu = open => {
    menuOpen = open;
    links.classList.toggle('open', open);
    menuBtn.setAttribute('aria-expanded', open);
    menuBtn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.style.overflow = open ? 'hidden' : '';
    if (window.__lenis) open ? window.__lenis.stop() : window.__lenis.start();
  };
  menuBtn.addEventListener('click', () => setMenu(!menuOpen));
  $$('a', links).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => { if (e.key === 'Escape' && menuOpen) setMenu(false); });

  /* ---------- FAQ: smooth open/close ---------- */
  $$('.faq details').forEach(d => {
    const summary = $('summary', d), body = $('.faq-body', d);
    summary.addEventListener('click', e => {
      if (reduceMotion) return;
      e.preventDefault();
      if (d.open) {
        body.animate([{ height: body.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 320, easing: 'ease' })
          .onfinish = () => { d.open = false; };
      } else {
        d.open = true;
        body.animate([{ height: '0px', opacity: 0 }, { height: body.offsetHeight + 'px', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.2,.8,.2,1)' });
      }
    });
  });

  /* ---------- Lightbox ---------- */
  const lb = $('#lightbox'), lbImg = $('img', lb), lbCap = $('figcaption', lb);
  const items = $$('#gallery .g-item');
  let idx = 0, lastFocus;
  const show = i => {
    idx = (i + items.length) % items.length;
    const it = items[idx];
    lbImg.src = it.getAttribute('href'); lbImg.alt = $('img', it).alt; lbCap.textContent = it.dataset.caption;
    if (!reduceMotion) lbImg.animate([{ opacity: 0, transform: 'scale(.96)' }, { opacity: 1, transform: 'none' }], { duration: 350, easing: 'ease-out' });
  };
  const openLb = i => { lastFocus = document.activeElement; lb.hidden = false; show(i); $('.lb-close', lb).focus(); window.__lenis?.stop(); document.body.style.overflow = 'hidden'; };
  const closeLb = () => { lb.hidden = true; window.__lenis?.start(); document.body.style.overflow = ''; lastFocus?.focus(); };
  items.forEach((it, i) => it.addEventListener('click', e => { e.preventDefault(); openLb(i); }));
  $('.lb-close', lb).addEventListener('click', closeLb);
  $('.lb-prev', lb).addEventListener('click', () => show(idx - 1));
  $('.lb-next', lb).addEventListener('click', () => show(idx + 1));
  lb.addEventListener('click', e => { if (e.target === lb) closeLb(); });
  addEventListener('keydown', e => {
    if (lb.hidden) return;
    if (e.key === 'Escape') closeLb();
    if (e.key === 'ArrowLeft') show(idx - 1);
    if (e.key === 'ArrowRight') show(idx + 1);
  });
  let touchX = null;
  lb.addEventListener('touchstart', e => { touchX = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', e => {
    if (touchX === null) return;
    const dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
    touchX = null;
  });

  /* ---------- Animations (only when GSAP loaded and motion allowed) ---------- */
  if (reduceMotion || !window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  document.documentElement.classList.add('anim');

  // Smooth scrolling
  if (window.Lenis) {
    const lenis = new Lenis({ duration: 1.15, easing: t => 1 - Math.pow(1 - t, 4), smoothWheel: true });
    window.__lenis = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    $$('a[href^="#"]').forEach(a => a.addEventListener('click', e => {
      const target = a.getAttribute('href');
      if (target.length < 2 || !$(target)) return;
      e.preventDefault();
      lenis.scrollTo(target, { offset: -70 });
    }));
  }

  // Hero intro
  const intro = gsap.timeline({ defaults: { ease: 'power4.out' } });
  intro
    .from('.hero-title .line > span', { yPercent: 110, duration: 1.1, stagger: .12 })
    .from('[data-hero]:not(.hero-title)', { y: 24, opacity: 0, duration: .9, stagger: .1 }, '-=.8')
    .from('.float-card', { y: 80, opacity: 0, scale: .9, duration: 1.2, stagger: .12, ease: 'expo.out' }, '-=1.1')
    .from('.spin-badge, .scribble', { scale: 0, opacity: 0, duration: .9, stagger: .1, ease: 'back.out(1.7)' }, '-=.7');

  // Hero cards: gentle bob + follow the mouse
  $$('.float-card').forEach((c, i) => gsap.to(c, { y: '+=14', duration: 2.6 + i * .4, yoyo: true, repeat: -1, ease: 'sine.inOut', delay: 1.5 }));
  const art = $('#heroArt');
  if (finePointer && art) {
    const layers = $$('[data-depth]', art).map(el => ({ el, d: +el.dataset.depth, x: gsap.quickTo(el, 'x', { duration: .9, ease: 'power3' }), y: gsap.quickTo(el, 'yPercent', { duration: .9, ease: 'power3' }) }));
    addEventListener('pointermove', e => {
      const nx = e.clientX / innerWidth - .5, ny = e.clientY / innerHeight - .5;
      layers.forEach(l => { l.x(nx * 30 * l.d); l.y(ny * 6 * l.d); });
    }, { passive: true });
  }
  // Hero drifts up as you scroll away
  gsap.to('.hero-grid', { yPercent: 12, opacity: .3, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });

  // Marquee speeds with scroll velocity
  const track = $('.marquee-track');
  if (track) {
    ScrollTrigger.create({
      onUpdate: self => {
        const v = Math.min(Math.abs(self.getVelocity()) / 1000, 4);
        track.style.animationDuration = (32 / (1 + v)) + 's';
      }
    });
  }

  // Reveal on scroll
  ScrollTrigger.batch('[data-reveal]:not([data-reveal="img"])', {
    start: 'top 88%', once: true,
    onEnter: els => gsap.fromTo(els, { y: 40, opacity: 0 }, { y: 0, opacity: 1, duration: 1, ease: 'power3.out', stagger: .08, overwrite: true })
  });
  ScrollTrigger.batch('[data-reveal="img"]', {
    start: 'top 90%', once: true,
    onEnter: els => gsap.fromTo(els,
      { opacity: 0, clipPath: 'inset(18% 10% 18% 10% round 22px)', scale: 1.04 },
      { opacity: 1, clipPath: 'inset(0% 0% 0% 0% round 22px)', scale: 1, duration: 1.3, ease: 'expo.out', stagger: .1, clearProps: 'clipPath,transform' })
  });

  // Parallax images
  $$('[data-parallax]').forEach(img => {
    gsap.fromTo(img, { yPercent: -(+img.dataset.parallax) }, {
      yPercent: +img.dataset.parallax, ease: 'none',
      scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true }
    });
  });

  // Count-up stats
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, start = el.hasAttribute('data-plain') ? end - 40 : 0, obj = { v: start };
    el.textContent = start;
    ScrollTrigger.create({
      trigger: el, start: 'top 90%', once: true,
      onEnter: () => gsap.to(obj, { v: end, duration: 1.8, ease: 'power2.out', onUpdate: () => { el.textContent = Math.round(obj.v); } })
    });
  });

  // India portrait slow zoom
  gsap.fromTo('.india-photo img', { scale: 1.15 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: '.india', start: 'top bottom', end: 'bottom top', scrub: true } });

  // Party headline word pop
  gsap.from('.party-tags span', { y: 20, opacity: 0, scale: .9, stagger: .07, duration: .6, ease: 'back.out(2)', scrollTrigger: { trigger: '.party-tags', start: 'top 88%' } });

  // Magnetic buttons + tilt cards (mouse only)
  if (finePointer) {
    $$('.magnetic').forEach(btn => {
      const x = gsap.quickTo(btn, 'x', { duration: .5, ease: 'power3' }), y = gsap.quickTo(btn, 'y', { duration: .5, ease: 'power3' });
      btn.addEventListener('pointermove', e => {
        const r = btn.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * .25); y((e.clientY - r.top - r.height / 2) * .35);
      });
      btn.addEventListener('pointerleave', () => { x(0); y(0); });
    });
    $$('.tilt').forEach(card => {
      card.addEventListener('pointermove', e => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        gsap.to(card, { rotateY: px * 10, rotateX: -py * 10, y: -6, transformPerspective: 800, duration: .5, ease: 'power3.out' });
      });
      card.addEventListener('pointerleave', () => gsap.to(card, { rotateY: 0, rotateX: 0, y: 0, duration: .7, ease: 'elastic.out(1, .5)' }));
    });
  }

  addEventListener('load', () => ScrollTrigger.refresh());
})();
