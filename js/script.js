(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const NS = 'http://www.w3.org/2000/svg';
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  let seed = 11;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const mk = (tag, a, parent) => { const e = document.createElementNS(NS, tag); for (const k in a) e.setAttribute(k, a[k]); parent && parent.appendChild(e); return e; };
  const P  = (g, d, fill, o = 1, extra = {}) => mk('path', { d, fill, opacity: o, ...extra }, g);
  const G  = (g, a = {}) => mk('g', a, g);
  const grad = (svg, id, stops, vert = true) => {
    const d = mk('defs', {}, svg), lg = mk('linearGradient', { id, x1: 0, y1: 0, x2: vert ? 0 : 1, y2: vert ? 1 : 0 }, d);
    stops.forEach(([o, c, a = 1]) => mk('stop', { offset: o, 'stop-color': c, 'stop-opacity': a }, lg));
  };

  /* ---------- art helpers ---------- */
  // flat-bottomed grey/purple cloud banks
  function bank(svg, x, y, w, c1, c2, sc = 1) {
    const g = G(svg);
    for (let cx = x; cx < x + w; ) { const r = (26 + rnd() * 46) * sc; mk('circle', { cx, cy: y - r * .8, r, fill: c1 }, g); cx += r * .85; }
    mk('ellipse', { cx: x + w / 2, cy: y - 2 * sc, rx: w * .52, ry: 11 * sc, fill: c2 }, g);
    mk('ellipse', { cx: x + w / 2, cy: y - 30 * sc, rx: w * .4, ry: 14 * sc, fill: '#fff', opacity: .1 }, g);
  }
  // vertical-striped waterfall
  function waterfall(svg, x, y, w, h, mist = true) {
    const g = G(svg), cols = ['#cdc6ff', '#f4cfe0', '#a7b6ff', '#ebe6ff', '#b9a6f0', '#fbd9d0', '#9fb0f5'];
    const n = Math.round(w / 15);
    for (let i = 0; i < n; i++) mk('rect', { x: x + i * (w / n), y, width: w / n + .6, height: h, fill: cols[(i * 3 + (i >> 2)) % cols.length], opacity: .95 }, g);
    mk('rect', { x, y, width: w, height: h, fill: 'url(#wfade)' }, g);
    for (let i = 0; i < n * 1.4; i++) {
      const sx = x + rnd() * w;
      mk('path', { d: `M${sx} ${y}V${y + h}`, stroke: '#fff', 'stroke-width': 1.5 + rnd() * 3, opacity: .3 + rnd() * .4, 'stroke-linecap': 'round', fill: 'none',
        class: 'streak', style: `animation-delay:${-rnd() * 2}s;animation-duration:${1.1 + rnd()}s` }, g);
    }
    if (mist) mk('ellipse', { cx: x + w / 2, cy: y + h, rx: w * .8, ry: 40, fill: '#e9e2ff', opacity: .55 }, g);
  }
  // spiky leaves fanning out of one point
  function fan(g, cx, cy, n, len, cols, from = -75, to = 75) {
    const grp = G(g, { class: 'sway', style: `animation-delay:${-rnd() * 4}s` });
    for (let i = 0; i < n; i++) {
      const a = (from + (to - from) * (n === 1 ? .5 : i / (n - 1)) + (rnd() - .5) * 10) * Math.PI / 180, L = len * (.6 + rnd() * .5);
      const tx = cx + Math.sin(a) * L, ty = cy - Math.cos(a) * L, mx = cx + Math.sin(a) * L * .5, my = cy - Math.cos(a) * L * .55, w = 9 + L * .06;
      P(grp, `M${cx} ${cy}Q${mx - w} ${my} ${tx} ${ty}Q${mx + w} ${my + 6} ${cx} ${cy}z`, cols[i % cols.length]);
    }
  }
  // tall dark-blue grass tufts (hero foreground)
  function tufts(g, x0, x1, base, n, hMin, hMax, cols) {
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), h = hMin + rnd() * (hMax - hMin), b = (rnd() - .35) * 70;
      P(g, `M${x} ${base}Q${x + b * .3} ${base - h * .6} ${x + b} ${base - h}Q${x + b * .6 + 10} ${base - h * .45} ${x + 14} ${base}z`, cols[i % cols.length], 1,
        { class: 'sway', style: `animation-delay:${-rnd() * 4}s` });
    }
  }
  function flowers(g, x0, x1, y0, y1, n) {
    const c = ['#f2a03d', '#ffb86b', '#6fa8e8', '#9cc4ff', '#f47fa8'];
    for (let i = 0; i < n; i++) {
      const x = x0 + rnd() * (x1 - x0), y = y0 + rnd() * (y1 - y0);
      mk('path', { d: `M${x} ${y + 40}V${y}`, stroke: '#1d6b6b', 'stroke-width': 2 }, g);
      mk('circle', { cx: x, cy: y, r: 4 + rnd() * 5, fill: c[i % c.length] }, g);
    }
  }
  // flock of birds that really crosses the whole frame
  function flock(svg, n, y0, spread, color, sc, delay) {
    const f = G(svg, { class: 'flock', style: `animation-delay:${delay}s` });
    for (let i = 0; i < n; i++) {
      const pos = G(f, { transform: `translate(${rnd() * 380} ${y0 + rnd() * spread}) scale(${sc * (.7 + rnd() * .8)})` });
      P(pos, 'M-9 0Q-4 -8 0 0Q4 -8 9 0Q4 -3 0 3Q-4 -3 -9 0z', color, 1,
        { class: 'bird', style: `animation-delay:${-rnd()}s;animation-duration:${.7 + rnd() * .5}s` });
    }
  }

  /* ---------- characters ---------- */
  const hikerBack = `
    <path d="M20 330C8 230 60 168 130 168c72 0 112 62 100 162z" fill="#c9482e"/>
    <path d="M70 330C62 262 84 212 130 205V330z" fill="#f0b232" opacity=".9"/>
    <path d="M168 205h62v110h-62z" fill="#8a3a2a"/>
    <circle cx="130" cy="150" r="32" fill="#cf9674"/><path d="M98 150q32-44 64 0z" fill="#3a2a2a"/>
    <ellipse cx="130" cy="128" rx="82" ry="17" fill="#e8a82a"/>
    <path d="M60 128Q130 14 200 128z" fill="#f5c443"/><path d="M130 40Q200 128 200 128H130z" fill="#df9a2a" opacity=".6"/>`;
  const angler = `
    <path d="M70 300C55 230 85 170 150 165c65 5 95 65 80 135z" fill="#d98a4a"/>
    <path d="M190 175c45 20 60 70 40 125h-50z" fill="#3b5fc4"/>
    <path d="M118 190l32 110h-44z" fill="#f2c57a"/>
    <circle cx="150" cy="138" r="26" fill="#ecb892"/>
    <path d="M124 142q26 72 52 0q-26 14-52 0z" fill="#f6f1ea"/>
    <ellipse cx="150" cy="116" rx="72" ry="17" fill="#e8808c"/>
    <path d="M86 116Q150 16 214 116z" fill="#f08090"/><path d="M150 38Q214 116 214 116H150z" fill="#d5546a" opacity=".7"/>
    <path d="M94 108Q150 82 206 108" stroke="#f6c978" stroke-width="6" fill="none"/>
    <path d="M206 205L380 30" stroke="#5a3b2e" stroke-width="4"/><path d="M380 30L392 130" stroke="#fff" stroke-width="1.2" opacity=".6"/>`;
  const deer = `
    <g fill="#b98666"><rect x="178" y="260" width="16" height="112" rx="8"/><rect x="208" y="264" width="16" height="108" rx="8"/>
    <rect x="336" y="262" width="16" height="110" rx="8"/><rect x="366" y="258" width="16" height="114" rx="8"/></g>
    <ellipse cx="275" cy="225" rx="140" ry="64" fill="#c99a7b"/><ellipse cx="275" cy="262" rx="120" ry="28" fill="#ead2b8"/>
    <path d="M178 200Q128 150 110 92l52-16Q184 140 228 180z" fill="#c99a7b"/>
    <path d="M404 190q34-14 40-48-30 18-48 30z" fill="#ead2b8"/>
    <ellipse cx="102" cy="84" rx="42" ry="30" fill="#c99a7b" transform="rotate(-12 102 84)"/>
    <ellipse cx="72" cy="96" rx="20" ry="15" fill="#ead2b8" transform="rotate(-12 72 96)"/>
    <path d="M78 60L32 22Q22 66 64 84z" fill="#c99a7b"/><path d="M72 58L42 34Q38 62 66 76z" fill="#e9a3a0"/>
    <path d="M126 54L160 8Q182 52 138 80z" fill="#c99a7b"/><path d="M130 54L154 20Q164 50 140 70z" fill="#e9a3a0"/>
    <circle cx="96" cy="76" r="5" fill="#1d1230"/><ellipse cx="54" cy="96" rx="6" ry="4.5" fill="#2b1a2c"/>
    <g fill="#fff4e4" opacity=".92">${Array.from({ length: 22 }, (_, i) => `<circle cx="${190 + (i % 7) * 30 + (i > 13 ? 12 : 0)}" cy="${170 + Math.floor(i / 7) * 24 + (i % 2) * 6}" r="4.2"/>`).join('')}</g>`;
  const put = (svg, markup, x, y, s) => { const g = G(svg, { transform: `translate(${x} ${y}) scale(${s})` }); g.innerHTML = markup; return g; };

  /* ---------- SCENE 0 : VISITE ---------- */
  let g = $('#h-sun');
  const gl = mk('defs', {}, g); const rg = mk('radialGradient', { id: 'glow' }, gl);
  mk('stop', { offset: 0, 'stop-color': '#ffcf7a', 'stop-opacity': .7 }, rg); mk('stop', { offset: 1, 'stop-color': '#ff9a6a', 'stop-opacity': 0 }, rg);
  mk('circle', { cx: 1180, cy: 430, r: 520, fill: 'url(#glow)' }, g);
  P(g, 'M840 780L1090 380L1180 300L1260 250L1330 310L1450 280L1600 330V780z', '#f5a24f');
  P(g, 'M1090 380L1180 300L1260 250L1250 420L1170 520z', '#ffd978');
  P(g, 'M1260 250L1330 310L1450 280L1420 460L1300 520L1250 420z', '#ffc566');
  P(g, 'M1250 420L1300 520L1420 460L1500 600L1600 560V780H1000z', '#e5738a');
  P(g, 'M840 780L1090 380L1170 520L1000 780z', '#a9559a');
  P(g, 'M1170 520L1250 420L1300 520L1260 650L1100 710z', '#f78f6b');
  g = $('#h-cloud');
  bank(g, 560, 520, 420, '#8e82b8', '#6a5f9a', 1.1); bank(g, 980, 430, 520, '#a79ec9', '#7a70a8', 1.2);
  bank(g, 60, 380, 300, '#7d72ab', '#5a4f8f', .9);  bank(g, 1180, 330, 360, '#9d93c4', '#70669f', .8);
  g = $('#h-hill');
  P(g, 'M0 470L130 440 240 560 330 640 300 900H0z', '#150f4a');
  P(g, 'M0 600Q170 540 360 600T620 650L700 760 560 860H0z', '#2c35a6');
  P(g, 'M0 650Q240 590 520 660L560 740 360 800 0 800z', '#4a5bd2');
  P(g, 'M220 690Q420 640 600 700L560 760 340 780z', '#8a99ee', .85);
  P(g, 'M520 700Q800 640 1000 740L1100 900H520z', '#1d1a70');
  flock($('#h-birds'), 14, 140, 150, '#fff', .85, 0); flock($('#h-birds'), 10, 260, 170, '#d9d2ff', .7, -11);
  g = $('#h-fg');
  P(g, 'M0 720L160 760 250 900H0z', '#d79c78'); P(g, 'M0 780L110 810 140 900H0z', '#efbb98'); P(g, 'M0 720L60 740 0 790z', '#a8687a');
  mk('defs', {}, g); grad(g, 'wfade', [[0, '#fff', 0], [1, '#5a4cc4', .55]]);
  waterfall(g, 270, 800, 250, 110);
  P(g, 'M520 830Q860 770 1100 850T1600 810V900H520z', '#0f0a40');
  g = $('#h-char');
  put(g, hikerBack, 1170, 400, 1.15);
  tufts(g, 1000, 1640, 900, 80, 90, 250, ['#15305e', '#1d4a7c', '#25667f', '#0e1c4c']);
  tufts(g, 0, 700, 900, 34, 60, 150, ['#101a4e', '#0d1442']);

  /* ---------- SCENE 1 : TRANQUILITY ---------- */
  g = $('#t-back');
  P(g, 'M800 0H870L920 300 890 700 800 900z', '#2b1d6c'); P(g, 'M862 0H872L922 300 892 700 884 700 912 300z', '#e0a463', .8);
  P(g, 'M960 540Q1000 480 1040 540V760H960z', '#4a3a98'); P(g, 'M960 540Q1000 480 1040 540L1000 560z', '#8a78d6');
  g = $('#t-fall');
  grad(g, 'wfade', [[0, '#fff', 0], [1, '#5a4cc4', .55]]);
  waterfall(g, 440, 0, 380, 900);
  g = $('#t-rays');
  [[1600, -60, 560, 900, 700, 900, .2], [1600, 40, 760, 900, 940, 900, .16], [1600, 160, 1000, 900, 1180, 900, .12], [1500, -40, 420, 900, 520, 900, .12]]
    .forEach(([x1, y1, x2, y2, x3, y3, o]) => P(g, `M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}z`, '#ffe0a8', o));
  g = $('#t-cliff');
  P(g, 'M0 0H360L395 130 330 300 400 480 330 700 370 900H0z', '#d39a78');
  P(g, 'M0 0H210L250 170 170 360 235 560 150 760 170 900H0z', '#e9b392');
  P(g, 'M60 110L190 90 240 220 160 330 70 270z', '#f4cba8', .85); P(g, 'M40 420L160 400 200 560 90 640z', '#f0bd9a', .8);
  P(g, 'M360 0L395 130 330 300 400 480 330 700 370 900 440 900 420 620 460 420 410 200 420 0z', '#7b4a6d');
  P(g, 'M0 520L100 540 130 720 50 900H0z', '#a8687a');
  P(g, 'M0 800Q220 740 440 820V900H0z', '#0c1646');
  fan(g, 70, 840, 7, 260, ['#10324f', '#16475e', '#0e2a46'], -70, 60); fan(g, 230, 880, 6, 190, ['#1c5a64', '#10324f'], -50, 70);
  P(g, 'M95 840L102 560 112 840z', '#2a5a5a');
  flowers(g, 20, 420, 760, 830, 12);
  g = $('#t-fg');
  fan(g, 700, 900, 8, 170, ['#7aa66a', '#9bc07a', '#5d8d5e'], -70, 70);
  P(g, 'M860 900L930 770 1080 700 1230 750 1370 710 1480 790 1600 770V900z', '#7a5fc4');
  P(g, 'M1080 700L1230 750 1170 830 975 810z', '#a98be0'); P(g, 'M1230 750L1370 710 1340 810 1190 840z', '#f2a05a');
  P(g, 'M930 770L1080 700 975 810z', '#47379a'); P(g, 'M1370 710L1480 790 1600 770 1600 880 1340 810z', '#5c46b0');
  put(g, angler, 1090, 420, .95);
  fan(g, 1000, 900, 5, 130, ['#1c5a64', '#10324f'], -60, 50); fan(g, 1560, 900, 5, 150, ['#10324f', '#1c5a64'], -50, 60);
  flock($('#t-birds'), 3, 300, 120, '#fff', 2.3, -3); flock($('#t-birds'), 2, 480, 90, '#f0e6ff', 1.6, -13);

  /* ---------- SCENE 2 : BIODIVERSITY ---------- */
  g = $('#b-back');
  P(g, 'M1000 900V520Q1050 440 1160 470T1380 420L1600 400V900z', '#2d2380');
  P(g, 'M1160 470Q1260 430 1380 420L1330 520 1200 540z', '#5b49b0'); P(g, 'M1500 380L1600 330V520L1520 520z', '#4a3a98');
  grad(g, 'wfade', [[0, '#fff', 0], [1, '#5a4cc4', .5]]);
  waterfall(g, 1390, 540, 130, 360, false);
  [[1290, 330, 120], [1320, 350, 90], [1260, 380, 70]].forEach(([x, y, h]) => { P(g, `M${x} ${y + h}Q${x - 6} ${y + 20} ${x} ${y}Q${x + 8} ${y + 20} ${x + 10} ${y + h}z`, '#7fb0d6'); });
  fan(g, 1240, 560, 6, 110, ['#7a55c0', '#b08ae0'], -60, 60);
  g = $('#b-mid');
  P(g, 'M720 900L800 640 960 560 1130 620 1230 760 1300 900z', '#6b53b8');
  P(g, 'M800 640L960 560 940 700 840 760z', '#b08ae0'); P(g, 'M960 560L1130 620 1060 720 940 700z', '#8a6fd0');
  P(g, 'M1130 620L1230 760 1130 820 1060 720z', '#f2a05a'); P(g, 'M840 760L940 700 1060 720 1130 820 1000 900 820 900z', '#4a3a98');
  P(g, 'M1050 900L1120 780 1260 740 1330 900z', '#f0a668'); P(g, 'M1120 780L1260 740 1200 840z', '#ffc78a');
  fan(g, 700, 900, 8, 190, ['#0f3a52', '#1b6372', '#12466a'], -75, 60);
  g = $('#b-fg');
  P(g, 'M780 900Q1100 840 1600 870V900z', '#0d0845');
  put(g, deer, 960, 350, 1);
  fan(g, 120, 900, 9, 280, ['#0f3a52', '#1b6372', '#12466a', '#0b2a44'], -78, 62); fan(g, 360, 900, 7, 200, ['#1b6372', '#0f3a52'], -60, 70);
  flowers(g, 40, 560, 650, 820, 22);
  P(g, 'M1500 900Q1530 800 1600 780V900z', '#0f3a52'); fan(g, 1580, 900, 4, 120, ['#1b6372', '#0f3a52'], -70, 20);
  g = $('#b-flies');
  for (let i = 0; i < 28; i++) mk('circle', { cx: rnd() * 1600, cy: 120 + rnd() * 700, r: 1.4 + rnd() * 2.2, fill: '#ffe2a0', opacity: .8, class: 'fly',
    style: `animation-delay:${-rnd() * 6}s;animation-duration:${4 + rnd() * 5}s` }, g);

  /* ---------- smooth scroll engine ---------- */
  const track = $('.track'), scenes = $$('.scene'), dots = $$('.dots button'), last = scenes.length - 1;
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
      const l = cur - i, a = Math.abs(l), op = clamp(1.7 - a * 2.6);
      s.style.opacity = op; s.style.visibility = op < .01 ? 'hidden' : 'visible'; s.style.pointerEvents = a < .4 ? 'auto' : 'none';
      if (op < .01) return;
      layers[i].forEach(({ el, d }) => {
        el.style.transform = `translate3d(${cmx * d * -40}px,${-l * d * 18 + cmy * d * 22}vh,0) scale(${1 + a * d * .14})`;
      });
      const { c, kids } = copies[i];
      c.style.opacity = clamp(1.5 - a * 3);
      kids.forEach(k => {
        k.style.transform = `translate3d(0,${-l * (90 + +k.dataset.i * 55)}px,0)`;
        k.style.filter = a > .05 ? `blur(${Math.min(a * 10, 8)}px)` : 'none';
      });
    });
    const idx = Math.round(cur);
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    $('.hint').style.opacity = clamp(1 - cur * 4);
  }
  (function loop() {
    cur += (target - cur) * (reduce ? 1 : .075);
    cmx += (mx - cmx) * .06; cmy += (my - cmy) * .06;
    if (Math.abs(target - cur) < .0004) cur = target;
    render(); requestAnimationFrame(loop);
  })();

  $$('[data-go]').forEach(el => el.addEventListener('click', e => {
    e.preventDefault();
    scrollTo({ top: (+el.dataset.go / last) * max, behavior: reduce ? 'auto' : 'smooth' });
  }));
  measure(); onScroll(); cur = target;
})();
