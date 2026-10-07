/**
 * Notosan | Smooth Scroll Nature Journey
 * ---------------------------------------------------------------------------
 * 1. Utilities and SVG helpers
 * 2. Illustration helpers (clouds, waterfalls, foliage, birds)
 * 3. Character illustrations
 * 4. Scene artwork (Visit, Tranquility, Biodiversity)
 * 5. Scroll engine (smoothed progress, parallax, scene transitions)
 * 6. Navigation
 *
 * All artwork is generated at runtime as SVG, so the project needs no image
 * assets, frameworks or build tools.
 */
(() => {
  'use strict';

  /* ======================================================================
     1. Utilities and SVG helpers
     ====================================================================== */

  const SVG_NAMESPACE = 'http://www.w3.org/2000/svg';
  const prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const select = (selector, root = document) => root.querySelector(selector);
  const selectAll = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

  // Seeded pseudo-random generator, so the artwork is identical on every load.
  let randomSeed = 11;
  const random = () => (randomSeed = (randomSeed * 16807) % 2147483647) / 2147483647;

  function createSvgElement(tagName, attributes, parent) {
    const element = document.createElementNS(SVG_NAMESPACE, tagName);
    for (const name in attributes) element.setAttribute(name, attributes[name]);
    if (parent) parent.appendChild(element);
    return element;
  }

  const addPath = (parent, pathData, fill, opacity = 1, extraAttributes = {}) =>
    createSvgElement('path', { d: pathData, fill, opacity, ...extraAttributes }, parent);

  const addGroup = (parent, attributes = {}) => createSvgElement('g', attributes, parent);

  let gradientCounter = 0;

  /** Adds a vertical linear gradient to the SVG and returns its url() reference. */
  function addVerticalGradient(svg, stops) {
    const id = `gradient-${gradientCounter++}`;
    const definitions = createSvgElement('defs', {}, svg);
    const gradient = createSvgElement('linearGradient', { id, x1: 0, y1: 0, x2: 0, y2: 1 }, definitions);
    stops.forEach(([offset, color, opacity = 1]) =>
      createSvgElement('stop', { offset, 'stop-color': color, 'stop-opacity': opacity }, gradient));
    return `url(#${id})`;
  }

  /** Inserts a block of SVG markup at the given position and scale. */
  function placeMarkup(parent, markup, x, y, scale) {
    const group = addGroup(parent, { transform: `translate(${x} ${y}) scale(${scale})` });
    group.innerHTML = markup;
    return group;
  }


  /* ======================================================================
     2. Illustration helpers
     ====================================================================== */

  /** Draws a flat-bottomed cloud bank made of overlapping circles. */
  function drawCloudBank(svg, x, baseY, width, bodyColor, shadowColor, scale = 1) {
    const group = addGroup(svg);
    for (let cx = x; cx < x + width;) {
      const radius = (26 + random() * 46) * scale;
      createSvgElement('circle', { cx, cy: baseY - radius * 0.8, r: radius, fill: bodyColor }, group);
      cx += radius * 0.85;
    }
    createSvgElement('ellipse', { cx: x + width / 2, cy: baseY - 2 * scale, rx: width * 0.52, ry: 11 * scale, fill: shadowColor }, group);
    createSvgElement('ellipse', { cx: x + width / 2, cy: baseY - 30 * scale, rx: width * 0.4, ry: 14 * scale, fill: '#fff', opacity: 0.1 }, group);
  }

  /** Draws a waterfall from vertical colored strips with animated highlights. */
  function drawWaterfall(svg, x, y, width, height, { showMist = true } = {}) {
    const group = addGroup(svg);
    const stripColors = ['#cdc6ff', '#f4cfe0', '#a7b6ff', '#ebe6ff', '#b9a6f0', '#fbd9d0', '#9fb0f5'];
    const stripCount = Math.round(width / 15);
    const fade = addVerticalGradient(svg, [[0, '#fff', 0], [1, '#5a4cc4', 0.55]]);

    for (let i = 0; i < stripCount; i++) {
      createSvgElement('rect', {
        x: x + i * (width / stripCount), y, width: width / stripCount + 0.6, height,
        fill: stripColors[(i * 3 + (i >> 2)) % stripColors.length], opacity: 0.95,
      }, group);
    }
    createSvgElement('rect', { x, y, width, height, fill: fade }, group);

    for (let i = 0; i < stripCount * 1.4; i++) {
      const streakX = x + random() * width;
      createSvgElement('path', {
        d: `M${streakX} ${y}V${y + height}`, stroke: '#fff', 'stroke-width': 1.5 + random() * 3,
        opacity: 0.3 + random() * 0.4, 'stroke-linecap': 'round', fill: 'none', class: 'water-streak',
        style: `animation-delay:${-random() * 2}s;animation-duration:${1.1 + random()}s`,
      }, group);
    }
    if (showMist) {
      createSvgElement('ellipse', { cx: x + width / 2, cy: y + height, rx: width * 0.8, ry: 40, fill: '#e9e2ff', opacity: 0.55 }, group);
    }
  }

  /** Draws spiky leaves fanning out from a single base point. */
  function drawLeafFan(parent, baseX, baseY, leafCount, length, colors, startAngle = -75, endAngle = 75) {
    const group = addGroup(parent, { class: 'sway', style: `animation-delay:${-random() * 4}s` });
    for (let i = 0; i < leafCount; i++) {
      const progress = leafCount === 1 ? 0.5 : i / (leafCount - 1);
      const angle = (startAngle + (endAngle - startAngle) * progress + (random() - 0.5) * 10) * Math.PI / 180;
      const leafLength = length * (0.6 + random() * 0.5);
      const tipX = baseX + Math.sin(angle) * leafLength;
      const tipY = baseY - Math.cos(angle) * leafLength;
      const midX = baseX + Math.sin(angle) * leafLength * 0.5;
      const midY = baseY - Math.cos(angle) * leafLength * 0.55;
      const halfWidth = 9 + leafLength * 0.06;
      addPath(group,
        `M${baseX} ${baseY}Q${midX - halfWidth} ${midY} ${tipX} ${tipY}Q${midX + halfWidth} ${midY + 6} ${baseX} ${baseY}z`,
        colors[i % colors.length]);
    }
  }

  /** Draws tall blades of grass along a baseline. */
  function drawGrassTufts(parent, minX, maxX, baseY, count, minHeight, maxHeight, colors) {
    for (let i = 0; i < count; i++) {
      const x = minX + random() * (maxX - minX);
      const height = minHeight + random() * (maxHeight - minHeight);
      const lean = (random() - 0.35) * 70;
      addPath(parent,
        `M${x} ${baseY}Q${x + lean * 0.3} ${baseY - height * 0.6} ${x + lean} ${baseY - height}Q${x + lean * 0.6 + 10} ${baseY - height * 0.45} ${x + 14} ${baseY}z`,
        colors[i % colors.length], 1,
        { class: 'sway', style: `animation-delay:${-random() * 4}s` });
    }
  }

  /** Scatters small flowers on thin stems inside the given area. */
  function drawFlowers(parent, minX, maxX, minY, maxY, count) {
    const petalColors = ['#f2a03d', '#ffb86b', '#6fa8e8', '#9cc4ff', '#f47fa8'];
    for (let i = 0; i < count; i++) {
      const x = minX + random() * (maxX - minX);
      const y = minY + random() * (maxY - minY);
      createSvgElement('path', { d: `M${x} ${y + 40}V${y}`, stroke: '#1d6b6b', 'stroke-width': 2 }, parent);
      createSvgElement('circle', { cx: x, cy: y, r: 4 + random() * 5, fill: petalColors[i % petalColors.length] }, parent);
    }
  }

  /** Draws a flock whose members flap individually while the group crosses the whole frame. */
  function drawBirdFlock(svg, birdCount, baseY, verticalSpread, color, scale, animationDelay) {
    const flock = addGroup(svg, { class: 'bird-flock', style: `animation-delay:${animationDelay}s` });
    for (let i = 0; i < birdCount; i++) {
      // The outer group holds the position so the CSS flap animation never overrides it.
      const position = addGroup(flock, {
        transform: `translate(${random() * 380} ${baseY + random() * verticalSpread}) scale(${scale * (0.7 + random() * 0.8)})`,
      });
      addPath(position, 'M-9 0Q-4 -8 0 0Q4 -8 9 0Q4 -3 0 3Q-4 -3 -9 0z', color, 1, {
        class: 'bird',
        style: `animation-delay:${-random()}s;animation-duration:${0.7 + random() * 0.5}s`,
      });
    }
  }


  /* ======================================================================
     3. Character illustrations (SVG markup)
     ====================================================================== */

  const HIKER_SVG = `
    <path d="M20 330C8 230 60 168 130 168c72 0 112 62 100 162z" fill="#c9482e"/>
    <path d="M70 330C62 262 84 212 130 205V330z" fill="#f0b232" opacity=".9"/>
    <path d="M168 205h62v110h-62z" fill="#8a3a2a"/>
    <circle cx="130" cy="150" r="32" fill="#cf9674"/><path d="M98 150q32-44 64 0z" fill="#3a2a2a"/>
    <ellipse cx="130" cy="128" rx="82" ry="17" fill="#e8a82a"/>
    <path d="M60 128Q130 14 200 128z" fill="#f5c443"/><path d="M130 40Q200 128 200 128H130z" fill="#df9a2a" opacity=".6"/>`;

  const FISHERMAN_SVG = `
    <path d="M70 300C55 230 85 170 150 165c65 5 95 65 80 135z" fill="#d98a4a"/>
    <path d="M190 175c45 20 60 70 40 125h-50z" fill="#3b5fc4"/>
    <path d="M118 190l32 110h-44z" fill="#f2c57a"/>
    <circle cx="150" cy="138" r="26" fill="#ecb892"/>
    <path d="M124 142q26 72 52 0q-26 14-52 0z" fill="#f6f1ea"/>
    <ellipse cx="150" cy="116" rx="72" ry="17" fill="#e8808c"/>
    <path d="M86 116Q150 16 214 116z" fill="#f08090"/><path d="M150 38Q214 116 214 116H150z" fill="#d5546a" opacity=".7"/>
    <path d="M94 108Q150 82 206 108" stroke="#f6c978" stroke-width="6" fill="none"/>
    <path d="M206 205L380 30" stroke="#5a3b2e" stroke-width="4"/><path d="M380 30L392 130" stroke="#fff" stroke-width="1.2" opacity=".6"/>`;

  const DEER_SVG = `
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
    <g fill="#fff4e4" opacity=".92">${Array.from({ length: 22 }, (_, i) =>
      `<circle cx="${190 + (i % 7) * 30 + (i > 13 ? 12 : 0)}" cy="${170 + Math.floor(i / 7) * 24 + (i % 2) * 6}" r="4.2"/>`).join('')}</g>`;


  /* ======================================================================
     4. Scene artwork
     ====================================================================== */

  /* ---- Scene 1: Visit ---- */
  let layer = select('#hero-sun');
  const glowDefinitions = createSvgElement('defs', {}, layer);
  const glowGradient = createSvgElement('radialGradient', { id: 'sun-glow' }, glowDefinitions);
  createSvgElement('stop', { offset: 0, 'stop-color': '#ffcf7a', 'stop-opacity': 0.7 }, glowGradient);
  createSvgElement('stop', { offset: 1, 'stop-color': '#ff9a6a', 'stop-opacity': 0 }, glowGradient);
  createSvgElement('circle', { cx: 1180, cy: 430, r: 520, fill: 'url(#sun-glow)' }, layer);
  addPath(layer, 'M840 780L1090 380L1180 300L1260 250L1330 310L1450 280L1600 330V780z', '#f5a24f');
  addPath(layer, 'M1090 380L1180 300L1260 250L1250 420L1170 520z', '#ffd978');
  addPath(layer, 'M1260 250L1330 310L1450 280L1420 460L1300 520L1250 420z', '#ffc566');
  addPath(layer, 'M1250 420L1300 520L1420 460L1500 600L1600 560V780H1000z', '#e5738a');
  addPath(layer, 'M840 780L1090 380L1170 520L1000 780z', '#a9559a');
  addPath(layer, 'M1170 520L1250 420L1300 520L1260 650L1100 710z', '#f78f6b');

  layer = select('#hero-clouds');
  drawCloudBank(layer, 560, 520, 420, '#8e82b8', '#6a5f9a', 1.1);
  drawCloudBank(layer, 980, 430, 520, '#a79ec9', '#7a70a8', 1.2);
  drawCloudBank(layer, 60, 380, 300, '#7d72ab', '#5a4f8f', 0.9);
  drawCloudBank(layer, 1180, 330, 360, '#9d93c4', '#70669f', 0.8);

  layer = select('#hero-hills');
  addPath(layer, 'M0 470L130 440 240 560 330 640 300 900H0z', '#150f4a');
  addPath(layer, 'M0 600Q170 540 360 600T620 650L700 760 560 860H0z', '#2c35a6');
  addPath(layer, 'M0 650Q240 590 520 660L560 740 360 800 0 800z', '#4a5bd2');
  addPath(layer, 'M220 690Q420 640 600 700L560 760 340 780z', '#8a99ee', 0.85);
  addPath(layer, 'M520 700Q800 640 1000 740L1100 900H520z', '#1d1a70');

  drawBirdFlock(select('#hero-birds'), 14, 140, 150, '#fff', 0.85, 0);
  drawBirdFlock(select('#hero-birds'), 10, 260, 170, '#d9d2ff', 0.7, -11);

  layer = select('#hero-foreground');
  addPath(layer, 'M0 720L160 760 250 900H0z', '#d79c78');
  addPath(layer, 'M0 780L110 810 140 900H0z', '#efbb98');
  addPath(layer, 'M0 720L60 740 0 790z', '#a8687a');
  drawWaterfall(layer, 270, 800, 250, 110);
  addPath(layer, 'M520 830Q860 770 1100 850T1600 810V900H520z', '#0f0a40');

  layer = select('#hero-character');
  placeMarkup(layer, HIKER_SVG, 1170, 400, 1.15);
  drawGrassTufts(layer, 1000, 1640, 900, 80, 90, 250, ['#15305e', '#1d4a7c', '#25667f', '#0e1c4c']);
  drawGrassTufts(layer, 0, 700, 900, 34, 60, 150, ['#101a4e', '#0d1442']);

  /* ---- Scene 2: Tranquility ---- */
  layer = select('#calm-backdrop');
  addPath(layer, 'M800 0H870L920 300 890 700 800 900z', '#2b1d6c');
  addPath(layer, 'M862 0H872L922 300 892 700 884 700 912 300z', '#e0a463', 0.8);
  addPath(layer, 'M960 540Q1000 480 1040 540V760H960z', '#4a3a98');
  addPath(layer, 'M960 540Q1000 480 1040 540L1000 560z', '#8a78d6');

  drawWaterfall(select('#calm-waterfall'), 440, 0, 380, 900);

  layer = select('#calm-rays');
  [
    [1600, -60, 560, 900, 700, 900, 0.2],
    [1600, 40, 760, 900, 940, 900, 0.16],
    [1600, 160, 1000, 900, 1180, 900, 0.12],
    [1500, -40, 420, 900, 520, 900, 0.12],
  ].forEach(([x1, y1, x2, y2, x3, y3, opacity]) =>
    addPath(layer, `M${x1} ${y1}L${x2} ${y2}L${x3} ${y3}z`, '#ffe0a8', opacity));

  layer = select('#calm-cliff');
  addPath(layer, 'M0 0H360L395 130 330 300 400 480 330 700 370 900H0z', '#d39a78');
  addPath(layer, 'M0 0H210L250 170 170 360 235 560 150 760 170 900H0z', '#e9b392');
  addPath(layer, 'M60 110L190 90 240 220 160 330 70 270z', '#f4cba8', 0.85);
  addPath(layer, 'M40 420L160 400 200 560 90 640z', '#f0bd9a', 0.8);
  addPath(layer, 'M360 0L395 130 330 300 400 480 330 700 370 900 440 900 420 620 460 420 410 200 420 0z', '#7b4a6d');
  addPath(layer, 'M0 520L100 540 130 720 50 900H0z', '#a8687a');
  addPath(layer, 'M0 800Q220 740 440 820V900H0z', '#0c1646');
  drawLeafFan(layer, 70, 840, 7, 260, ['#10324f', '#16475e', '#0e2a46'], -70, 60);
  drawLeafFan(layer, 230, 880, 6, 190, ['#1c5a64', '#10324f'], -50, 70);
  addPath(layer, 'M95 840L102 560 112 840z', '#2a5a5a');
  drawFlowers(layer, 20, 420, 760, 830, 12);

  layer = select('#calm-foreground');
  drawLeafFan(layer, 700, 900, 8, 170, ['#7aa66a', '#9bc07a', '#5d8d5e'], -70, 70);
  addPath(layer, 'M860 900L930 770 1080 700 1230 750 1370 710 1480 790 1600 770V900z', '#7a5fc4');
  addPath(layer, 'M1080 700L1230 750 1170 830 975 810z', '#a98be0');
  addPath(layer, 'M1230 750L1370 710 1340 810 1190 840z', '#f2a05a');
  addPath(layer, 'M930 770L1080 700 975 810z', '#47379a');
  addPath(layer, 'M1370 710L1480 790 1600 770 1600 880 1340 810z', '#5c46b0');
  placeMarkup(layer, FISHERMAN_SVG, 1090, 420, 0.95);
  drawLeafFan(layer, 1000, 900, 5, 130, ['#1c5a64', '#10324f'], -60, 50);
  drawLeafFan(layer, 1560, 900, 5, 150, ['#10324f', '#1c5a64'], -50, 60);

  drawBirdFlock(select('#calm-birds'), 3, 300, 120, '#fff', 2.3, -3);
  drawBirdFlock(select('#calm-birds'), 2, 480, 90, '#f0e6ff', 1.6, -13);

  /* ---- Scene 3: Biodiversity ---- */
  layer = select('#bio-backdrop');
  addPath(layer, 'M1000 900V520Q1050 440 1160 470T1380 420L1600 400V900z', '#2d2380');
  addPath(layer, 'M1160 470Q1260 430 1380 420L1330 520 1200 540z', '#5b49b0');
  addPath(layer, 'M1500 380L1600 330V520L1520 520z', '#4a3a98');
  drawWaterfall(layer, 1390, 540, 130, 360, { showMist: false });
  [[1290, 330, 120], [1320, 350, 90], [1260, 380, 70]].forEach(([x, y, height]) =>
    addPath(layer, `M${x} ${y + height}Q${x - 6} ${y + 20} ${x} ${y}Q${x + 8} ${y + 20} ${x + 10} ${y + height}z`, '#7fb0d6'));
  drawLeafFan(layer, 1240, 560, 6, 110, ['#7a55c0', '#b08ae0'], -60, 60);

  layer = select('#bio-midground');
  addPath(layer, 'M720 900L800 640 960 560 1130 620 1230 760 1300 900z', '#6b53b8');
  addPath(layer, 'M800 640L960 560 940 700 840 760z', '#b08ae0');
  addPath(layer, 'M960 560L1130 620 1060 720 940 700z', '#8a6fd0');
  addPath(layer, 'M1130 620L1230 760 1130 820 1060 720z', '#f2a05a');
  addPath(layer, 'M840 760L940 700 1060 720 1130 820 1000 900 820 900z', '#4a3a98');
  addPath(layer, 'M1050 900L1120 780 1260 740 1330 900z', '#f0a668');
  addPath(layer, 'M1120 780L1260 740 1200 840z', '#ffc78a');
  drawLeafFan(layer, 700, 900, 8, 190, ['#0f3a52', '#1b6372', '#12466a'], -75, 60);

  layer = select('#bio-foreground');
  addPath(layer, 'M780 900Q1100 840 1600 870V900z', '#0d0845');
  placeMarkup(layer, DEER_SVG, 960, 350, 1);
  drawLeafFan(layer, 120, 900, 9, 280, ['#0f3a52', '#1b6372', '#12466a', '#0b2a44'], -78, 62);
  drawLeafFan(layer, 360, 900, 7, 200, ['#1b6372', '#0f3a52'], -60, 70);
  drawFlowers(layer, 40, 560, 650, 820, 22);
  addPath(layer, 'M1500 900Q1530 800 1600 780V900z', '#0f3a52');
  drawLeafFan(layer, 1580, 900, 4, 120, ['#1b6372', '#0f3a52'], -70, 20);

  layer = select('#bio-fireflies');
  for (let i = 0; i < 28; i++) {
    createSvgElement('circle', {
      cx: random() * 1600, cy: 120 + random() * 700, r: 1.4 + random() * 2.2, fill: '#ffe2a0', opacity: 0.8, class: 'firefly',
      style: `animation-delay:${-random() * 6}s;animation-duration:${4 + random() * 5}s`,
    }, layer);
  }


  /* ======================================================================
     5. Scroll engine
     ====================================================================== */

  const scrollTrack = select('.scroll-track');
  const scenes = selectAll('.scene');
  const sectionDots = selectAll('.section-dots button');
  const scrollHint = select('.scroll-hint');
  const lastSceneIndex = scenes.length - 1;

  // Scene progress runs from 0 (first scene) to lastSceneIndex (final scene).
  let maxScroll = 1;
  let targetProgress = 0;
  let currentProgress = 0;
  let pointerX = 0;
  let pointerY = 0;
  let smoothedPointerX = 0;
  let smoothedPointerY = 0;

  const PROGRESS_EASING = 0.075; // Lower values feel heavier and smoother.
  const POINTER_EASING = 0.06;

  const sceneLayers = scenes.map(scene =>
    selectAll('.layer', scene).map(element => ({ element, depth: Number(element.dataset.depth) })));
  const sceneContent = scenes.map(scene => {
    const container = select('.scene-content', scene);
    return { container, items: selectAll('[data-order]', container) };
  });

  const measureScrollRange = () => { maxScroll = scrollTrack.offsetHeight - innerHeight; };
  const updateTargetProgress = () => { targetProgress = clamp(scrollY / maxScroll) * lastSceneIndex; };

  addEventListener('resize', () => { measureScrollRange(); updateTargetProgress(); });
  addEventListener('scroll', updateTargetProgress, { passive: true });
  addEventListener('pointermove', event => {
    pointerX = event.clientX / innerWidth - 0.5;
    pointerY = event.clientY / innerHeight - 0.5;
  });

  /** Applies opacity, parallax and text motion for the current scroll progress. */
  function render() {
    scenes.forEach((scene, index) => {
      const offset = currentProgress - index;        // Negative: upcoming. Positive: passed.
      const distance = Math.abs(offset);
      const sceneOpacity = clamp(1.7 - distance * 2.6);

      scene.style.opacity = sceneOpacity;
      scene.style.visibility = sceneOpacity < 0.01 ? 'hidden' : 'visible';
      scene.style.pointerEvents = distance < 0.4 ? 'auto' : 'none';
      if (sceneOpacity < 0.01) return;

      // Parallax: deeper layers move more and zoom slightly as the scene changes.
      sceneLayers[index].forEach(({ element, depth }) => {
        const translateX = smoothedPointerX * depth * -40;
        const translateY = -offset * depth * 18 + smoothedPointerY * depth * 22;
        const zoom = 1 + distance * depth * 0.14;
        element.style.transform = `translate3d(${translateX}px, ${translateY}vh, 0) scale(${zoom})`;
      });

      // Text blocks fade, slide and blur out in a staggered sequence.
      const { container, items } = sceneContent[index];
      container.style.opacity = clamp(1.5 - distance * 3);
      items.forEach(item => {
        const order = Number(item.dataset.order);
        item.style.transform = `translate3d(0, ${-offset * (90 + order * 55)}px, 0)`;
        item.style.filter = distance > 0.05 ? `blur(${Math.min(distance * 10, 8)}px)` : 'none';
      });
    });

    const activeIndex = Math.round(currentProgress);
    sectionDots.forEach((dot, index) => dot.classList.toggle('is-active', index === activeIndex));
    scrollHint.style.opacity = clamp(1 - currentProgress * 4);
  }

  (function animationLoop() {
    currentProgress += (targetProgress - currentProgress) * (prefersReducedMotion ? 1 : PROGRESS_EASING);
    smoothedPointerX += (pointerX - smoothedPointerX) * POINTER_EASING;
    smoothedPointerY += (pointerY - smoothedPointerY) * POINTER_EASING;
    if (Math.abs(targetProgress - currentProgress) < 0.0004) currentProgress = targetProgress;
    render();
    requestAnimationFrame(animationLoop);
  })();


  /* ======================================================================
     6. Navigation
     ====================================================================== */

  selectAll('[data-target-scene]').forEach(control => {
    control.addEventListener('click', event => {
      event.preventDefault();
      const sceneIndex = Number(control.dataset.targetScene);
      scrollTo({
        top: (sceneIndex / lastSceneIndex) * maxScroll,
        behavior: prefersReducedMotion ? 'auto' : 'smooth',
      });
    });
  });

  measureScrollRange();
  updateTargetProgress();
  currentProgress = targetProgress;
})();
