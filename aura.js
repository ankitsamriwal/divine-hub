/* Divine Hub — deity aura: while an aarti plays (sung version, Read aloud, or the
   aarti step of a Sadhana sitting) a faint sacred symbol of that deity turns
   slowly behind the text. Symbols only, never faces or figures.

   3D path: three.js r128 (UMD, cdnjs, exact version + SRI), loaded lazily the
   first time an aarti plays. Every symbol is built here from simple geometry
   (lathe, torus, tube, cone); no textures or models are fetched.
   Static path: a faint SVG of the same symbol when WebGL is unavailable, the
   script cannot load (offline), or prefers-reduced-motion is set.
   Renders at most 30fps, pauses when the tab is hidden or the layer is off
   screen, and disposes the renderer when the prayer closes. */
(function () {
  'use strict';

  var THREE_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
  var THREE_SRI = 'sha512-dLxUelApnYxpLt6K2iomGngnHO83iUvZytA3YjDUCjT0HDOHKXnVYdf3hU4JjM8uEhxf9nD1/ey98U3t2vZ0qQ==';
  var LS_KEY = 'divinehub_aura_v1';
  var FADE_MS = 1500;
  var TURN_S = 30;
  var FRAME_MS = 1000 / 30;

  /* every deity named in data*.js -> symbol */
  var BY_DEITY = {
    'Ganesh': 'om-modak',
    'Hanuman': 'gada',
    'Shiv': 'trishul-damru', 'Shiva': 'trishul-damru', 'Bhairav': 'trishul-damru',
    'Lakshmi': 'lotus',
    'Vishnu': 'chakra',
    'Krishna': 'flute', 'Radha': 'flute',
    'Durga': 'trishul-lotus',
    'Santoshi Mata': 'kalash', 'Sheetla Mata': 'kalash',
    'Ram': 'bow',
    'Saraswati': 'veena',
    'Surya': 'sun',
    'Sai Baba': 'diya'
  };
  /* per-prayer overrides where the prayer names a specific form */
  var BY_PRAYER = {
    'satyanarayan-aarti': 'chakra',
    'om-jai-jagdish-hare': 'chakra'
  };
  var LABEL = {
    'om-modak': 'Om with modak', 'gada': 'Gada', 'trishul-damru': 'Trishul with damru',
    'lotus': 'Lotus', 'chakra': 'Sudarshan chakra', 'flute': 'Flute with peacock feather',
    'trishul-lotus': 'Trishul on a lotus', 'kalash': 'Kalash', 'bow': 'Bow and arrow',
    'veena': 'Veena', 'sun': 'Sun disc', 'diya': 'Diya'
  };

  function symbolFor(p) {
    if (!p) return 'diya';
    return BY_PRAYER[p.id] || BY_DEITY[p.deity] || 'diya';
  }

  /* ---------- preference ---------- */
  function enabled() { try { return localStorage.getItem(LS_KEY) !== 'off'; } catch (e) { return true; } }
  function setEnabled(on) {
    try { localStorage.setItem(LS_KEY, on ? 'on' : 'off'); } catch (e) {}
    if (!on) stop();
    else if (want) start(want.prayer, want.anchor, want.source);
  }

  function reducedMotion() {
    try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; }
  }
  var glOk = null;
  function webglAvailable() {
    if (glOk !== null) return glOk;
    try {
      var c = document.createElement('canvas');
      glOk = !!(window.WebGLRenderingContext && (c.getContext('webgl') || c.getContext('experimental-webgl')));
    } catch (e) { glOk = false; }
    return glOk;
  }

  var threeP = null;
  function loadThree() {
    if (window.THREE && window.THREE.WebGLRenderer) return Promise.resolve(window.THREE);
    if (threeP) return threeP;
    threeP = new Promise(function (resolve, reject) {
      var s = document.createElement('script');
      s.src = THREE_SRC;
      s.integrity = THREE_SRI;
      s.crossOrigin = 'anonymous';
      s.referrerPolicy = 'no-referrer';
      s.async = true;
      s.onload = function () { window.THREE ? resolve(window.THREE) : reject(new Error('three missing')); };
      s.onerror = function () { threeP = null; s.remove(); reject(new Error('three failed to load')); };
      document.head.appendChild(s);
    });
    return threeP;
  }

  /* ---------- static SVG of each symbol (reduced motion / no WebGL / offline) ---------- */
  function ring(n, fn) { var o = ''; for (var i = 0; i < n; i++) o += fn(i, (i / n) * Math.PI * 2); return o; }
  function f(n) { return Math.round(n * 10) / 10; }
  var LOTUS_SVG = '<g transform="translate(100 150)">' +
    ring(7, function (i) { var a = -78 + i * 26; return '<path transform="rotate(' + a + ')" d="M0 0 C-14 -22 -12 -52 0 -70 C12 -52 14 -22 0 0Z"/>'; }) +
    '<path d="M-46 4 Q0 22 46 4" fill="none"/></g>';
  var SVG = {
    'om-modak': '<text x="100" y="118" text-anchor="middle" font-size="118" font-family="\'Tiro Devanagari Hindi\',serif" stroke="none" fill="currentColor">ॐ</text>' +
      '<path d="M100 146 C88 160 80 172 84 182 Q100 190 116 182 C120 172 112 160 100 146Z"/>' +
      '<path d="M92 181 Q96 166 100 150 M108 181 Q104 166 100 150 M100 184 V152" fill="none"/>',
    'gada': '<line x1="100" y1="96" x2="100" y2="186"/><circle cx="100" cy="66" r="34"/>' +
      '<path d="M68 66 Q100 80 132 66 M72 50 Q100 60 128 50 M72 82 Q100 94 128 82" fill="none"/>' +
      '<path d="M94 32 L100 16 L106 32"/><circle cx="100" cy="188" r="5"/><path d="M93 150 h14 M93 158 h14" fill="none"/>',
    'trishul-damru': '<line x1="100" y1="64" x2="100" y2="190"/>' +
      '<path d="M100 14 L106 34 L100 64 L94 34Z"/>' +
      '<path d="M100 64 Q64 66 62 30 M100 64 Q136 66 138 30" fill="none"/><path d="M56 36 L62 18 L68 36Z M132 36 L138 18 L144 36Z"/>' +
      '<path d="M78 92 L122 92 L104 104 L122 116 L78 116 L96 104Z"/><line x1="78" y1="92" x2="78" y2="116"/><line x1="122" y1="92" x2="122" y2="116"/>',
    'trishul-lotus': '<line x1="100" y1="64" x2="100" y2="150"/>' +
      '<path d="M100 14 L106 34 L100 64 L94 34Z"/>' +
      '<path d="M100 64 Q64 66 62 30 M100 64 Q136 66 138 30" fill="none"/><path d="M56 36 L62 18 L68 36Z M132 36 L138 18 L144 36Z"/>' +
      '<g transform="translate(100 186) scale(.6)">' + ring(5, function (i) { var a = -60 + i * 30; return '<path transform="rotate(' + a + ')" d="M0 0 C-14 -22 -12 -52 0 -70 C12 -52 14 -22 0 0Z"/>'; }) + '</g>',
    'lotus': LOTUS_SVG,
    'chakra': '<circle cx="100" cy="100" r="62"/><circle cx="100" cy="100" r="22"/><circle cx="100" cy="100" r="6"/>' +
      ring(12, function (i, a) { return '<line x1="' + f(100 + 22 * Math.cos(a)) + '" y1="' + f(100 + 22 * Math.sin(a)) + '" x2="' + f(100 + 62 * Math.cos(a)) + '" y2="' + f(100 + 62 * Math.sin(a)) + '"/>'; }) +
      ring(24, function (i, a) { var b = a + 0.13; return '<path d="M' + f(100 + 62 * Math.cos(a)) + ' ' + f(100 + 62 * Math.sin(a)) + ' L' + f(100 + 78 * Math.cos(a + 0.06)) + ' ' + f(100 + 78 * Math.sin(a + 0.06)) + ' L' + f(100 + 62 * Math.cos(b)) + ' ' + f(100 + 62 * Math.sin(b)) + '"/>'; }),
    'flute': '<g transform="rotate(-32 100 100)"><rect x="22" y="94" width="156" height="12" rx="6"/>' +
      '<path d="M40 94 v12 M160 94 v12" fill="none"/>' + ring(6, function (i) { return '<circle cx="' + (78 + i * 13) + '" cy="100" r="2.4"/>'; }) + '</g>' +
      '<path d="M96 186 Q104 120 130 52" fill="none"/>' +
      '<ellipse cx="132" cy="44" rx="18" ry="26" transform="rotate(22 132 44)"/><ellipse cx="133" cy="46" rx="9" ry="13" transform="rotate(22 133 46)"/><ellipse cx="134" cy="48" rx="4" ry="6" transform="rotate(22 134 48)"/>' +
      ring(9, function (i) { var y = 160 - i * 12, x = 100 + (160 - y) * 0.42; return '<path d="M' + f(x) + ' ' + y + ' q-16 -4 -22 -14 M' + f(x) + ' ' + y + ' q16 -8 20 -20" fill="none"/>'; }),
    'bow': '<path d="M86 18 Q70 26 74 40 Q118 100 74 160 Q70 174 86 182" fill="none"/>' +
      '<line x1="80" y1="30" x2="80" y2="170"/><line x1="40" y1="100" x2="170" y2="100"/>' +
      '<path d="M170 92 L188 100 L170 108Z"/><path d="M40 100 L28 90 M40 100 L28 110 M50 100 L38 90 M50 100 L38 110" fill="none"/><rect x="88" y="90" width="10" height="20" rx="3"/>',
    'veena': '<g transform="rotate(-28 100 100)"><circle cx="100" cy="168" r="26"/><circle cx="100" cy="46" r="15"/>' +
      '<rect x="94" y="30" width="12" height="122" rx="4"/><path d="M100 30 Q100 12 116 10 Q126 14 118 22" fill="none"/>' +
      ring(9, function (i) { return '<line x1="91" y1="' + (60 + i * 9) + '" x2="109" y2="' + (60 + i * 9) + '"/>'; }) + '</g>',
    'sun': '<circle cx="100" cy="100" r="38"/><circle cx="100" cy="100" r="26"/>' +
      ring(16, function (i, a) { var L = i % 2 ? 62 : 80, w = 0.09; return '<path d="M' + f(100 + 44 * Math.cos(a - w)) + ' ' + f(100 + 44 * Math.sin(a - w)) + ' L' + f(100 + L * Math.cos(a)) + ' ' + f(100 + L * Math.sin(a)) + ' L' + f(100 + 44 * Math.cos(a + w)) + ' ' + f(100 + 44 * Math.sin(a + w)) + '"/>'; }),
    'kalash': '<path d="M78 70 Q84 80 72 92 Q46 116 56 150 Q66 176 100 178 Q134 176 144 150 Q154 116 128 92 Q116 80 122 70Z"/>' +
      '<path d="M72 68 h56" fill="none"/><path d="M60 128 Q100 140 140 128" fill="none"/>' +
      '<ellipse cx="100" cy="44" rx="18" ry="24"/>' +
      '<path d="M90 66 Q66 62 56 46 Q74 48 90 66Z M110 66 Q134 62 144 46 Q126 48 110 66Z M96 66 Q80 50 78 30 Q94 44 96 66Z M104 66 Q120 50 122 30 Q106 44 104 66Z"/>',
    'diya': '<path d="M44 128 Q60 164 100 164 Q140 164 156 128 Q176 126 186 116 Q160 112 150 120 Z"/>' +
      '<path d="M44 128 Q100 140 150 120" fill="none"/><path d="M80 164 L74 182 H126 L120 164" fill="none"/>' +
      '<path d="M162 118 C150 98 158 74 168 58 C176 76 182 98 168 118Z"/><path d="M166 112 C162 102 164 92 168 84 C172 94 172 104 166 112Z"/>'
  };
  function staticSvg(sym) {
    return '<svg class="aura-svg" viewBox="0 0 200 200" aria-hidden="true" focusable="false" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round">' + (SVG[sym] || SVG.diya) + '</svg>';
  }

  /* ---------- procedural 3D symbols ---------- */
  function build(T, sym, kit) {
    var gold = kit.gold, glow = kit.glow, G = new T.Group();
    var V2 = T.Vector2, V3 = T.Vector3;
    function mesh(geo, mat, x, y, z) { var m = new T.Mesh(geo, mat || gold); m.position.set(x || 0, y || 0, z || 0); return m; }
    function add(o, parent) { (parent || G).add(o); return o; }
    function lathe(pts, seg) { return new T.LatheGeometry(pts.map(function (p) { return new V2(p[0], p[1]); }), seg || 24); }
    function ridges(geo, n, amt, fromY, toY) {
      var pos = geo.attributes.position;
      for (var i = 0; i < pos.count; i++) {
        var x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        var t = Math.max(0, Math.min(1, (y - fromY) / (toY - fromY)));
        var k = 1 + amt * Math.cos(n * Math.atan2(z, x)) * Math.sin(Math.PI * t);
        pos.setX(i, x * k); pos.setZ(i, z * k);
      }
      geo.computeVertexNormals();
      return geo;
    }
    function blade(r, h, x, y, z, rotZ) {
      var g = new T.ConeGeometry(r, h, 4); g.scale(1, 1, 0.35);
      var m = mesh(g, gold, x, y, z); m.rotation.z = rotZ || 0; return m;
    }
    function petal(len, wid) {
      var g = new T.SphereGeometry(0.5, 10, 8);
      g.scale(wid, len, 0.18); g.translate(0, len * 0.5, 0); return g;
    }
    function lotus(scale, rings) {
      var L = new T.Group();
      (rings || [[8, 1.25, 0.62, 1.15, 0], [8, 1.0, 0.5, 0.55, Math.PI / 8]]).forEach(function (r) {
        var g = petal(r[1], r[2]);
        for (var i = 0; i < r[0]; i++) {
          var pivot = new T.Group(); pivot.rotation.y = r[4] + (i / r[0]) * Math.PI * 2;
          var m = new T.Mesh(g, gold); m.rotation.x = r[3]; pivot.add(m); L.add(pivot);
        }
      });
      L.add(mesh(new T.CylinderGeometry(0.32, 0.22, 0.28, 12), gold, 0, 0.18, 0));
      L.scale.setScalar(scale);
      return L;
    }
    function tube(points, radius, seg) {
      var c = new T.CatmullRomCurve3(points.map(function (p) { return new V3(p[0], p[1], p[2] || 0); }));
      return new T.TubeGeometry(c, seg || 32, radius, 6, false);
    }
    function trishul(withDamru, withLotus) {
      var top = withLotus ? 1.55 : 1.35;
      add(mesh(new T.CylinderGeometry(0.06, 0.07, withLotus ? 3.4 : 4.2, 8), gold, 0, withLotus ? -0.15 : -0.55));
      add(mesh(new T.SphereGeometry(0.16, 10, 8), gold, 0, top - 0.05));
      add(mesh(new T.TorusGeometry(0.12, 0.035, 6, 16), gold, 0, top - 0.3)).rotation.x = Math.PI / 2;
      add(mesh(new T.CylinderGeometry(0.05, 0.055, 0.9, 8), gold, 0, top + 0.5));
      add(blade(0.2, 0.75, 0, top + 1.3, 0));
      [-1, 1].forEach(function (s) {
        add(mesh(tube([[0, top + 0.02], [s * 0.55, top + 0.1], [s * 0.82, top + 0.55], [s * 0.72, top + 1.05]], 0.05)));
        add(blade(0.17, 0.62, s * 0.7, top + 1.33, 0, s * 0.12));
      });
      if (withDamru) {
        var D = new T.Group(); D.position.set(0, top - 0.75, 0.0); D.rotation.z = Math.PI / 2;
        var cone = new T.CylinderGeometry(0.34, 0.07, 0.42, 14);
        var a = new T.Mesh(cone, gold); a.position.y = 0.21; D.add(a);
        var b = new T.Mesh(cone, gold); b.rotation.x = Math.PI; b.position.y = -0.21; D.add(b);
        [-0.42, 0.42].forEach(function (y) { var r = new T.Mesh(new T.TorusGeometry(0.34, 0.03, 6, 20), gold); r.rotation.x = Math.PI / 2; r.position.y = y; D.add(r); });
        G.add(D);
      }
      if (withLotus) { var L = lotus(0.85); L.position.y = -2.05; G.add(L); }
    }

    switch (sym) {
      case 'om-modak': {
        var slices = kit.omSlices(T);
        slices.forEach(function (m) { G.add(m); });
        var mg = ridges(lathe([[0, -0.55], [0.36, -0.5], [0.52, -0.3], [0.5, -0.05], [0.36, 0.22], [0.18, 0.45], [0.04, 0.62], [0, 0.66]], 32), 9, 0.12, -0.5, 0.6);
        var modak = add(mesh(mg, gold, 0, -1.75));
        modak.scale.setScalar(0.95);
        G.userData.sway = true;
        break;
      }
      case 'gada': {
        add(mesh(new T.CylinderGeometry(0.075, 0.09, 3.0, 8), gold, 0, -0.9));
        [-1.85, -1.65, -0.2].forEach(function (y) { add(mesh(new T.TorusGeometry(0.11, 0.035, 6, 14), gold, 0, y)).rotation.x = Math.PI / 2; });
        add(mesh(new T.SphereGeometry(0.15, 10, 8), gold, 0, -2.45));
        var hg = ridges(lathe([[0, -0.85], [0.2, -0.8], [0.62, -0.5], [0.78, 0], [0.62, 0.5], [0.2, 0.8], [0, 0.85]], 32), 8, 0.09, -0.85, 0.85);
        add(mesh(hg, gold, 0, 1.25));
        add(mesh(new T.TorusGeometry(0.79, 0.04, 6, 32), gold, 0, 1.25)).rotation.x = Math.PI / 2;
        add(mesh(new T.ConeGeometry(0.14, 0.42, 8), gold, 0, 2.28));
        G.rotation.z = -0.18;
        break;
      }
      case 'trishul-damru': trishul(true, false); break;
      case 'trishul-lotus': trishul(false, true); break;
      case 'lotus': {
        var L = lotus(1.5, [[8, 1.3, 0.62, 1.2, 0], [8, 1.12, 0.55, 0.72, Math.PI / 8], [6, 0.9, 0.45, 0.32, 0]]);
        L.position.y = -0.8; G.add(L); G.userData.tilt = 0.5;
        break;
      }
      case 'chakra': {
        var C = new T.Group();
        C.add(new T.Mesh(new T.TorusGeometry(1.55, 0.09, 6, 48), gold));
        C.add(new T.Mesh(new T.TorusGeometry(0.55, 0.07, 6, 32), gold));
        var hub = new T.Mesh(new T.CylinderGeometry(0.28, 0.28, 0.16, 16), gold); hub.rotation.x = Math.PI / 2; C.add(hub);
        for (var i = 0; i < 12; i++) {
          var a = (i / 12) * Math.PI * 2, sp = new T.Mesh(new T.BoxGeometry(1.0, 0.06, 0.06), gold);
          sp.position.set(Math.cos(a) * 1.05, Math.sin(a) * 1.05, 0); sp.rotation.z = a; C.add(sp);
        }
        for (var j = 0; j < 24; j++) {
          var b = (j / 24) * Math.PI * 2, t = new T.Mesh(new T.ConeGeometry(0.12, 0.42, 4), gold);
          t.scale.z = 0.4; t.position.set(Math.cos(b) * 1.8, Math.sin(b) * 1.8, 0); t.rotation.z = b - Math.PI / 2 - 0.35; C.add(t);
        }
        G.add(C); G.userData.wheel = C; G.userData.sway = true;
        break;
      }
      case 'flute': {
        var F = new T.Group(); F.rotation.z = 1.0; F.position.set(0, -0.55, 0.25);
        F.add(new T.Mesh(new T.CylinderGeometry(0.075, 0.075, 4.2, 12), gold));
        [-1.85, -1.62, 1.62, 1.85].forEach(function (y) { var r = new T.Mesh(new T.TorusGeometry(0.085, 0.022, 6, 14), gold); r.rotation.x = Math.PI / 2; r.position.y = y; F.add(r); });
        G.add(F);
        /* peacock feather: quill, a soft vane, barbs, and the eye as flat rings */
        var P = new T.Group(); P.rotation.z = -0.32; P.position.set(0.1, -0.2, 0);
        P.add(new T.Mesh(tube([[0, -2.2], [0.04, -0.6], [0.02, 1.0], [0, 2.2]], 0.026), gold));
        var vs = new T.Shape();
        vs.moveTo(0, -1.3); vs.bezierCurveTo(0.35, -0.4, 0.75, 1.0, 0.72, 1.75); vs.bezierCurveTo(0.7, 2.45, 0.3, 2.75, 0, 2.78);
        vs.bezierCurveTo(-0.3, 2.75, -0.7, 2.45, -0.72, 1.75); vs.bezierCurveTo(-0.75, 1.0, -0.35, -0.4, 0, -1.3);
        P.add(mesh(new T.ShapeGeometry(vs, 24), kit.vane, 0, 0, -0.02));
        var bar = [];
        for (var k = 0; k < 26; k++) {
          var y = -1.0 + k * 0.14, w = Math.min(0.7, 0.18 + (y + 1.0) * 0.28) * (y > 2.2 ? Math.max(0.2, 1 - (y - 2.2) * 1.4) : 1);
          bar.push(0, y, 0, w, y + 0.32, 0, 0, y, 0, -w, y + 0.32, 0);
        }
        var bg = new T.BufferGeometry(); bg.setAttribute('position', new T.Float32BufferAttribute(bar, 3));
        P.add(new T.LineSegments(bg, kit.line));
        [[0.5, 0.66, 0.02, gold], [0.33, 0.45, 0.04, glow], [0.17, 0.24, 0.06, gold]].forEach(function (e) {
          var eye = new T.Mesh(new T.CircleGeometry(1, 28), e[3]); eye.scale.set(e[0], e[1], 1); eye.position.set(0, 1.8, e[2]); P.add(eye);
        });
        G.add(P);
        break;
      }
      case 'bow': {
        G.add(new T.Mesh(tube([[0.15, -2.15], [-0.05, -1.95], [0.55, -1.1], [0.85, 0], [0.55, 1.1], [-0.05, 1.95], [0.15, 2.15]], 0.07, 48), gold));
        G.add(mesh(new T.CylinderGeometry(0.12, 0.12, 0.55, 10), gold, 0.86, 0));
        var sg = new T.BufferGeometry().setFromPoints([new V3(-0.02, -2.0, 0), new V3(-0.02, 2.0, 0)]);
        G.add(new T.Line(sg, kit.line));
        var A = new T.Group();
        A.add(mesh(new T.CylinderGeometry(0.035, 0.035, 3.6, 6), gold, 0, 0));
        A.add(mesh(new T.ConeGeometry(0.13, 0.42, 4), gold, 0, 2.0));
        [-1, 1].forEach(function (s) { var fl = mesh(new T.BoxGeometry(0.22, 0.4, 0.01), gold, s * 0.1, -1.6, 0); fl.rotation.z = s * 0.35; A.add(fl); });
        A.rotation.z = -Math.PI / 2; A.position.set(0.35, 0, 0.05); G.add(A);
        break;
      }
      case 'veena': {
        var Vn = new T.Group(); Vn.rotation.z = -0.5;
        Vn.add(mesh(new T.SphereGeometry(0.85, 18, 12), gold, 0, -1.55)).scale.set(1, 0.9, 0.8);
        Vn.add(mesh(new T.CylinderGeometry(0.13, 0.16, 3.5, 10), gold, 0, 0.15));
        Vn.add(mesh(new T.SphereGeometry(0.42, 14, 10), gold, 0.0, 1.0, -0.42));
        for (var q = 0; q < 12; q++) Vn.add(mesh(new T.BoxGeometry(0.34, 0.025, 0.06), gold, 0, -0.75 + q * 0.2, 0.15));
        Vn.add(mesh(tube([[0, 1.85], [0.05, 2.25], [0.35, 2.4], [0.45, 2.15]], 0.07, 20)));
        var str = [];
        [-0.07, -0.025, 0.025, 0.07].forEach(function (x) { str.push(x, -1.2, 0.2, x, 1.85, 0.2); });
        var sgeo = new T.BufferGeometry(); sgeo.setAttribute('position', new T.Float32BufferAttribute(str, 3));
        Vn.add(new T.LineSegments(sgeo, kit.line));
        G.add(Vn);
        break;
      }
      case 'sun': {
        var S = new T.Group();
        var disc = new T.Mesh(new T.CylinderGeometry(0.9, 0.9, 0.14, 32), gold); disc.rotation.x = Math.PI / 2; S.add(disc);
        var core = new T.Mesh(new T.CircleGeometry(0.5, 32), glow); core.position.z = 0.08; S.add(core);
        S.add(new T.Mesh(new T.TorusGeometry(0.95, 0.07, 6, 40), gold));
        S.add(new T.Mesh(new T.TorusGeometry(0.62, 0.035, 6, 32), gold));
        for (var r = 0; r < 16; r++) {
          var ang = (r / 16) * Math.PI * 2, len2 = r % 2 ? 0.55 : 0.9, ray = new T.Mesh(new T.ConeGeometry(0.13, len2, 4), gold);
          ray.scale.z = 0.4; ray.position.set(Math.cos(ang) * (1.08 + len2 / 2), Math.sin(ang) * (1.08 + len2 / 2), 0); ray.rotation.z = ang - Math.PI / 2; S.add(ray);
        }
        G.add(S); G.userData.wheel = S; G.userData.sway = true;
        break;
      }
      case 'kalash': {
        add(mesh(lathe([[0, -1.6], [0.55, -1.6], [0.85, -1.38], [1.12, -0.85], [1.15, -0.4], [0.98, 0.1], [0.55, 0.45], [0.46, 0.62], [0.62, 0.72], [0.62, 0.82], [0, 0.82]], 28)));
        add(mesh(new T.TorusGeometry(1.15, 0.045, 6, 36), gold, 0, -0.42)).rotation.x = Math.PI / 2;
        var cg = ridges(new T.SphereGeometry(0.5, 16, 12), 10, 0.05, -0.5, 0.5);
        add(mesh(cg, gold, 0, 1.45)).scale.set(0.95, 1.25, 0.95);
        var leaf = petal(1.15, 0.34);
        for (var l = 0; l < 7; l++) {
          var pv = new T.Group(); pv.position.y = 0.78; pv.rotation.y = (l / 7) * Math.PI * 2;
          var lm = new T.Mesh(leaf, gold); lm.rotation.x = 1.25; pv.add(lm); G.add(pv);
        }
        break;
      }
      default: { /* diya */
        var bowl = lathe([[0, -0.45], [0.55, -0.45], [0.95, -0.25], [1.15, 0.12], [1.08, 0.18], [0.85, -0.08], [0, -0.12]], 36);
        var pos = bowl.attributes.position;
        for (var d = 0; d < pos.count; d++) {
          var x = pos.getX(d), z = pos.getZ(d), th = Math.atan2(z, x), c = Math.max(0, Math.cos(th));
          pos.setX(d, x * (1 + 0.55 * Math.pow(c, 8)));
        }
        bowl.computeVertexNormals();
        add(mesh(bowl, gold, 0, -0.6));
        add(mesh(lathe([[0, -1.7], [0.7, -1.7], [0.62, -1.55], [0.2, -1.3], [0.16, -1.05], [0.45, -0.95], [0, -0.95]], 24)));
        var flame = new T.Mesh(lathe([[0, 0], [0.16, 0.12], [0.2, 0.32], [0.12, 0.62], [0, 0.95]], 16), glow);
        flame.position.set(1.42, -0.48, 0); G.add(flame); G.userData.flame = flame;
        G.scale.setScalar(1.25); G.userData.tilt = 0.3;
      }
    }
    return G;
  }

  /* Om as a stack of thin glyph slices drawn from the app's own Devanagari
     font: reads as a solid carved symbol while it sways. */
  function omSlicesFactory(kit) {
    return function (T) {
      var cv = document.createElement('canvas'); cv.width = cv.height = 512;
      var cx = cv.getContext('2d');
      cx.textAlign = 'center'; cx.textBaseline = 'middle';
      cx.font = '400 400px "Tiro Devanagari Hindi", "Noto Serif Devanagari", serif';
      cx.fillStyle = '#fff';
      cx.fillText('ॐ', 256, 300);
      var tex = new T.CanvasTexture(cv);
      kit.disposables.push(tex);
      var geo = new T.PlaneGeometry(3.3, 3.3);
      var out = [], N = 9;
      for (var i = 0; i < N; i++) {
        var front = i === N - 1;
        var m = new T.MeshBasicMaterial({ map: tex, color: front ? 0xffd27a : 0x9a6a2a, transparent: true, alphaTest: 0.4, side: T.DoubleSide });
        kit.disposables.push(m);
        var mesh = new T.Mesh(geo, m); mesh.position.set(0, 0.55, -0.16 + i * 0.04); out.push(mesh);
      }
      kit.omMats = out.map(function (o) { return o.material; });
      return out;
    };
  }

  /* ---------- the layer ---------- */
  var activeRenderers = 0;
  var want = null;   /* {prayer, anchor, source} last requested; survives a toggle */
  var active = null; /* {host, wrap, layer, sym, source, scene?} */

  function hostFor(anchor) {
    if (!anchor || !anchor.closest) return null;
    return anchor.closest('.prayer-view-inner, .ss-aarti');
  }

  function start(prayer, anchor, source) {
    source = source || 'sung';
    want = { prayer: prayer, anchor: anchor, source: source };
    if (!enabled()) return;
    var host = hostFor(anchor);
    if (!host) return;
    var sym = symbolFor(prayer);
    if (active && active.host === host && active.sym === sym && host.contains(active.wrap)) {
      active.source = source;
      clearTimeout(active.killTimer);
      active.layer.classList.add('on');
      return;
    }
    stop(null, true);
    want = { prayer: prayer, anchor: anchor, source: source };
    var wrap = document.createElement('div');
    wrap.className = 'aura-wrap';
    wrap.setAttribute('aria-hidden', 'true');
    var layer = document.createElement('div');
    layer.className = 'aura-layer';
    layer.dataset.symbol = sym;
    wrap.appendChild(layer);
    host.classList.add('aura-host');
    host.insertBefore(wrap, host.firstChild);
    var a = active = { host: host, wrap: wrap, layer: layer, sym: sym, source: source };

    var fallback = function () {
      if (active !== a) return;
      layer.innerHTML = staticSvg(sym);
      layer.classList.add('static');
      fadeIn(a);
    };
    if (reducedMotion() || !webglAvailable()) { fallback(); return; }
    loadThree().then(function (T) {
      if (active !== a) return;
      try { mount3D(T, a); fadeIn(a); } catch (e) { teardown3D(a); fallback(); }
    }, fallback);
  }

  function fadeIn(a) {
    /* next frame, so the transition runs from 0 */
    requestAnimationFrame(function () { requestAnimationFrame(function () { if (active === a) a.layer.classList.add('on'); }); });
  }

  /* stop(source): stop only if the current symbol was started by that source;
     stop() stops whatever is showing. immediate skips the fade (view closing). */
  function stop(source, immediate) {
    if (!source) want = null;
    else if (want && want.source === source) want = null;
    var a = active;
    if (!a) return;
    if (source && a.source !== source) return;
    active = null;
    a.layer.classList.remove('on');
    var kill = function () {
      teardown3D(a);
      if (a.wrap.parentNode) a.wrap.parentNode.removeChild(a.wrap);
      if (!a.host.querySelector('.aura-wrap')) a.host.classList.remove('aura-host');
    };
    if (immediate) kill(); else a.killTimer = setTimeout(kill, FADE_MS + 50);
  }

  function mount3D(T, a) {
    var kit = { disposables: [] };
    kit.gold = new T.MeshStandardMaterial({ color: 0xe2a94e, emissive: 0x6b3d12, emissiveIntensity: 0.6, metalness: 0.55, roughness: 0.42, flatShading: true });
    kit.glow = new T.MeshBasicMaterial({ color: 0xffcf7a, side: T.DoubleSide });
    kit.line = new T.LineBasicMaterial({ color: 0xe9b866, transparent: true, opacity: 0.8 });
    kit.vane = new T.MeshStandardMaterial({ color: 0xb8803a, emissive: 0x3a2208, metalness: 0.3, roughness: 0.6, transparent: true, opacity: 0.45, side: T.DoubleSide, depthWrite: false });
    kit.disposables.push(kit.vane);
    kit.omSlices = omSlicesFactory(kit);
    var renderer = new T.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
    renderer.setClearColor(0x000000, 0);
    var scene = new T.Scene();
    var camera = new T.PerspectiveCamera(35, 1, 0.1, 100);
    scene.add(new T.AmbientLight(0xffe2b0, 0.55));
    var key = new T.DirectionalLight(0xffd9a0, 0.95); key.position.set(3, 4, 6); scene.add(key);
    var rim = new T.PointLight(0xff9a40, 0.7, 30); rim.position.set(-4, -2, 3); scene.add(rim);
    var G;
    try { G = build(T, a.sym, kit); } catch (e) { renderer.dispose(); throw e; }
    /* root carries a fixed tilt toward the viewer; spin turns about the upright axis */
    var root = new T.Group(), spin = new T.Group(); spin.add(G); root.add(spin); scene.add(root);
    root.rotation.x = G.userData.tilt || 0;

    /* bounding size, for framing */
    var box = new T.Box3().setFromObject(root), size = new T.Vector3(); box.getSize(size);
    var center = new T.Vector3(); box.getCenter(center); G.position.sub(center);
    var halfW = Math.max(size.x, G.userData.sway ? size.x : size.z) / 2 + 0.1, halfH = size.y / 2 + 0.1;

    var s = a.scene = { T: T, renderer: renderer, scene: scene, camera: camera, root: root, spin: spin, G: G, kit: kit, raf: 0, last: 0, t0: performance.now(), visible: true };
    activeRenderers++;
    var canvas = renderer.domElement; canvas.className = 'aura-canvas';
    a.layer.appendChild(canvas);

    function resize() {
      var w = a.layer.clientWidth || 1, h = a.layer.clientHeight || 1;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      var tanH = Math.tan((camera.fov / 2) * Math.PI / 180);
      /* symbol fills ~70% of height, ~80% of width, whichever is tighter */
      var dH = halfH / (tanH * 0.7), dW = halfW / (tanH * camera.aspect * 0.8);
      camera.position.set(0, 0, Math.max(dH, dW, 4));
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      draw(performance.now());
    }
    function draw(now) {
      var t = (now - s.t0) / 1000;
      var turn = (t / TURN_S) * Math.PI * 2;
      if (G.userData.sway) {
        spin.rotation.y = Math.sin(turn) * 0.5;
        if (G.userData.wheel) G.userData.wheel.rotation.z = -turn;
      } else {
        spin.rotation.y = turn;
      }
      var breath = 0.5 + 0.5 * Math.sin((t / 9) * Math.PI * 2);
      kit.gold.emissiveIntensity = 0.45 + 0.4 * breath;
      root.scale.setScalar(1 + 0.018 * breath);
      if (G.userData.flame) G.userData.flame.scale.set(1, 0.94 + 0.08 * breath, 1);
      renderer.render(scene, camera);
    }
    function loop(now) {
      s.raf = 0;
      if (!s.visible || document.hidden) return;
      s.raf = requestAnimationFrame(loop);
      if (now - s.last < FRAME_MS) return;
      s.last = now;
      draw(now);
    }
    s.kick = function () { if (!s.raf && s.visible && !document.hidden) s.raf = requestAnimationFrame(loop); };
    s.onVis = function () { if (document.hidden) { cancelAnimationFrame(s.raf); s.raf = 0; } else s.kick(); };
    document.addEventListener('visibilitychange', s.onVis);
    if ('IntersectionObserver' in window) {
      s.io = new IntersectionObserver(function (es) {
        s.visible = es[es.length - 1].isIntersecting;
        if (s.visible) s.kick(); else { cancelAnimationFrame(s.raf); s.raf = 0; }
      });
      s.io.observe(a.layer);
    }
    if ('ResizeObserver' in window) { s.ro = new ResizeObserver(resize); s.ro.observe(a.layer); }
    else { s.onResize = resize; window.addEventListener('resize', resize); }
    resize();
    s.kick();
  }

  function teardown3D(a) {
    var s = a.scene;
    if (!s) return;
    a.scene = null;
    cancelAnimationFrame(s.raf);
    document.removeEventListener('visibilitychange', s.onVis);
    if (s.io) s.io.disconnect();
    if (s.ro) s.ro.disconnect();
    if (s.onResize) window.removeEventListener('resize', s.onResize);
    var seen = new Set();
    s.scene.traverse(function (o) {
      if (o.geometry && !seen.has(o.geometry)) { seen.add(o.geometry); o.geometry.dispose(); }
      if (o.material && !seen.has(o.material)) { seen.add(o.material); o.material.dispose(); }
    });
    [s.kit.gold, s.kit.glow, s.kit.line].concat(s.kit.disposables).forEach(function (d) { if (d && !seen.has(d)) d.dispose(); });
    s.renderer.dispose();
    try { s.renderer.forceContextLoss(); } catch (e) {}
    var c = s.renderer.domElement; if (c.parentNode) c.parentNode.removeChild(c);
    activeRenderers--;
  }

  /* ---------- prayer view toggle ---------- */
  function toggleHtml() {
    var on = enabled();
    return '<button type="button" class="aura-toggle" id="auraToggle" aria-pressed="' + on + '">' +
      '<span class="aura-toggle-ic" aria-hidden="true">✦</span> Background symbol: <b>' + (on ? 'on' : 'off') + '</b></button>';
  }
  function wireToggle(root) {
    var b = root && root.querySelector('#auraToggle');
    if (!b) return;
    b.addEventListener('click', function () {
      var on = !enabled();
      setEnabled(on);
      b.setAttribute('aria-pressed', String(on));
      b.querySelector('b').textContent = on ? 'on' : 'off';
    });
  }

  window.dhAura = {
    start: start, stop: stop, symbolFor: symbolFor, enabled: enabled, setEnabled: setEnabled,
    toggleHtml: toggleHtml, wireToggle: wireToggle,
    BY_DEITY: BY_DEITY, BY_PRAYER: BY_PRAYER, LABEL: LABEL,
    _state: function () { return { active: !!active, sym: active && active.sym, source: active && active.source, renderers: activeRenderers, mode: active ? (active.scene ? '3d' : (active.layer.classList.contains('static') ? 'static' : 'pending')) : null }; }
  };
})();
