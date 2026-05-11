'use strict';

// iOS-style date picker — para sa VM period selection
(function () {
  const MONTHS  = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const YEARS   = (() => { const a = []; for (let y = 2020; y <= 2031; y++) a.push(String(y)); return a; })();
  const ITEM_H  = 44;

  let mIdx = new Date().getMonth();
  let yIdx = YEARS.indexOf(String(new Date().getFullYear()));
  if (yIdx < 0) yIdx = 1;

  // ── column builder ─────────────────────────────────────────
  function buildCol(scrollEl, items, selectedIdx) {
    scrollEl.innerHTML = '';
    items.forEach((v, i) => {
      const d = document.createElement('div');
      d.className   = 'drum-item';
      d.textContent = v;
      d.dataset.idx = i;
      scrollEl.appendChild(d);
    });
    setScroll(scrollEl, selectedIdx, false);
  }

  function setScroll(scrollEl, idx, animate) {
    if (!animate) scrollEl.style.transition = 'none';
    scrollEl.style.transform = `translateY(${-idx * ITEM_H}px)`;
    if (!animate) requestAnimationFrame(() => { scrollEl.style.transition = ''; });
    updateHighlight(scrollEl, idx);
  }

  function updateHighlight(scrollEl, idx) {
    scrollEl.querySelectorAll('.drum-item').forEach((el, i) => {
      el.classList.remove('selected', 'near');
      if (i === idx)              el.classList.add('selected');
      else if (Math.abs(i - idx) === 1) el.classList.add('near');
    });
  }

  // ── drag / momentum logic ───────────────────────────────────
  // mala IOS ang gusto ko kaya ganyan
  function addDrag(scrollEl, items, getIdx, setIdx) {
    let startY = 0, startTranslate = 0, isDragging = false;
    let velocity = 0, lastY = 0, lastT = 0, animId = null;

    function getTranslate() { return -getIdx() * ITEM_H; }
    function clamp(idx)     { return Math.max(0, Math.min(items.length - 1, idx)); }

    function onStart(y) {
      isDragging = true; startY = y; lastY = y; lastT = Date.now(); velocity = 0;
      const m = new DOMMatrix(getComputedStyle(scrollEl).transform);
      startTranslate = m.m42 || 0;
      if (animId) { cancelAnimationFrame(animId); animId = null; }
      scrollEl.style.transition = 'none';
    }

    function onMove(y) {
      if (!isDragging) return;
      const now = Date.now(), dt = now - lastT || 1;
      velocity = (y - lastY) / dt; lastY = y; lastT = now;
      const delta = y - startY;
      scrollEl.style.transform = `translateY(${startTranslate + delta}px)`;
      const rawIdx = Math.round(-(startTranslate + delta) / ITEM_H);
      updateHighlight(scrollEl, clamp(rawIdx));
    }

    function onEnd() {
      if (!isDragging) return; isDragging = false;
      const m = new DOMMatrix(getComputedStyle(scrollEl).transform);
      let translate = m.m42 || 0;

      // momentum 
      function momentum() {
        translate += velocity * 16; velocity *= 0.92;
        scrollEl.style.transform = `translateY(${translate}px)`;
        const rawIdx = clamp(Math.round(-translate / ITEM_H));
        updateHighlight(scrollEl, rawIdx);
        if (Math.abs(velocity) > 0.5) { animId = requestAnimationFrame(momentum); }
        else { snap(); }
      }

      // snap sa pinakamalapit na item
      function snap() {
        const rawIdx = clamp(Math.round(-translate / ITEM_H));
        setIdx(rawIdx);
        scrollEl.style.transition = 'transform .18s cubic-bezier(0.25,0.46,0.45,0.94)';
        scrollEl.style.transform  = `translateY(${-rawIdx * ITEM_H}px)`;
        updateHighlight(scrollEl, rawIdx);
      }

      if (Math.abs(velocity) > 0.3) momentum(); else snap();
    }

    // mouse events
    scrollEl.addEventListener('mousedown', e => { e.preventDefault(); onStart(e.clientY); });
    window.addEventListener('mousemove',  e => { if (isDragging) onMove(e.clientY); });
    window.addEventListener('mouseup',    () => { if (isDragging) onEnd(); });

    // touch events para sa mobile
    scrollEl.addEventListener('touchstart', e => { onStart(e.touches[0].clientY); }, { passive: true });
    scrollEl.addEventListener('touchmove',  e => { onMove(e.touches[0].clientY);  }, { passive: true });
    scrollEl.addEventListener('touchend',   () => onEnd());

    // scroll wheel support
    scrollEl.addEventListener('wheel', e => {
      e.preventDefault();
      const dir = e.deltaY > 0 ? 1 : -1;
      setIdx(clamp(getIdx() + dir));
      setScroll(scrollEl, getIdx(), true);
    }, { passive: false });
  }

  // ── public API ──────────────────────────────────────────────
  window.vmOpenDrumPicker = function () {
    const overlay = document.getElementById('vm-drum-overlay');
    overlay.classList.add('open');
    const ms = document.getElementById('drum-month-scroll');
    const ys = document.getElementById('drum-year-scroll');
    buildCol(ms, MONTHS, mIdx);
    buildCol(ys, YEARS,  yIdx);
    addDrag(ms, MONTHS, () => mIdx, i => { mIdx = i; updateHighlight(ms, i); });
    addDrag(ys, YEARS,  () => yIdx, i => { yIdx = i; updateHighlight(ys, i); });
  };

  window.vmCloseDrumPicker = function (e) {
    if (e.target === document.getElementById('vm-drum-overlay')) vmCancelDrumPicker();
  };

  window.vmCancelDrumPicker = function () {
    document.getElementById('vm-drum-overlay').classList.remove('open');
  };

  window.vmConfirmDrumPicker = function () {
    const m = MONTHS[mIdx], y = YEARS[yIdx];
    const mNum = String(MONTHS.indexOf(m) + 1).padStart(2, '0');
    const isoVal = `${y}-${mNum}`;  // e.g. "2026-04"
    document.getElementById('vm-f-period-month').value   = m;
    document.getElementById('vm-f-period-year').value    = y;
    document.getElementById('vm-f-period-iso').value     = isoVal;
    document.getElementById('vm-period-display').textContent = `${m} ${y}`;
    document.getElementById('vm-period-display').style.color = '';
    document.getElementById('vm-drum-overlay').classList.remove('open');
  };

  window.vmDrumReset = function () {
    mIdx = new Date().getMonth();
    yIdx = YEARS.indexOf(String(new Date().getFullYear()));
    if (yIdx < 0) yIdx = 1;
    document.getElementById('vm-f-period-month').value      = '';
    document.getElementById('vm-f-period-year').value       = '';
    document.getElementById('vm-f-period-iso').value        = '';
    document.getElementById('vm-period-display').textContent = 'Pick a period...';
    document.getElementById('vm-period-display').style.color = 'var(--text3)';
  };
})();
