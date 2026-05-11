/* main layout — app switcher, sidebar, header, tabs, content */

/* yung sticky nav bar sa pinaka taas — logo, VM/ESC switcher, user avatar */
.app-switcher {
  position: sticky; top: 0; z-index: 200;
  background: rgba(9,7,15,0.97); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border2);
  display: grid; grid-template-columns: auto 1fr auto; align-items: center;
  padding: 0 36px; height: 72px;
  box-shadow: 0 0 0 1px rgba(176,106,255,0.06), 0 4px 24px rgba(0,0,0,0.4);
}
.app-switcher::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(176,106,255,0.4), transparent);
  pointer-events: none;
}

.switcher-logo  { display:flex; align-items:center; flex-shrink:0; }
.switcher-user  { display:flex; align-items:center; flex-shrink:0; }

/* yung pill container ng VM at ESC buttons sa gitna ng nav */
.switcher-pills {
  display: flex; align-items: center; justify-content: center; gap: 4px;
  background: rgba(255,255,255,0.04); border: 1px solid var(--border2);
  border-radius: 12px; padding: 5px; margin: 0 auto; width: fit-content;
}

.switch-btn {
  font-family: var(--display); font-size: 12px; font-weight: 500;
  padding: 8px 18px; border-radius: 9px; cursor: pointer; letter-spacing: .02em;
  border: 1px solid transparent; background: transparent;
  color: var(--text3); transition: all .2s; white-space: nowrap;
  display: flex; align-items: center; gap: 8px;
}
.switch-btn svg { flex-shrink:0; opacity:0.7; transition: opacity .2s; }
.switch-btn:hover { color: var(--text2); background: rgba(255,255,255,0.06); }
.switch-btn:hover svg { opacity:1; }
/* yung glowing active state ng switch button */
.switch-btn.active {
  background: linear-gradient(135deg, rgba(124,58,237,0.55), rgba(176,106,255,0.40));
  border-color: rgba(176,106,255,0.75);
  color: #d4a8ff;
  box-shadow: 0 0 18px rgba(176,106,255,0.45), inset 0 0 12px rgba(176,106,255,0.12);
  text-shadow: 0 0 12px rgba(176,106,255,0.6);
  font-weight: 600;
}
.switch-btn.active svg { opacity:1; }
.switch-divider { display:none; }

/* yung secondary header na nasa loob ng bawat app — hindi na to ginagamit pero nandito pa rin */
.header {
  background: rgba(14,17,23,0.95); backdrop-filter: blur(12px);
  border-bottom: 1px solid var(--border);
  padding: 0 28px; display: flex; align-items: center;
  justify-content: space-between; height: 58px;
  position: sticky; top: 48px; z-index: 100;
}
.header::after {
  content: ''; position: absolute; bottom: 0; left: 0; right: 0; height: 1px;
  background: linear-gradient(90deg, transparent, rgba(176,106,255,0.4), transparent);
}
.header-left    { display: flex; align-items: center; gap: 16px; }
.header-actions { display: flex; gap: 8px; align-items: center; }

.logo {
  font-family: var(--display); font-size: 15px; font-weight: 700;
  background: linear-gradient(135deg, #b06aff 0%, #f43f7a 100%);
  -webkit-background-clip: text; -webkit-text-fill-color: transparent;
  background-clip: text; letter-spacing: -0.3px;
}

/* yung tabs sa baba ng app switcher — Dashboard, Vulnerabilities, etc */
.tabs {
  display: flex; align-items: center; border-bottom: 1px solid var(--border);
  background: var(--bg2); padding: 0 24px;
  position: sticky; top: 0; z-index: 90; gap: 0;
}
.tab {
  padding: 13px 18px; font-size: 13px; cursor: pointer; color: var(--text2);
  border-bottom: 2px solid transparent; transition: all .15s; margin-bottom: -1px;
  font-family: var(--display); font-weight: 500; letter-spacing: .01em; white-space: nowrap;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--accent); border-bottom-color: var(--accent); }
.tabs-actions {
  margin-left: auto; display: flex; align-items: center; gap: 8px; padding: 6px 0 6px 16px;
}

/* yung main app layout — sidebar sa kaliwa, content sa kanan */
.app { display: flex; height: calc(100vh - 56px); }

.sidebar {
  width: 224px; background: var(--bg2); border-right: 1px solid var(--border);
  display: flex; flex-direction: column; flex-shrink: 0; overflow-y: auto;
}
.sidebar-section {
  padding: 18px 14px 7px;
  font-family: var(--mono); font-size: 9px; color: var(--text3);
  letter-spacing: .1em; text-transform: uppercase;
}
.sidebar-section-hint { font-size: 9px; color: var(--text3); font-family: var(--mono); letter-spacing: .04em; margin-top: 1px; }

/* bawat clickable item sa sidebar — may active indicator na purple bar sa kaliwa */
.sidebar-item {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 14px; cursor: pointer; border-radius: 6px;
  margin: 1px 8px; transition: all .12s; position: relative;
  border: 1px solid transparent;
}
.sidebar-item:hover { background: var(--bg3); }
.sidebar-item.active {
  background: rgba(176,106,255,0.08);
  border-color: rgba(176,106,255,0.15);
}
.sidebar-item.active::before {
  content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 16px; background: var(--accent); border-radius: 0 2px 2px 0;
}
.sidebar-item.active .sidebar-item-name { color: var(--accent); font-weight: 500; }
.sidebar-item-name { font-size: 13px; display: flex; align-items: center; gap: 8px; color: var(--text2); }
.sidebar-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; display: inline-block; }

/* yung count badges sa sidebar — colored per severity */
.sidebar-badge {
  font-family: var(--mono); font-size: 10px; padding: 1px 7px;
  border-radius: 10px; font-weight: 600;
}
.badge-c { background: var(--critical-bg); color: var(--critical); border: 1px solid rgba(244,63,122,0.25); }
.badge-h { background: var(--high-bg);     color: var(--high);     border: 1px solid rgba(249,115,22,0.25); }
.badge-m { background: var(--medium-bg);   color: var(--medium);   border: 1px solid rgba(167,139,250,0.25); }
.badge-l { background: var(--low-bg);      color: var(--low);      border: 1px solid rgba(52,211,153,0.25); }
.badge-y { background: var(--yellow-bg);   color: var(--yellow);   border: 1px solid rgba(250,204,80,0.25); }

#sidebar-status-all .sidebar-badge {
  background: rgba(176,106,255,0.1);
  color: var(--accent);
  border: 1px solid rgba(176,106,255,0.2);
}

/* yung month/period items sa sidebar — slightly different sa normal sidebar-item */
.sidebar-month {
  display: flex; align-items: center; justify-content: space-between;
  padding: 7px 14px; cursor: pointer; border-radius: 6px; margin: 1px 8px;
  font-size: 13px; color: var(--text2); transition: all .12s;
  border: 1px solid transparent; position: relative;
}
.sidebar-month:hover { background: var(--bg3); }
.sidebar-month.active {
  color: var(--accent); background: rgba(176,106,255,0.06);
  font-weight: 500; border-color: rgba(176,106,255,0.15);
}
.sidebar-month.active::before {
  content: ''; position: absolute; left: -8px; top: 50%; transform: translateY(-50%);
  width: 3px; height: 16px; background: var(--accent); border-radius: 0 2px 2px 0;
}

.main { flex: 1; overflow: auto; }

.content { padding: 24px 28px; }

/* yung user avatar sa kanan ng nav — pag click nagbubukas ng dropdown */
.user-avatar {
  width: 40px; height: 40px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 13px; font-weight: 700; cursor: pointer; position: relative;
  font-family: var(--display);
}
.user-menu {
  position: absolute; top: 52px; right: 0;
  background: var(--bg2); border: 1px solid var(--border2);
  border-radius: 10px; width: 230px; z-index: 200; overflow: hidden;
  box-shadow: 0 12px 36px rgba(0,0,0,.6), 0 0 0 1px rgba(176,106,255,0.08);
  display: none;
}
.user-menu.open { display: block; }
.user-menu-header { padding: 13px 15px; border-bottom: 1px solid var(--border); }
.user-menu-name  { font-size: 13px; font-weight: 600; font-family: var(--display); }
.user-menu-email { font-size: 11px; color: var(--text3); margin-top: 2px; }
.user-menu-item {
  padding: 10px 15px; font-size: 13px; cursor: pointer; color: var(--text2);
  transition: background .1s; display: flex; align-items: center; gap: 8px;
}
.user-menu-item:hover { background: var(--bg3); color: var(--text); }
.user-menu-item.danger { color: var(--critical); }
.user-menu-item.danger:hover { background: rgba(244,63,122,0.07); }

/* yung user management grid sa users tab — card per user */
.users-grid {
  display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
  gap: 12px; margin-top: 16px;
}
.user-card {
  background: var(--bg2); border: 1px solid var(--border); border-radius: 12px;
  padding: 16px 18px; display: flex; align-items: center; gap: 14px; transition: border-color .15s;
}
.user-card:hover { border-color: var(--border2); }
.user-card-avatar {
  width: 44px; height: 44px; border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-size: 15px; font-weight: 700; flex-shrink: 0; font-family: var(--display);
}
.user-card-info   { flex: 1; }
.user-card-name   { font-size: 14px; font-weight: 600; font-family: var(--display); }
.user-card-email  { font-size: 12px; color: var(--text3); margin-top: 2px; }
.user-card-actions { display: flex; gap: 6px; }
