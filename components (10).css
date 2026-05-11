'use strict';

// ── animated dot background ng tool picker ──────────────────
(function initCanvas() {
  const canvas = document.getElementById('tp-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let W, H, dots = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
  }

  function makeDots() {
    dots = [];
    const cols = Math.ceil(W / 52), rows = Math.ceil(H / 52);
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        dots.push({
          x:  c * 52,
          y:  r * 52,
          o:  Math.random() * .25 + .03,
          s:  Math.random() * .5 + .5,
          p:  Math.random() * Math.PI * 2,
          sp: (.0005 + Math.random() * .001) * (Math.random() < .5 ? 1 : -1),
        });
      }
    }
  }

  function draw() {
    // skip rendering pag nakatago
    if (document.getElementById('tool-picker').style.display === 'none') {
      requestAnimationFrame(draw);
      return;
    }
    ctx.clearRect(0, 0, W, H);
    dots.forEach(d => {
      d.p += d.sp;
      d.o  = (.03 + Math.abs(Math.sin(d.p)) * .22) * d.s;
      ctx.beginPath();
      ctx.arc(d.x, d.y, 1.2, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(176,106,255,${d.o})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', () => { resize(); makeDots(); });
  resize();
  makeDots();
  draw();
})();

// ── show/hide logic ──────────────────────────────────────────
function showToolPicker() {
  const picker = document.getElementById('tool-picker');
  picker.style.display = '';
  picker.classList.remove('tp-out');
}

function pickTool(tool) {
  if (!currentUser) return;

  const picker = document.getElementById('tool-picker');
  const card   = document.getElementById('tp-card-' + tool);
  card.classList.add('tp-card--chosen');

  setTimeout(() => {
    picker.classList.add('tp-out');
    setTimeout(() => {
      picker.style.display = 'none';
      card.classList.remove('tp-card--chosen');

      document.getElementById('app-switcher-bar').style.display = '';
      document.getElementById('sw-vm-user').style.display  = tool === 'vm'  ? '' : 'none';
      document.getElementById('sw-esc-user').style.display = tool === 'esc' ? '' : 'none';

      if (tool === 'vm') {
        document.getElementById('app-vm').style.display = '';
        vmInitWithUser(currentUser);
      } else {
        document.getElementById('app-esc').style.display = '';
        escInitWithUser(currentUser);
      }

      switchApp(tool);
    }, 480);
  }, 160);
}

// ── app switcher bar (VM ↔ ESC) ──────────────────────────────
function switchApp(app) {
  document.getElementById('app-vm').style.display      = app === 'vm'  ? '' : 'none';
  document.getElementById('app-esc').style.display     = app === 'esc' ? '' : 'none';
  document.getElementById('sw-vm').classList.toggle('active',  app === 'vm');
  document.getElementById('sw-esc').classList.toggle('active', app === 'esc');
  document.getElementById('sw-vm-user').style.display  = app === 'vm'  ? '' : 'none';
  document.getElementById('sw-esc-user').style.display = app === 'esc' ? '' : 'none';

  // lazy init — load lang pag first time mapupuntahan
  if (app === 'vm'  && currentUser && document.getElementById('vm-main-app').style.display  === 'none') vmInitWithUser(currentUser);
  if (app === 'esc' && currentUser && document.getElementById('esc-main-app').style.display === 'none') escInitWithUser(currentUser);
}
