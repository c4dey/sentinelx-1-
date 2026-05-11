/* date picker — parang iOS yung scroll nito kasi gusto ko ganun yung feel */

.drum-picker-trigger {
  display: flex; align-items: center; justify-content: space-between;
  background: var(--bg3); border: 1px solid var(--border);
  border-radius: 8px; padding: 9px 12px; cursor: pointer;
  font-family: var(--mono); font-size: 13px; color: var(--text);
  transition: border-color .2s;
}
.drum-picker-trigger:hover { border-color: var(--accent); }

/* yung dark overlay sa likod ng picker sheet */
.drum-overlay {
  display: none; position: fixed; inset: 0; z-index: 2000;
  background: rgba(0,0,0,0.6); backdrop-filter: blur(4px);
  align-items: flex-end; justify-content: center;
}
.drum-overlay.open { display: flex; }

/* yung sheet mismo — nag-slide up from bottom */
.drum-sheet {
  width: 100%; max-width: 420px; margin: 0 auto;
  background: #1a1f2e; border-radius: 20px 20px 0 0;
  border-top: 1px solid rgba(176,106,255,0.2);
  box-shadow: 0 -20px 60px rgba(0,0,0,0.5);
  animation: drumSlideUp .28s cubic-bezier(0.32,0.72,0,1);
}
@keyframes drumSlideUp {
  from { transform: translateY(100%); }
  to   { transform: translateY(0); }
}

.drum-header {
  display: flex; align-items: center; justify-content: space-between;
  padding: 14px 20px 10px; border-bottom: 1px solid rgba(255,255,255,0.07);
}
.drum-title  { font-family: var(--display); font-size: 14px; font-weight: 600; color: var(--text); }
.drum-cancel { background: none; border: none; cursor: pointer; font-size: 14px; color: var(--text3); padding: 4px 0; }
.drum-cancel:hover { color: var(--text2); }
.drum-done   { background: none; border: none; cursor: pointer; font-size: 14px; font-weight: 600; color: var(--accent); padding: 4px 0; }
.drum-done:hover { color: #d4a8ff; }

/* yung drum body — nandito yung scrollable columns */
.drum-body {
  display: flex; align-items: center; justify-content: center;
  gap: 0; padding: 0 24px 32px; position: relative; height: 220px;
}

.drum-col { flex: 1; height: 100%; overflow: hidden; position: relative; cursor: grab; }
.drum-col:active { cursor: grabbing; }

.drum-scroll {
  display: flex; flex-direction: column; align-items: center;
  transition: transform .12s cubic-bezier(0.25,0.46,0.45,0.94);
  will-change: transform;
  padding: 88px 0; /* para centered yung first at last item */
}

.drum-item {
  height: 44px; display: flex; align-items: center; justify-content: center;
  font-family: var(--mono); font-size: 18px; font-weight: 500;
  color: rgba(255,255,255,0.25); width: 100%; user-select: none;
  transition: color .15s, font-size .15s, font-weight .15s;
  flex-shrink: 0;
}
.drum-item.selected { color: var(--text); font-size: 20px; font-weight: 700; }
.drum-item.near { color: rgba(255,255,255,0.55); font-size: 17px; }

/* separator sa pagitan ng month at year */
.drum-sep { font-family: var(--mono); font-size: 22px; color: var(--text3); padding: 0 8px; flex-shrink: 0; }

/* yung highlight strip para makita yung selected */
.drum-selector {
  position: absolute; left: 24px; right: 24px;
  top: 50%; transform: translateY(-50%);
  height: 44px; border-top: 1px solid rgba(176,106,255,0.35);
  border-bottom: 1px solid rgba(176,106,255,0.35);
  border-radius: 8px; background: rgba(176,106,255,0.07);
  pointer-events: none;
}
