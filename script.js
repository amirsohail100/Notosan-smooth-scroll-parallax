(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // seeded random so the art is identical every load
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mk = (tag, attrs, parent) => {
    const e = document.createElementNS(NS, tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    parent && parent.appendChild(e);
    return e;
  };

  /* ---------- procedural art ---------- */
  function grass(g, n, y0, colors, hMin, hMax) {
    for (let i = 0; i < n; i++) {
      const x = rnd() * 1700 - 50, h = hMin + rnd() * (hMax - hMin), b = (rnd() - .5) * 40;
      mk('path', { d: `M${x} ${y0}Q${x + b * .4} ${y0 - h * .6} ${x + b} ${y0 - h}Q${x + b * .5 + 8} ${y0 - h * .5} ${x + 9} ${y0}z`,
        fill: colors[i % colors.length], class: 'sway', style: `animation-delay:${-rnd() * 4}s` }, g);
    }
  }
  function cloud(parent, cx, cy, s) {
    const g = mk('g', {}, parent);
    [[0, 0, 120, 34], [-70, 12, 80, 24], [80, 10, 90, 26], [10, -18, 70, 24]].forEach(([dx, dy, rx, ry]) =>
      mk('ellipse', { cx: cx + dx * s, cy: cy + dy * s, rx: rx * s, ry: ry * s, fill: '#fff0f4', opacity: .82 }, g));
    return g;
  }
  function birds(svg, n, x0, y0, spread, color) {
    const flock = mk('g', { class: 'flock' }, svg);
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * spread, y = y0 + rnd() * spread * .35, s = .6 + rnd() * .9;
      mk('path', { d: 'M-9 0Q-4 -7 0 0Q4 -7 9 0Q4 -3 0 3Q-4 -3 -9 0z', fill: color, class: 'bird',
        transform: `translate(${x} ${y}) scale(${s})`, style: `animation-delay:${-rnd()}s` }, flock);
    }
  }
  function plants(g, n, x0, x1, base, flowers) {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), h = 90 + rnd() * 190;
      const col = ['#2c8f8f', '#3aa39a', '#1f6f86', '#4a62c9'][i % 4];
      const leaf = mk('g', { class: 'sway', style: `animation-delay:${-rnd() * 4}s` }, g);
      mk('path', { d: `M${x} ${base}Q${x - 20} ${base - h * .6} ${x + 14} ${base - h}Q${x + 22} ${base - h * .45} ${x + 12} ${base}z`, fill: col }, leaf);
      if (flowers && i % 3 === 0) mk('circle', { cx: x + 14, cy: base - h, r: 9 + rnd() * 6, fill: ['#ff8fb4', '#b79cff', '#ffd27a'][i % 3] }, leaf);
    }
  }

  // hero
  const clouds0 = $('#clouds0');
  cloud(mk('g', {}, clouds0), 360, 300, 1.1);
  cloud(mk('g', {}, clouds0), 1080, 250, 1.4);
  cloud(clouds0.lastChild, 1380, 420, .9);
  cloud(clouds0.firstChild, 820, 470, 1.2);
  birds($('#birds0'), 16, 700, 200, 600, '#fff');
  birds($('#birds1'), 10, 300, 140, 500, '#fff');
  grass($('#grass0'), 90, 900, ['#1f1d72', '#262a8a', '#171560'], 90, 220);
  grass($('#grass0b'), 70, 900, ['#0f0e45', '#15135a'], 120, 260);
  // waterfall streaks
  const st = $('#streaks');
  for (let i = 0; i < 26; i++) {
    const x = 372 + i * 13.5 + rnd() * 6;
    mk('path', { d: `M${x} 230V900`, 'stroke-width': 2 + rnd() * 4, opacity: .25 + rnd() * .5, class: 'streak',
      style: `animation-delay:${-rnd() * 1.6}s;animation-duration:${1.2 + rnd()}s` }, st);
  }
  plants($('#plants1'), 26, 760, 1560, 900, true);
  plants($('#plants2'), 34, 0, 1600, 900, true);
  // fireflies
  const fl = $('#flies');
  for (let i = 0; i < 36; i++)
    mk('circle', { cx: rnd() * 1600, cy: 150 + rnd() * 650, r: 1.5 + rnd() * 2.5, fill: '#ffe9a8', opacity: .85, class: 'fly',
      style: `animation-delay:${-rnd() * 6}s;animation-duration:${4 + rnd() * 5}s` }, fl);

  /* ---------- smooth scroll engine ---------- */
  const track = $('.track'), scenes = $$('.scene'), dots = $$('.dots button');
  const last = scenes.length - 1;
  let max = 1, target = 0, cur = 0, mx = 0, my = 0, cmx = 0, cmy = 0;

  const measure = () => { max = track.offsetHeight - innerHeight; };
  const onScroll = () => { target = clamp(scrollY / max) * last; };
  addEventListener('resize', () => { measure(); onScroll(); });
  addEventListener('scroll', onScroll, { passive: true });
  addEventListener('pointermove', e => { mx = e.clientX / innerWidth - .5; my = e.clientY / innerHeight - .5; });

  const layers = scenes.map(s => $$('.layer', s).map(el => ({ el, d: +el.dataset.d })));
  const copies = scenes.map(s => { const c = $('.copy', s); return { c, kids: $$('[data-i]', c) }; });

  function render() {
    scenes.forEach((s, i) => {
      const l = cur - i, a = Math.abs(l);
      const op = clamp(1.7 - a * 2.6);
      s.style.opacity = op;
      s.style.visibility = op < .01 ? 'hidden' : 'visible';
      s.style.pointerEvents = a < .4 ? 'auto' : 'none';
      if (op < .01) return;
      layers[i].forEach(({ el, d }) => {
        const y = -l * d * 18 + cmy * d * 22;            // vh-ish parallax
        const x = cmx * d * -40;
        const sc = 1 + a * d * .14;                       // depth zoom
        el.style.transform = `translate3d(${x}px,${y}vh,0) scale(${sc})`;
      });
      const { c, kids } = copies[i];
      c.style.opacity = clamp(1.5 - a * 3);
      kids.forEach(k => {
        const i2 = +k.dataset.i;
        k.style.transform = `translate3d(0,${-l * (90 + i2 * 55)}px,0)`;
        k.style.filter = a > .05 ? `blur(${Math.min(a * 10, 8)}px)` : 'none';
      });
    });
    const idx = Math.round(cur);
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    $('.hint').style.opacity = clamp(1 - cur * 4);
  }

  (function loop() {
    const k = reduce ? 1 : .075;
    cur += (target - cur) * k;
    cmx += (mx - cmx) * .06; cmy += (my - cmy) * .06;
    if (Math.abs(target - cur) < .0004) cur = target;
    render();
    requestAnimationFrame(loop);
  })();

  /* ---------- navigation ---------- */
  $$('[data-go]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    const i = +el.dataset.go;
    scrollTo({ top: (i / last) * max, behavior: reduce ? 'auto' : 'smooth' });
  }));

  measure(); onScroll(); cur = target;
})();
