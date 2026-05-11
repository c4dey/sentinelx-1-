/* tool picker screen — yung module selection page pagkatapos mag-login */

#tool-picker {
  position: fixed; inset: 0; z-index: 9999;
  background: var(--bg);
  display: flex; align-items: center; justify-content: center;
  transition: opacity .5s ease, transform .5s ease;
}
#tool-picker.tp-out { opacity: 0; transform: scale(1.03); pointer-events: none; }

#tp-canvas {
  position: absolute; inset: 0; width: 100%; height: 100%;
  pointer-events: none;
}

.tp-inner {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  padding: 0 24px; max-width: 960px; width: 100%;
}

.tp-logo img { height: 52px; object-fit: contain; display: block; }

.tp-headline {
  margin-top: 32px;
  font-family: var(--display); font-size: 28px; font-weight: 700;
  color: var(--text); letter-spacing: -.01em; text-align: center;
}

.tp-sub {
  margin-top: 10px; text-align: center;
  font-size: 14px; color: var(--text3); font-family: var(--sans);
  max-width: 480px; line-height: 1.6;
}

/* ── CARDS ─────────────────────────────────────── */
.tp-cards {
  display: grid; grid-template-columns: 1fr 1fr; gap: 20px;
  margin-top: 48px; width: 100%;
}

.tp-card {
  position: relative; border: none; background: none; cursor: pointer;
  border-radius: 20px; overflow: hidden; text-align: left;
  transition: transform .25s cubic-bezier(.34,1.56,.64,1);
}
.tp-card:hover { transform: translateY(-4px); }
.tp-card--chosen { transform: scale(.97); }

.tp-card-glow {
  position: absolute; inset: -1px; border-radius: 20px;
  opacity: 0; transition: opacity .3s; pointer-events: none;
}
.tp-glow-vm  { background: linear-gradient(135deg, rgba(124,58,237,.55), rgba(244,63,122,.3)); }
.tp-glow-esc { background: linear-gradient(135deg, rgba(52,211,153,.35), rgba(124,58,237,.45)); }
.tp-card:hover .tp-card-glow { opacity: 1; }

.tp-card-inner {
  position: relative; z-index: 1;
  background: var(--bg2); border: 1px solid var(--border2);
  border-radius: 20px; padding: 32px 28px 28px;
  transition: border-color .3s;
  display: flex; flex-direction: column; gap: 0;
  min-height: 300px;
}
.tp-card:hover .tp-card-inner { border-color: rgba(176,106,255,.35); }

.tp-card-icon {
  width: 52px; height: 52px; border-radius: 14px;
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 20px; flex-shrink: 0;
}
.tp-card-icon svg { width: 26px; height: 26px; }

#tp-card-vm  .tp-card-icon {
  background: linear-gradient(135deg, rgba(124,58,237,.25), rgba(244,63,122,.2));
  border: 1px solid rgba(124,58,237,.3);
  color: #b06aff;
}
#tp-card-esc .tp-card-icon {
  background: linear-gradient(135deg, rgba(52,211,153,.2), rgba(124,58,237,.2));
  border: 1px solid rgba(52,211,153,.3);
  color: #34d399;
}

.tp-card-label {
  font-family: var(--display); font-size: 18px; font-weight: 700;
  color: var(--text); letter-spacing: -.01em; margin-bottom: 10px;
}

.tp-card-desc {
  font-size: 13px; color: var(--text3); line-height: 1.65;
  font-family: var(--sans); flex: 1;
}

.tp-card-tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 20px; }
.tp-card-tags span {
  font-family: var(--mono); font-size: 10px; letter-spacing: .06em;
  padding: 3px 9px; border-radius: 5px;
  background: var(--bg3); color: var(--text3); border: 1px solid var(--border);
}

.tp-card-arrow {
  position: absolute; bottom: 24px; right: 26px;
  width: 32px; height: 32px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  background: var(--bg3); border: 1px solid var(--border2);
  opacity: 0; transform: translateX(-6px);
  transition: opacity .25s, transform .25s, background .2s;
}
.tp-card-arrow svg { width: 14px; height: 14px; color: var(--text2); }
.tp-card:hover .tp-card-arrow { opacity: 1; transform: translateX(0); }

/* yung colored bar sa baba ng bawat card */
.tp-card-bar {
  position: absolute; bottom: 0; left: 0; right: 0; height: 3px;
  border-radius: 0 0 20px 20px;
  transform: scaleX(0); transform-origin: left;
  transition: transform .35s ease;
}
.tp-bar-vm  { background: linear-gradient(90deg, #7c3aed, #f43f7a); }
.tp-bar-esc { background: linear-gradient(90deg, #34d399, #7c3aed); }
.tp-card:hover .tp-card-bar { transform: scaleX(1); }

.tp-footer {
  margin-top: 40px; font-family: var(--mono); font-size: 11px;
  color: var(--text3); letter-spacing: .04em; text-align: center; opacity: .6;
}
