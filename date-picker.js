<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SentinelX — Security Platform</title>

  <!-- fonts -->
  <link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@300;400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap" rel="stylesheet">

  <!-- styles — order matters, variables first -->
  <link rel="stylesheet" href="css/variables.css">
  <link rel="stylesheet" href="css/auth.css">
  <link rel="stylesheet" href="css/layout.css">
  <link rel="stylesheet" href="css/components.css">
  <link rel="stylesheet" href="css/tool-picker.css">
  <link rel="stylesheet" href="css/date-picker.css">

  <!-- xlsx lib para sa import/export -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js"></script>
  <!-- Print / PDF styles -->
  <style>
    @media print {
      * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; box-sizing: border-box; }
      html, body { margin: 0 !important; padding: 0 !important; background: #fff !important; color: #111 !important; font-size: 10pt; font-family: Arial, sans-serif; }
      /* Hide everything except the print area */
      body > *:not(#vm-print-area):not(#esc-print-area) { display: none !important; }
      #vm-print-area, #esc-print-area { display: block !important; padding: 0; margin: 0; }
      .print-header { display: block !important; }
      table { width: 100%; border-collapse: collapse; font-size: 9pt; page-break-inside: auto; }
      thead { display: table-header-group; }
      tr { page-break-inside: avoid; }
      th { background: #1a1a2e !important; color: #fff !important; padding: 6px 10px; text-align: left; font-size: 8pt; letter-spacing: .04em; }
      td { border-bottom: 1px solid #e5e7eb !important; padding: 5px 10px; vertical-align: middle; }
      tr:nth-child(even) td { background: #f9fafb !important; }
      h2 { font-size: 14pt; margin: 16px 0 4px; color: #111; }
      @page { margin: 1.5cm; size: A4 portrait; }
    }
    #vm-print-area, #esc-print-area { display: none; }
    .print-header { display: none; }
  </style>
</head>
<body>

<!-- ═══════════════════════════════════════════════════════
     LOGIN SCREEN
════════════════════════════════════════════════════════ -->
<div id="auth-screen">
  <div class="auth-card">
    <div style="text-align:center;margin-bottom:-18px;position:relative;z-index:1">
      <img src="logo.png" alt="SentinelX" style="width:420px;object-fit:contain;display:inline-block"/>
    </div>
    <div class="auth-tagline" style="text-align:center;margin-top:9;margin-bottom:8px">One Platform. Every Protection.</div>
    
    <!-- Sign In -->
    <div class="auth-box" id="si-box">
      <div class="auth-title">Sign in</div>
      <div class="auth-sub">Enter your credentials to access the platform</div>
      <div class="auth-error" id="si-error"></div>
      <div class="auth-field">
        <label class="auth-label">Email</label>
        <input class="auth-input" id="si-email" type="email" placeholder="you@company.com" />
      </div>
      <div class="auth-field">
        <label class="auth-label">Password</label>
        <input class="auth-input" id="si-pass" type="password" placeholder="••••••••" onkeydown="if(event.key==='Enter')unifiedSignIn()" />
      </div>
      <button class="auth-btn auth-submit-btn" onclick="unifiedSignIn()">Sign in</button>
      <div class="auth-switch">Don't have an account? <a onclick="toggleAuth('signup')">Create one</a></div>
      <div class="auth-divider"><hr/><span>or try a demo account</span><hr/></div>
      <div class="demo-accounts">
        <div class="demo-btn" onclick="unifiedQuickLogin('admin@sentinelx.com','admin123')">
          <div><div class="demo-btn-name">Admin User</div><div style="font-size:11px;color:#545d68;margin-top:2px">admin@sentinelx.com</div></div>
          <span class="demo-btn-role role-admin">Admin</span>
        </div>
        <div class="demo-btn" onclick="unifiedQuickLogin('analyst@sentinelx.com','analyst123')">
          <div><div class="demo-btn-name">Security Analyst</div><div style="font-size:11px;color:#545d68;margin-top:2px">analyst@sentinelx.com</div></div>
          <span class="demo-btn-role role-analyst">Analyst</span>
        </div>
        <div class="demo-btn" onclick="unifiedQuickLogin('viewer@sentinelx.com','viewer123')">
          <div><div class="demo-btn-name">Read-only Viewer</div><div style="font-size:11px;color:#545d68;margin-top:2px">viewer@sentinelx.com</div></div>
          <span class="demo-btn-role role-viewer">Viewer</span>
        </div>
      </div>
    </div>

    <!-- Sign Up -->
    <div class="auth-box" id="su-box" style="display:none">
      <div class="auth-title">Create account</div>
      <div class="auth-sub">Register a new user for your organization</div>
      <div class="auth-error" id="su-error"></div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        <div class="auth-field"><label class="auth-label">First name</label><input class="auth-input" id="su-first" placeholder="Juan" /></div>
        <div class="auth-field"><label class="auth-label">Last name</label><input class="auth-input" id="su-last" placeholder="dela Cruz" /></div>
      </div>
      <div class="auth-field"><label class="auth-label">Email</label><input class="auth-input" id="su-email" type="email" placeholder="you@company.com" /></div>
      <div class="auth-field"><label class="auth-label">Password</label><input class="auth-input" id="su-pass" type="password" placeholder="Min. 6 characters" /></div>
      <div class="auth-field"><label class="auth-label">Role</label>
        <select class="auth-input" id="su-role">
          <option value="Analyst">Security Analyst</option>
          <option value="Viewer">Viewer (read-only)</option>
          <option value="Admin">Admin</option>
        </select>
      </div>
      <button class="auth-btn auth-submit-btn" onclick="unifiedSignUp()">Create account</button>
      <div class="auth-switch">Already have an account? <a onclick="toggleAuth('signin')">Sign in</a></div>
    </div>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════
     TOOL PICKER (module selection page)
════════════════════════════════════════════════════════ -->
<div id="tool-picker" style="display:none">
  <canvas id="tp-canvas"></canvas>
  <div class="tp-inner">
    <div class="tp-headline">Select a module to continue</div>
    <div class="tp-sub">Choose the security platform you want to access. You can switch at any time.</div>
    <div class="tp-cards">

      <button class="tp-card" id="tp-card-vm" onclick="pickTool('vm')">
        <div class="tp-card-glow tp-glow-vm"></div>
        <div class="tp-card-inner">
          <div class="tp-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              <path d="M9 12l2 2 4-4" stroke-width="1.5"/>
            </svg>
          </div>
          <div class="tp-card-label">Vulnerability Management</div>
          <div class="tp-card-desc">Track, triage, and remediate security vulnerabilities across your asset inventory with real-time severity scoring.</div>
          <div class="tp-card-tags">
            <span>CVE Tracking</span><span>Severity Matrix</span><span>Asset Coverage</span>
          </div>
          <div class="tp-card-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </div>
        <div class="tp-card-bar tp-bar-vm"></div>
      </button>

      <button class="tp-card" id="tp-card-esc" onclick="pickTool('esc')">
        <div class="tp-card-glow tp-glow-esc"></div>
        <div class="tp-card-inner">
          <div class="tp-card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
              <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              <circle cx="12" cy="16" r="1" fill="currentColor"/>
            </svg>
          </div>
          <div class="tp-card-label">Endpoint Compliance</div>
          <div class="tp-card-desc">Monitor endpoint health, enforce compliance policies, and maintain full visibility over your device fleet.</div>
          <div class="tp-card-tags">
            <span>Patch Status</span><span>Policy Enforcement</span><span>Fleet Health</span>
          </div>
          <div class="tp-card-arrow">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
          </div>
        </div>
        <div class="tp-card-bar tp-bar-esc"></div>
      </button>

    </div>
    <div class="tp-footer">SentinelX &nbsp;·&nbsp; One Platform. Every Protection.</div>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════
     APP SWITCHER BAR (top nav after login)
════════════════════════════════════════════════════════ -->
<div class="app-switcher" id="app-switcher-bar" style="display:none">
  <div class="switcher-logo"><img src="logo.png" alt="SentinelX" style="height:48px;object-fit:contain"/></div>
  <div class="switcher-pills">
    <button class="switch-btn active" id="sw-vm" onclick="switchApp('vm')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
      Vulnerability Management
    </button>
    <button class="switch-btn" id="sw-esc" onclick="switchApp('esc')">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
      Endpoint Compliance
    </button>
  </div>
  <div style="display:flex;align-items:center;gap:10px">
    <span id="sx-mode-badge" style="display:none;font-family:var(--mono);font-size:10px;padding:3px 10px;border-radius:20px;background:rgba(255,255,255,0.06);color:var(--text2);border:1px solid var(--border);cursor:default"></span>
    <div class="switcher-user">
    <div id="sw-vm-user" style="position:relative">
      <div class="user-avatar" id="vm-user-avatar-btn" onclick="vmToggleUserMenu()"></div>
      <div class="user-menu" id="vm-user-menu">
        <div class="user-menu-header">
          <div class="user-menu-name"  id="vm-menu-name"></div>
          <div class="user-menu-email" id="vm-menu-email"></div>
          <div style="margin-top:6px"  id="vm-menu-role-badge"></div>
        </div>
        <div class="user-menu-item" id="vm-manage-users-item" onclick="vmSwitchTabById('users');vmToggleUserMenu()">Manage users</div>
        <div class="user-menu-item danger" onclick="vmDoSignOut()">Sign out</div>
      </div>
    </div>
    <div id="sw-esc-user" style="position:relative;display:none">
      <div class="user-avatar" id="esc-user-avatar-btn" onclick="escToggleUserMenu()"></div>
      <div class="user-menu" id="esc-user-menu">
        <div class="user-menu-header">
          <div class="user-menu-name"  id="esc-menu-name"></div>
          <div class="user-menu-email" id="esc-menu-email"></div>
          <div style="margin-top:6px"  id="esc-menu-role-badge"></div>
        </div>
        <div class="user-menu-item" id="esc-manage-users-item" onclick="escSwitchTabById('users');escToggleUserMenu()">Manage users</div>
        <div class="user-menu-item danger" onclick="escDoSignOut()">Sign out</div>
      </div>
    </div>
  </div>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════
     VM APP — Vulnerability Management
════════════════════════════════════════════════════════ -->
<div id="app-vm" style="display:none">
  <div class="app" id="vm-main-app" style="display:none">

    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-section">Assets</div>
      <div id="vm-asset-list"></div>
      <div class="sidebar-section" style="margin-top:8px">Severity</div>
      <div class="sidebar-item active" onclick="vmSidebarFilterSeverity('all',this)" id="vm-sidebar-sev-all">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--accent);opacity:0.5"></span>All</div>
        <span class="sidebar-badge" id="vm-count-all" style="background:var(--bg3);color:var(--text2);border:1px solid var(--border)">0</span>
      </div>
      <div class="sidebar-item" onclick="vmSidebarFilterSeverity('Critical',this)" id="vm-sidebar-sev-critical">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--critical)"></span>Critical</div>
        <span class="sidebar-badge badge-c" id="vm-count-critical">0</span>
      </div>
      <div class="sidebar-item" onclick="vmSidebarFilterSeverity('High',this)" id="vm-sidebar-sev-high">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--high)"></span>High</div>
        <span class="sidebar-badge badge-h" id="vm-count-high">0</span>
      </div>
      <div class="sidebar-item" onclick="vmSidebarFilterSeverity('Medium',this)" id="vm-sidebar-sev-medium">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--medium)"></span>Medium</div>
        <span class="sidebar-badge badge-m" id="vm-count-medium">0</span>
      </div>
      <div class="sidebar-item" onclick="vmSidebarFilterSeverity('Low',this)" id="vm-sidebar-sev-low">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--low)"></span>Low</div>
        <span class="sidebar-badge badge-l" id="vm-count-low">0</span>
      </div>
      <div class="sidebar-section" style="margin-top:8px">Period</div>
      <div id="vm-month-sidebar"></div>
    </div>

    <!-- Main content -->
    <div class="main">
      <div class="tabs">
        <div class="tab active" id="vm-tab-btn-dashboard"       onclick="vmSwitchTab('dashboard',this)">Dashboard</div>
        <div class="tab"        id="vm-tab-btn-vulnerabilities" onclick="vmSwitchTab('vulnerabilities',this)">Vulnerabilities</div>
        <div class="tab"        id="vm-tab-btn-matrix"          onclick="vmSwitchTab('matrix',this)">Asset Matrix</div>
        <div class="tab"        id="vm-tab-btn-compare"         onclick="vmSwitchTab('compare',this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          Compare Reports
        </div>
        <div class="tab"        id="vm-tab-btn-import"          onclick="vmSwitchTab('import',this)">Import / Export</div>
        <div class="tab"        id="vm-tab-btn-users"           onclick="vmSwitchTab('users',this)" style="display:none">Users</div>
        <div class="tabs-actions">
          <button class="btn btn-sm btn-export" onclick="vmOpenExportModal()" style="display:flex;align-items:center;gap:6px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button class="btn btn-primary btn-sm" id="vm-add-vuln-btn" onclick="vmOpenModal('vuln')">+ Add Vulnerability</button>
        </div>
      </div>

      <!-- Dashboard tab -->
      <div id="vm-tab-dashboard" class="content">
        <div class="summary-grid">
          <div class="summary-card card-c"><div class="summary-label">Critical</div><div class="summary-val c" id="vm-dash-critical">0</div><div class="summary-sub">Active critical vulns</div><div class="summary-icon"><span class="summary-orb" style="background:var(--critical)"></span></div></div>
          <div class="summary-card card-h"><div class="summary-label">High</div><div class="summary-val h" id="vm-dash-high">0</div><div class="summary-sub">High severity issues</div><div class="summary-icon"><span class="summary-orb" style="background:var(--high)"></span></div></div>
          <div class="summary-card card-m"><div class="summary-label">Medium</div><div class="summary-val m" id="vm-dash-medium">0</div><div class="summary-sub">Medium severity issues</div><div class="summary-icon"><span class="summary-orb" style="background:var(--medium)"></span></div></div>
          <div class="summary-card card-l"><div class="summary-label">Low</div><div class="summary-val l" id="vm-dash-low">0</div><div class="summary-sub">Low severity issues</div><div class="summary-icon"><span class="summary-orb" style="background:var(--low)"></span></div></div>
        </div>
        <div class="dash-row">
          <div class="dash-panel">
            <div class="dash-panel-title">Vulnerabilities by Severity <span>All data · all periods</span></div>
            <canvas id="vm-vuln-chart"></canvas>
          </div>
          <div class="dash-panel">
            <div class="dash-panel-title">Status Breakdown <span>Current totals</span></div>
            <div class="status-rows" id="vm-status-breakdown"></div>
          </div>
        </div>
        <div class="dash-panel">
          <div class="dash-panel-title">Top Assets by Vulnerability Count <span>Sorted by total count</span></div>
          <div id="vm-top-assets-list"></div>
        </div>
      </div>

      <!-- Vulnerabilities tab -->
      <div id="vm-tab-vulnerabilities" class="content" style="display:none">
        <div id="vm-month-pills" class="month-bar"></div>
        <div class="toolbar">
          <div class="toolbar-left">
            <input class="search-input" placeholder="Search vulnerabilities..." oninput="vmFilterTable(this.value)" />
            <select class="filter" onchange="vmFilterStatus(this.value)">
              <option value="all">All statuses</option><option>Open</option><option>In Progress</option><option>Resolved</option>
            </select>
          </div>
          <button class="btn btn-primary btn-sm" onclick="vmOpenModal('vuln')">+ Add Vulnerability</button>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr>
              <th>CVSS ID</th><th>Vulnerability</th><th>Asset</th><th>Severity</th>
              <th>Status</th><th>Ticket</th><th>Evidence</th><th>Comments</th><th>Period</th><th>Actions</th>
            </tr></thead>
            <tbody id="vm-vuln-tbody"></tbody>
          </table>
        </div>
      </div>

      <!-- Matrix tab -->
      <div id="vm-tab-matrix" class="content" style="display:none">
        <div style="font-size:15px;font-weight:500;margin-bottom:16px">Asset × CVSS Matrix</div>
        <div class="matrix-wrap" id="vm-matrix-container"></div>
      </div>

      <!-- Compare Reports tab -->
      <div id="vm-tab-compare" class="content" style="display:none">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px">
          <div>
            <div style="font-size:15px;font-weight:600;margin-bottom:4px">Compare Reports</div>
            <div style="font-size:12px;color:var(--text3)">Select two reporting periods to see exactly what changed between uploads.</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)">Previous Period</label>
              <select id="vm-cmp-sel-a" class="form-input" onchange="vmRunCompare()" style="min-width:160px"></select>
            </div>
            <div style="color:var(--text3);font-size:18px;margin-top:18px">→</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)">Current Period</label>
              <select id="vm-cmp-sel-b" class="form-input" onchange="vmRunCompare()" style="min-width:160px"></select>
            </div>
          </div>
        </div>
        <div id="vm-cmp-results"></div>
      </div>

      <!-- Import/Export tab -->
      <div id="vm-tab-import" class="content" style="display:none">
        <div style="font-size:15px;font-weight:500;margin-bottom:6px">Import / Export</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:24px">Upload an Excel or CSV file to bulk-import vulnerability records.</div>
        <div class="upload-zone" id="vm-drop-zone" onclick="document.getElementById('vm-file-input').click()" ondragover="vmDragOver(event)" ondragleave="vmDragLeave(event)" ondrop="vmDropFile(event)">
          <div class="upload-zone-icon">📂</div>
          <div class="upload-zone-title">Drop your Excel file here</div>
          <div class="upload-zone-sub">or click to browse — imports assets, CVSSs, severity and comments</div>
          <div class="upload-zone-formats"><span class="format-tag">.xlsx</span><span class="format-tag">.xls</span><span class="format-tag">.csv</span></div>
        </div>
        <input type="file" id="vm-file-input" accept=".xlsx,.xls,.csv" style="display:none" onchange="vmHandleFileInput(this)" />
        <div id="vm-import-preview" style="display:none">
          <div style="font-size:14px;font-weight:500;margin-bottom:12px;color:var(--green)">Preview — <span id="vm-preview-count"></span> rows detected</div>
          <div class="table-wrap"><table><thead><tr id="vm-preview-header"></tr></thead><tbody id="vm-preview-body"></tbody></table></div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-primary" onclick="vmConfirmImport()">Import all rows</button>
            <button class="btn" onclick="vmCancelImport()">Cancel</button>
          </div>
        </div>
        <div style="margin-top:32px;font-size:15px;font-weight:500;margin-bottom:16px">Expected Excel format</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>CVSS ID</th><th>Vulnerability Name</th><th>Asset</th><th>Severity</th><th>Status</th><th>Internal Ticket</th><th>Comments</th><th>Period</th></tr></thead>
            <tbody>
              <tr>
                <td class="cvss-id">CVSS 1</td><td style="color:var(--text2)">SQL Injection</td><td style="color:var(--text2)">PLMWeb1</td>
                <td><span class="sev-badge sev-high">High</span></td><td style="color:var(--text2)">Open</td>
                <td style="color:var(--accent);font-family:var(--mono);font-size:12px">INC-001</td>
                <td style="color:var(--text2)">Awaiting patch</td><td style="color:var(--text2);font-family:var(--mono);font-size:12px">Jan-26</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Users tab (admin only) -->
      <div id="vm-tab-users" class="content" style="display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div><div style="font-size:15px;font-weight:500">User management</div><div style="font-size:12px;color:var(--text3);margin-top:3px">Manage who has access to VM Monitor</div></div>
          <button class="btn btn-primary btn-sm" onclick="vmOpenModal('user')">+ Add user</button>
        </div>
        <div class="users-grid" id="vm-users-grid"></div>
      </div>
    </div>
  </div>

  <!-- VM Add Vulnerability Modal -->
  <div class="modal-overlay" id="vm-modal">
    <div class="modal">
      <div class="modal-title" id="vm-modal-title">Add vulnerability entry</div>
      <div id="vm-modal-vuln-body">
        <div class="form-grid">
          <div class="form-group"><label class="form-label">CVSS ID</label><input class="form-input" id="vm-f-id" placeholder="e.g. CVSS 17" /></div>
          <div class="form-group"><label class="form-label">Asset</label><input class="form-input" id="vm-f-asset" placeholder="e.g. PLMWeb1" /></div>
          <div class="form-group full"><label class="form-label">Vulnerability Name</label><input class="form-input" id="vm-f-name" placeholder="e.g. Unpatched OpenSSL RCE" /></div>
          <div class="form-group">
            <label class="form-label">Severity</label>
            <select class="form-input" id="vm-f-severity"><option>Critical</option><option>High</option><option selected>Medium</option><option>Low</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" id="vm-f-status"><option>Open</option><option>In Progress</option><option>Resolved</option></select>
          </div>
          <div class="form-group"><label class="form-label">Internal Ticket</label><input class="form-input" id="vm-f-ticket" placeholder="e.g. INC-042" /></div>
          <div class="form-group">
            <label class="form-label">Period</label>
            <div class="drum-picker-trigger" id="vm-period-trigger" onclick="vmOpenDrumPicker()">
              <span id="vm-period-display" style="color:var(--text3)">Pick a period...</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0;opacity:0.4"><polyline points="6 9 12 15 18 9"/></svg>
            </div>
            <!-- hidden values — binabasa ng JS -->
            <input type="hidden" id="vm-f-period-month" />
            <input type="hidden" id="vm-f-period-year" />
            <input type="hidden" id="vm-f-period-iso" />
          </div>
          <div class="form-group full"><label class="form-label">Comments</label><input class="form-input" id="vm-f-comment" placeholder="Add notes or remediation steps..." /></div>
        </div>
      </div>
      <div id="vm-modal-user-body" style="display:none">
        <div class="form-grid">
          <div class="form-group"><label class="form-label">First name</label><input class="form-input" id="vm-mu-first" placeholder="Juan" /></div>
          <div class="form-group"><label class="form-label">Last name</label><input class="form-input" id="vm-mu-last" placeholder="dela Cruz" /></div>
          <div class="form-group full"><label class="form-label">Email</label><input class="form-input" id="vm-mu-email" type="email" placeholder="user@company.com" /></div>
          <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="vm-mu-pass" type="password" placeholder="Min. 6 characters" /></div>
          <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="vm-mu-role"><option value="Analyst">Security Analyst</option><option value="Viewer">Viewer (read-only)</option><option value="Admin">Admin</option></select></div>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="vmCloseModal()">Cancel</button>
        <button class="btn btn-primary" id="vm-modal-submit-btn" onclick="vmModalSubmit()">Add entry</button>
      </div>
    </div>
  </div>
</div><!-- end #app-vm -->


<!-- date picker overlay — nasa labas ng modal para hindi matabunan -->
<div class="drum-overlay" id="vm-drum-overlay" onclick="vmCloseDrumPicker(event)">
  <div class="drum-sheet">
    <div class="drum-header">
      <button class="drum-cancel" onclick="vmCancelDrumPicker()">Cancel</button>
      <span class="drum-title">Select Period</span>
      <button class="drum-done" onclick="vmConfirmDrumPicker()">Done</button>
    </div>
    <div class="drum-body">
      <div class="drum-col" id="drum-month-col">
        <div class="drum-scroll" id="drum-month-scroll"></div>
      </div>
      <div class="drum-sep">–</div>
      <div class="drum-col" id="drum-year-col">
        <div class="drum-scroll" id="drum-year-scroll"></div>
      </div>
      <div class="drum-selector"></div>
    </div>
  </div>
</div>


<!-- ═══════════════════════════════════════════════════════
     ESC APP — Endpoint Sensor Compliance
════════════════════════════════════════════════════════ -->
<div id="app-esc" style="display:none">
  <div class="app" id="esc-main-app" style="display:none">

    <!-- Sidebar -->
    <div class="sidebar">
      <div class="sidebar-section">Assets</div>
      <div id="esc-asset-list"></div>
      <div class="sidebar-section" style="margin-top:8px">Status</div>
      <div class="sidebar-item active" onclick="escSidebarFilterStatus('all',this)" id="esc-sidebar-status-all">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--accent);opacity:0.5"></span>All Assets</div>
        <span class="sidebar-badge" id="esc-count-all-assets" style="background:var(--bg3);color:var(--text2);border:1px solid var(--border)">0</span>
      </div>
      <div class="sidebar-item" onclick="escSidebarFilterStatus('updated',this)" id="esc-sidebar-status-updated">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--low)"></span>Updated</div>
        <span class="sidebar-badge badge-l" id="esc-count-updated">0</span>
      </div>
      <div class="sidebar-item" onclick="escSidebarFilterStatus('outdated',this)" id="esc-sidebar-status-outdated">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--critical)"></span>Outdated</div>
        <span class="sidebar-badge badge-c" id="esc-count-outdated">0</span>
      </div>
      <div class="sidebar-section" style="margin-top:8px">Compliance</div>
      <div class="sidebar-item" onclick="escSidebarFilterCompliance('high',this)" id="esc-sidebar-comp-high">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--low)"></span>≥ 80%</div>
        <span class="sidebar-badge badge-l" id="esc-count-comp-high">0</span>
      </div>
      <div class="sidebar-item" onclick="escSidebarFilterCompliance('medium',this)" id="esc-sidebar-comp-medium">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--yellow)"></span>50–79%</div>
        <span class="sidebar-badge badge-y" id="esc-count-comp-medium">0</span>
      </div>
      <div class="sidebar-item" onclick="escSidebarFilterCompliance('low',this)" id="esc-sidebar-comp-low">
        <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--critical)"></span>&lt; 50%</div>
        <span class="sidebar-badge badge-c" id="esc-count-comp-low">0</span>
      </div>
      <div class="sidebar-section" style="margin-top:8px">Period</div>
      <div id="esc-period-sidebar"></div>
    </div>

    <!-- Main content -->
    <div class="main">
      <div class="tabs">
        <div class="tab active" id="esc-tab-btn-dashboard" onclick="escSwitchTab('dashboard',this)">Dashboard</div>
        <div class="tab"        id="esc-tab-btn-assets"    onclick="escSwitchTab('assets',this)">Asset Status</div>
        <div class="tab"        id="esc-tab-btn-outdated"  onclick="escSwitchTab('outdated',this)">Outdated</div>
        <div class="tab"        id="esc-tab-btn-dates"     onclick="escSwitchTab('dates',this)">Date Records</div>
        <div class="tab"        id="esc-tab-btn-compare"   onclick="escSwitchTab('compare',this)">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-right:4px;vertical-align:middle"><path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3"/></svg>
          Compare Reports
        </div>
        <div class="tab"        id="esc-tab-btn-import"    onclick="escSwitchTab('import',this)">Import / Export</div>
        <div class="tab"        id="esc-tab-btn-users"     onclick="escSwitchTab('users',this)" style="display:none">Users</div>
        <div class="tabs-actions">
          <button class="btn btn-sm btn-export" onclick="escOpenExportModal()" style="display:flex;align-items:center;gap:6px">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export
          </button>
          <button class="btn btn-primary btn-sm" onclick="escOpenRecordModal()">+ Add Record</button>
        </div>
      </div>

      <!-- Dashboard tab -->
      <div id="esc-tab-dashboard" class="content">
        <div class="summary-grid">
          <div class="summary-card card-y"><div class="summary-label">Total Endpoints</div><div class="summary-val y" id="esc-stat-total-ep">0</div><div class="summary-sub">Sensors tracked across all assets</div><div class="summary-icon"><span class="summary-orb" style="background:var(--yellow)"></span></div></div>
          <div class="summary-card card-l"><div class="summary-label">Updated</div><div class="summary-val l" id="esc-stat-updated">0</div><div class="summary-sub">Compliant endpoints</div><div class="summary-icon"><span class="summary-orb" style="background:var(--low)"></span></div></div>
          <div class="summary-card card-c"><div class="summary-label">Outdated</div><div class="summary-val c" id="esc-stat-outdated">0</div><div class="summary-sub">Require immediate action</div><div class="summary-icon"><span class="summary-orb" style="background:var(--critical)"></span></div></div>
          <div class="summary-card card-m"><div class="summary-label">Total Servers</div><div class="summary-val m" id="esc-stat-total-srv">0</div><div class="summary-sub">Server assets monitored</div><div class="summary-icon"><span class="summary-orb" style="background:var(--medium)"></span></div></div>
        </div>
        <div class="summary-band">
          <div class="band-item"><div class="band-val" id="esc-band-compliance">0%</div><div class="band-label">Overall Compliance</div></div>
          <div class="band-div"></div>
          <div class="band-item"><div class="band-val" id="esc-band-assets">0</div><div class="band-label">Total Assets</div></div>
          <div class="band-div"></div>
          <div class="band-item"><div class="band-val" id="esc-band-ep">0</div><div class="band-label">Endpoints Sampled</div></div>
          <div class="band-div"></div>
          <div class="band-item"><div class="band-val" id="esc-band-srv">0</div><div class="band-label">Servers Sampled</div></div>
          <div class="band-div"></div>
          <div class="band-item"><div class="band-val" id="esc-band-date" style="font-size:16px">—</div><div class="band-label">Last Record</div></div>
        </div>
        <div class="dash-row">
          <div class="dash-panel">
            <div class="dash-panel-title">Update Distribution <span>By asset · all periods</span></div>
            <div class="bar-chart" id="esc-bar-chart" style="min-height:160px"><div class="empty-row" style="text-align:center;padding:48px;color:var(--text3)">No data yet — add records</div></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;width:340px;flex-shrink:0">
            <div class="dash-panel">
              <div class="dash-panel-title">Compliance Rate <span>Current snapshot</span></div>
              <div style="display:flex;flex-direction:column;align-items:center;gap:14px">
                <svg width="160" height="160" viewBox="0 0 180 180">
                  <circle cx="90" cy="90" r="72" fill="none" stroke="rgba(76,158,255,0.08)" stroke-width="16"/>
                  <circle id="esc-gauge-ring" cx="90" cy="90" r="72" fill="none" stroke="var(--accent)" stroke-width="16" stroke-linecap="round" stroke-dasharray="452" stroke-dashoffset="452" transform="rotate(-90 90 90)" style="transition:stroke-dashoffset 1.2s cubic-bezier(0.34,1.56,0.64,1),stroke 0.5s"/>
                  <text x="90" y="84" text-anchor="middle" class="gauge-pct-label" id="esc-gauge-text">0%</text>
                  <text x="90" y="104" text-anchor="middle" class="gauge-sub-label">ASSETS</text>
                </svg>
                <div id="esc-gauge-sub" style="font-family:var(--mono);font-size:10px;color:var(--text3);text-align:center;margin-top:4px">0 / 0 assets compliant</div>
                <div class="status-rows" style="width:100%">
                  <div>
                    <div class="status-row-label"><span>Updated EP</span><strong id="esc-gauge-updated-pct" style="color:var(--low)">0%</strong></div>
                    <div class="status-bar-bg"><div class="status-bar-fill" id="esc-gauge-bar-updated" style="background:var(--low);width:0%"></div></div>
                  </div>
                  <div>
                    <div class="status-row-label"><span>Outdated EP</span><strong id="esc-gauge-outdated-pct" style="color:var(--critical)">0%</strong></div>
                    <div class="status-bar-bg"><div class="status-bar-fill" id="esc-gauge-bar-outdated" style="background:var(--critical);width:0%"></div></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="dash-panel">
              <div class="dash-panel-title">Remediation Status <span>Current snapshot</span></div>
              <div class="status-rows">
                <div><div class="status-row-label"><span>Compliant</span><strong id="esc-rem-compliant" style="color:var(--low)">0 (0%)</strong></div><div class="status-bar-bg"><div class="status-bar-fill" id="esc-rem-bar-compliant" style="background:var(--low);width:0%"></div></div></div>
                <div><div class="status-row-label"><span>Non-Compliant</span><strong id="esc-rem-noncompliant" style="color:var(--critical)">0 (0%)</strong></div><div class="status-bar-bg"><div class="status-bar-fill" id="esc-rem-bar-noncompliant" style="background:var(--critical);width:0%"></div></div></div>
                <div><div class="status-row-label"><span>Total Assets</span><strong id="esc-rem-total" style="color:var(--accent)">0</strong></div><div class="status-bar-bg"><div class="status-bar-fill" id="esc-rem-bar-total" style="background:var(--accent);width:0%"></div></div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Asset</th><th>Endpoints</th><th>Servers</th><th>Updated EP</th><th>Compliance</th><th>Status</th></tr></thead>
            <tbody id="esc-home-table-body"><tr class="empty-row"><td colspan="6">No assets recorded — add a record to begin</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Asset Status tab -->
      <div id="esc-tab-assets" class="content" style="display:none">
        <div class="toolbar">
          <div class="toolbar-left"><div style="font-size:15px;font-weight:600;font-family:var(--display)">Asset Status</div></div>
          <div style="display:flex;gap:8px">
            <button class="btn" onclick="escFilterAssets('all',this)"      id="esc-pill-all">All</button>
            <button class="btn" onclick="escFilterAssets('updated',this)"  id="esc-pill-updated">Updated</button>
            <button class="btn" onclick="escFilterAssets('outdated',this)" id="esc-pill-outdated">Outdated</button>
          </div>
        </div>
        <div class="dash-row" style="grid-template-columns:1fr 340px">
          <div class="dash-panel" style="padding:0">
            <div class="dash-panel-title" style="padding:16px 20px;border-bottom:1px solid var(--border)">All Assets <span id="esc-asset-count-meta">0 assets</span></div>
            <div id="esc-asset-list-tab"><div class="empty-row" style="text-align:center;padding:48px;color:var(--text3)">No assets recorded</div></div>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;width:340px;flex-shrink:0">
            <div class="dash-panel"><div class="dash-panel-title">Endpoint Compliance <span>Per asset</span></div><div class="status-rows" id="esc-asset-ep-progress"><div style="color:var(--text3);font-size:12px">No data yet</div></div></div>
            <div class="dash-panel"><div class="dash-panel-title">Server Compliance <span>Per asset</span></div><div class="status-rows" id="esc-asset-srv-progress"><div style="color:var(--text3);font-size:12px">No data yet</div></div></div>
          </div>
        </div>
      </div>

      <!-- Outdated tab -->
      <div id="esc-tab-outdated" class="content" style="display:none">
        <div class="toolbar">
          <div class="toolbar-left"><div><div style="font-size:15px;font-weight:600;font-family:var(--display)">Outdated Assets</div><div style="font-size:12px;color:var(--text3);margin-top:2px">Assets requiring sensor updates</div></div></div>
          <div class="month-bar" id="esc-outdated-date-filter">
            <span style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;align-self:center">Filter:</span>
            <span class="month-pill active" onclick="escFilterOutdated('all',this)">All Periods</span>
          </div>
        </div>
        <div class="table-wrap" style="margin-bottom:16px">
          <div style="padding:14px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--bg3)">
            <span style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3)">Outdated Endpoints — Action Required</span>
            <span style="font-family:var(--mono);font-size:11px;color:var(--critical)" id="esc-outdated-count">0 assets</span>
          </div>
          <div id="esc-outdated-alert-list"><div class="empty-row" style="text-align:center;padding:48px;color:var(--text3)">No outdated assets</div></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Asset</th><th>Date</th><th>Outdated EP</th><th>Outdated SRV</th><th>EP Compliance</th><th>SRV Compliance</th><th>Priority</th></tr></thead>
            <tbody id="esc-outdated-table-body"><tr class="empty-row"><td colspan="7">No outdated assets found</td></tr></tbody>
          </table>
        </div>
      </div>

      <!-- Date Records tab -->
      <div id="esc-tab-dates" class="content" style="display:none">
        <div class="toolbar">
          <div class="toolbar-left"><div style="font-size:15px;font-weight:600;font-family:var(--display)">Date Records</div></div>
          <div class="month-bar" id="esc-date-filter-chips">
            <span style="font-family:var(--mono);font-size:10px;color:var(--text3);text-transform:uppercase;letter-spacing:0.08em;align-self:center">Period:</span>
            <span class="month-pill active" onclick="escFilterDates('all',this)">All</span>
          </div>
        </div>
        <div class="dash-row">
          <div class="dash-panel" style="padding:0">
            <div class="dash-panel-title" style="padding:14px 18px;border-bottom:1px solid var(--border)">Record Timeline <span id="esc-dates-count">0 records</span></div>
            <div class="timeline" id="esc-timeline-list" style="padding:8px 0"><div class="empty-row" style="text-align:center;padding:48px;color:var(--text3)">No records found</div></div>
          </div>
          <div class="dash-panel" style="padding:0;width:340px;flex-shrink:0">
            <div class="dash-panel-title" style="padding:14px 18px;border-bottom:1px solid var(--border)">Records by Date</div>
            <div class="table-wrap" style="border:none">
              <table><thead><tr><th>Date</th><th>Asset</th><th>EP %</th><th>SRV %</th></tr></thead><tbody id="esc-dates-table-body"><tr class="empty-row"><td colspan="4">No records yet</td></tr></tbody></table>
            </div>
          </div>
        </div>
      </div>

      <!-- Compare Reports tab -->
      <div id="esc-tab-compare" class="content" style="display:none">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;flex-wrap:wrap;gap:16px;margin-bottom:24px">
          <div>
            <div style="font-size:15px;font-weight:600;margin-bottom:4px">Compare Reports</div>
            <div style="font-size:12px;color:var(--text3)">Select two monthly periods to see compliance changes per asset.</div>
          </div>
          <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap">
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)">Previous Period</label>
              <select id="esc-cmp-sel-a" class="form-input" onchange="escRunCompare()" style="min-width:180px"></select>
            </div>
            <div style="color:var(--text3);font-size:18px;margin-top:18px">→</div>
            <div style="display:flex;flex-direction:column;gap:4px">
              <label style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)">Current Period</label>
              <select id="esc-cmp-sel-b" class="form-input" onchange="escRunCompare()" style="min-width:180px"></select>
            </div>
          </div>
        </div>
        <div id="esc-cmp-results"></div>
      </div>

      <!-- Import/Export tab -->
      <div id="esc-tab-import" class="content" style="display:none">
        <div style="font-size:15px;font-weight:500;margin-bottom:6px">Import / Export</div>
        <div style="font-size:12px;color:var(--text3);margin-bottom:24px">Upload a CSV or Excel file to bulk-import endpoint compliance records.</div>
        <div class="upload-zone" id="esc-drop-zone" onclick="document.getElementById('esc-import-file-input').click()" ondragover="escDragOver(event)" ondragleave="escDragLeave(event)" ondrop="escDropFile(event)">
          <div class="upload-zone-icon">📂</div>
          <div class="upload-zone-title">Drop your file here</div>
          <div class="upload-zone-sub">or click to browse — imports Date, Asset, EP &amp; Server counts</div>
          <div class="upload-zone-formats"><span class="format-tag">.xlsx</span><span class="format-tag">.xls</span><span class="format-tag">.csv</span></div>
        </div>
        <input type="file" id="esc-import-file-input" accept=".xlsx,.xls,.csv" style="display:none" onchange="escHandleFileInput(this)" />
        <div id="esc-import-preview" style="display:none">
          <div style="font-size:14px;font-weight:500;margin-bottom:12px;color:var(--green)">Preview — <span id="esc-preview-count"></span> rows detected</div>
          <div class="table-wrap"><table><thead><tr id="esc-preview-header"></tr></thead><tbody id="esc-preview-body"></tbody></table></div>
          <div style="display:flex;gap:10px;margin-top:16px">
            <button class="btn btn-primary" onclick="escConfirmImport()">Import all rows</button>
            <button class="btn" onclick="escCancelImport()">Cancel</button>
          </div>
        </div>
        <div style="margin-top:32px;font-size:15px;font-weight:500;margin-bottom:16px">Expected format</div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Asset</th><th>Total EP</th><th>Total SRV</th><th>Updated EP</th><th>Updated SRV</th><th>Notes</th></tr></thead>
            <tbody>
              <tr>
                <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">2026-04-01</td>
                <td style="color:var(--text2)">PLMWeb1</td>
                <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">200</td>
                <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">20</td>
                <td style="font-family:var(--mono);font-size:12px;color:var(--low)">180</td>
                <td style="font-family:var(--mono);font-size:12px;color:var(--low)">18</td>
                <td style="color:var(--text2)">Monthly patch applied</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:24px;display:flex;gap:10px;flex-wrap:wrap">
          <button class="btn btn-sm btn-export" onclick="escOpenExportModal()">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
            Export Records
          </button>
        </div>
      </div>

      <!-- Users tab (admin only) -->
      <div id="esc-tab-users" class="content" style="display:none">
        <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">
          <div><div style="font-size:15px;font-weight:500">User management</div><div style="font-size:12px;color:var(--text3);margin-top:3px">Manage who has access to ESC Monitor</div></div>
          <button class="btn btn-primary btn-sm" onclick="escOpenUserModal()">+ Add user</button>
        </div>
        <div class="users-grid" id="esc-users-grid"></div>
      </div>
    </div>
  </div>

  <!-- ESC Edit Record Modal -->
  <div class="modal-overlay" id="esc-edit-modal" onclick="if(event.target===this)escCloseEditModal()">
    <div class="modal-sheet" style="max-width:480px;width:95%">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:18px">
        <div class="modal-title">Edit Record</div>
        <button class="icon-btn" onclick="escCloseEditModal()">✕</button>
      </div>
      <input type="hidden" id="esc-edit-id" />
      <div class="form-row" style="margin-bottom:14px">
        <label class="form-label">Date</label>
        <input type="date" id="esc-edit-date" class="form-input" />
      </div>
      <div class="form-row" style="margin-bottom:14px">
        <label class="form-label">Asset</label>
        <input type="text" id="esc-edit-asset" class="form-input" placeholder="e.g. PLMWeb1" />
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div>
          <label class="form-label">Total EP</label>
          <input type="number" id="esc-edit-total-ep" class="form-input" min="0" />
        </div>
        <div>
          <label class="form-label">Updated EP</label>
          <input type="number" id="esc-edit-updated-ep" class="form-input" min="0" />
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:14px">
        <div>
          <label class="form-label">Total SRV</label>
          <input type="number" id="esc-edit-total-srv" class="form-input" min="0" />
        </div>
        <div>
          <label class="form-label">Updated SRV</label>
          <input type="number" id="esc-edit-updated-srv" class="form-input" min="0" />
        </div>
      </div>
      <div style="margin-bottom:20px">
        <label class="form-label">Notes</label>
        <input type="text" id="esc-edit-notes" class="form-input" placeholder="Optional notes" />
      </div>
      <div style="display:flex;gap:10px;justify-content:flex-end">
        <button class="btn" onclick="escCloseEditModal()">Cancel</button>
        <button class="btn btn-primary" onclick="escSubmitEditRecord()">Save changes</button>
      </div>
    </div>
  </div>

  <!-- ESC Add Record Modal -->
  <div class="modal-overlay" id="esc-record-modal" onclick="escRecordModalBgClick(event)">
    <div class="modal" style="max-width:780px;width:95%">
      <div class="modal-title" style="display:flex;align-items:center;justify-content:space-between">
        <span>Add New Record</span>
        <button onclick="escCloseRecordModal()" style="background:none;border:none;color:var(--text3);cursor:pointer;font-size:18px;line-height:1;padding:0">×</button>
      </div>
      <div style="display:flex;gap:20px">
        <!-- Form fields -->
        <div style="flex:1;min-width:0">
          <div class="form-grid">
            <div class="form-group" style="grid-column:1"><label class="form-label">Date of Record</label><input type="date" class="form-input" id="esc-f-date" /></div>
            <div class="form-group" style="grid-column:2"><label class="form-label">Asset Name</label><input type="text" class="form-input" id="esc-f-asset" placeholder="e.g. PLMWeb1" /></div>
            <div class="form-group" style="grid-column:span 2"><div style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);padding:6px 0 2px;border-top:1px solid var(--border)">Endpoint & Server Samples</div></div>
            <div class="form-group"><label class="form-label">Total Endpoints (Samples)</label><input type="number" class="form-input" id="esc-f-total-ep" min="0" placeholder="e.g. 200" oninput="escCalcCompliance()" /><span style="font-size:11px;color:var(--text3);margin-top:2px">Total sampled endpoints</span></div>
            <div class="form-group"><label class="form-label">Total Servers (Samples)</label><input type="number" class="form-input" id="esc-f-total-srv" min="0" placeholder="e.g. 20" oninput="escCalcCompliance()" /><span style="font-size:11px;color:var(--text3);margin-top:2px">Total sampled servers</span></div>
            <div class="form-group"><label class="form-label">Updated Endpoints</label><input type="number" class="form-input" id="esc-f-updated-ep" min="0" placeholder="e.g. 180" oninput="escCalcCompliance()" /></div>
            <div class="form-group"><label class="form-label">Updated Servers</label><input type="number" class="form-input" id="esc-f-updated-srv" min="0" placeholder="e.g. 18" oninput="escCalcCompliance()" /></div>
            <div class="form-group" style="grid-column:span 2"><div style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.08em;color:var(--text3);padding:6px 0 2px;border-top:1px solid var(--border)">Auto-Calculated Compliance</div></div>
            <div class="form-group"><label class="form-label">Endpoint Update %</label><input type="text" class="form-input" id="esc-f-ep-pct" readonly placeholder="Auto-calculated" style="color:var(--low)" /></div>
            <div class="form-group"><label class="form-label">Server Update %</label><input type="text" class="form-input" id="esc-f-srv-pct" readonly placeholder="Auto-calculated" style="color:var(--low)" /></div>
            <div class="form-group full"><label class="form-label">Remarks / Notes</label><input type="text" class="form-input" id="esc-f-notes" placeholder="Optional: observed issues, patches applied, etc." /></div>
          </div>
        </div>
        <!-- Live Preview -->
        <div style="width:220px;flex-shrink:0;display:flex;flex-direction:column;gap:12px">
          <div style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3)">Live Preview</div>
          <div>
            <div class="status-row-label"><span style="font-size:12px">Endpoint Compliance</span><strong id="esc-prev-ep-pct" style="color:var(--low)">0%</strong></div>
            <div class="status-bar-bg"><div class="status-bar-fill" id="esc-prev-ep-bar" style="background:var(--low);width:0%"></div></div>
          </div>
          <div>
            <div class="status-row-label"><span style="font-size:12px">Server Compliance</span><strong id="esc-prev-srv-pct" style="color:var(--low)">0%</strong></div>
            <div class="status-bar-bg"><div class="status-bar-fill" id="esc-prev-srv-bar" style="background:var(--low);width:0%"></div></div>
          </div>
          <div style="padding:12px;background:var(--bg3);border-radius:8px;border:1px solid var(--border);flex:1">
            <div style="font-family:var(--mono);font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px">Preview Entry</div>
            <div id="esc-preview-card" style="font-size:12px;color:var(--text2);line-height:1.8">Fill in the form to preview your record here.</div>
          </div>
        </div>
      </div>
      <div class="modal-actions" style="margin-top:16px">
        <button class="btn" onclick="escCloseRecordModal()">Cancel</button>
        <button class="btn btn-primary" onclick="escSubmitRecord()">Save Record</button>
      </div>
    </div>
  </div>

  <div id="esc-toast"><span class="toast-icon" id="esc-toast-icon"></span><span id="esc-toast-msg">Record saved!</span></div>

  <!-- ESC Add User Modal -->
  <div class="modal-overlay" id="esc-user-modal">
    <div class="modal">
      <div class="modal-title">Add user</div>
      <div class="form-grid">
        <div class="form-group"><label class="form-label">First name</label><input class="form-input" id="esc-mu-first" placeholder="Juan" /></div>
        <div class="form-group"><label class="form-label">Last name</label><input class="form-input" id="esc-mu-last" placeholder="dela Cruz" /></div>
        <div class="form-group full"><label class="form-label">Email</label><input class="form-input" id="esc-mu-email" type="email" placeholder="user@company.com" /></div>
        <div class="form-group"><label class="form-label">Password</label><input class="form-input" id="esc-mu-pass" type="password" placeholder="Min. 6 characters" /></div>
        <div class="form-group"><label class="form-label">Role</label><select class="form-input" id="esc-mu-role"><option value="Analyst">Security Analyst</option><option value="Viewer">Viewer (read-only)</option><option value="Admin">Admin</option></select></div>
      </div>
      <div class="modal-actions">
        <button class="btn" onclick="escCloseUserModal()">Cancel</button>
        <button class="btn btn-primary" onclick="escAddUser()">Add user</button>
      </div>
    </div>
  </div>
</div><!-- end #app-esc -->


<!-- ═══════════════════════════════════════════════════════
     SCRIPTS — order matters kasi may dependencies
     auth → tool-picker → vm → esc → date-picker
════════════════════════════════════════════════════════ -->
<script src="js/api.js"></script>
<script src="js/auth.js"></script>
<script src="js/tool-picker.js"></script>
<script src="js/vm.js"></script>
<script src="js/esc.js"></script>
<script src="js/compare.js"></script>
<script src="js/date-picker.js"></script>

<!-- ══ VM EXPORT MODAL ══════════════════════════════════════════ -->
<div class="modal-overlay" id="vm-export-modal" onclick="if(event.target===this)vmCloseExportModal()">
  <div class="modal-sheet" style="max-width:680px;width:95%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div class="modal-title">Export Vulnerabilities</div>
      <button class="icon-btn" onclick="vmCloseExportModal()">✕</button>
    </div>

    <!-- Format selector -->
    <div style="margin-bottom:18px">
      <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Format</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="exp-fmt-btn active" data-fmt="xlsx" onclick="vmSetExportFormat('xlsx',this)">📊 XLSX</button>
        <button class="exp-fmt-btn" data-fmt="csv"  onclick="vmSetExportFormat('csv',this)">📄 CSV</button>
        <button class="exp-fmt-btn" data-fmt="pdf"  onclick="vmSetExportFormat('pdf',this)">🖨 PDF</button>
        <button class="exp-fmt-btn" data-fmt="sheets" onclick="vmSetExportFormat('sheets',this)">🟢 Google Sheets</button>
      </div>
    </div>

    <!-- Filters row -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
      <div>
        <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px">Period</div>
        <select id="vm-exp-periods" class="form-input" onchange="vmUpdateExportPreview()" style="width:100%"></select>
      </div>
      <div>
        <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px">Asset</div>
        <select id="vm-exp-assets" class="form-input" onchange="vmUpdateExportPreview()" style="width:100%"></select>
      </div>
    </div>

    <!-- Severity + Status filters -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
      <div>
        <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Severity</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="checkbox" id="vm-exp-sev-critical" onchange="vmUpdateExportPreview()" checked> <span style="color:var(--critical)">Critical</span></label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="checkbox" id="vm-exp-sev-high"     onchange="vmUpdateExportPreview()" checked> <span style="color:var(--orange)">High</span></label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="checkbox" id="vm-exp-sev-medium"   onchange="vmUpdateExportPreview()" checked> <span style="color:var(--yellow)">Medium</span></label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="checkbox" id="vm-exp-sev-low"      onchange="vmUpdateExportPreview()" checked> <span style="color:var(--green)">Low</span></label>
        </div>
      </div>
      <div>
        <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Status</div>
        <div style="display:flex;flex-direction:column;gap:6px">
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="checkbox" id="vm-exp-st-open"       onchange="vmUpdateExportPreview()" checked> Open</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="checkbox" id="vm-exp-st-inprogress" onchange="vmUpdateExportPreview()" checked> In Progress</label>
          <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="checkbox" id="vm-exp-st-resolved"   onchange="vmUpdateExportPreview()" checked> Resolved</label>
        </div>
      </div>
    </div>

    <!-- Column picker -->
    <div style="margin-bottom:18px">
      <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Columns to include</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-id"       onchange="vmUpdateExportPreview()" checked> CVSS ID</label>
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-name"     onchange="vmUpdateExportPreview()" checked> Vuln Name</label>
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-asset"    onchange="vmUpdateExportPreview()" checked> Asset</label>
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-severity" onchange="vmUpdateExportPreview()" checked> Severity</label>
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-status"   onchange="vmUpdateExportPreview()" checked> Status</label>
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-ticket"   onchange="vmUpdateExportPreview()" checked> Ticket</label>
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-period"   onchange="vmUpdateExportPreview()" checked> Period</label>
        <label class="col-chip"><input type="checkbox" id="vm-exp-col-remarks"  onchange="vmUpdateExportPreview()" checked> Remarks</label>
      </div>
    </div>

    <!-- Live preview -->
    <div style="margin-bottom:18px">
      <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px">Preview</div>
      <div style="font-size:12px;color:var(--green);margin-bottom:8px" id="vm-exp-preview-count"></div>
      <div class="table-wrap" style="max-height:160px;overflow-y:auto">
        <table><thead id="vm-exp-preview-thead"></thead><tbody id="vm-exp-preview-tbody"></tbody></table>
      </div>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn" onclick="vmCloseExportModal()">Cancel</button>
      <button class="btn btn-primary" onclick="vmDoExport()">Export</button>
    </div>
  </div>
</div>

<!-- ══ ESC EXPORT MODAL ═════════════════════════════════════════ -->
<div class="modal-overlay" id="esc-export-modal" onclick="if(event.target===this)escCloseExportModal()">
  <div class="modal-sheet" style="max-width:640px;width:95%">
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
      <div class="modal-title">Export Compliance Records</div>
      <button class="icon-btn" onclick="escCloseExportModal()">✕</button>
    </div>

    <!-- Format selector -->
    <div style="margin-bottom:18px">
      <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Format</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="exp-fmt-btn active" data-fmt="xlsx"   onclick="escSetExportFormat('xlsx')">📊 XLSX</button>
        <button class="exp-fmt-btn"        data-fmt="csv"    onclick="escSetExportFormat('csv')">📄 CSV</button>
        <button class="exp-fmt-btn"        data-fmt="pdf"    onclick="escSetExportFormat('pdf')">🖨 PDF</button>
        <button class="exp-fmt-btn"        data-fmt="sheets" onclick="escSetExportFormat('sheets')">🟢 Google Sheets</button>
      </div>
    </div>

    <!-- Filters -->
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:18px">
      <div>
        <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px">Period</div>
        <select id="esc-exp-periods" class="form-input" onchange="escUpdateExportPreview()" style="width:100%"></select>
      </div>
      <div>
        <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px">Asset</div>
        <select id="esc-exp-assets" class="form-input" onchange="escUpdateExportPreview()" style="width:100%"></select>
      </div>
    </div>

    <!-- Compliance filter -->
    <div style="margin-bottom:18px">
      <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Compliance Status</div>
      <div style="display:flex;gap:16px">
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="radio" name="esc-exp-comp" id="esc-exp-comp-all"        value="all"          onchange="escUpdateExportPreview()" checked> All</label>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="radio" name="esc-exp-comp" id="esc-exp-comp-compliant"   value="compliant"    onchange="escUpdateExportPreview()"> <span style="color:var(--green)">Compliant (100%)</span></label>
        <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer"><input type="radio" name="esc-exp-comp" id="esc-exp-comp-noncompliant" value="noncompliant" onchange="escUpdateExportPreview()"> <span style="color:var(--critical)">Non-Compliant</span></label>
      </div>
    </div>

    <!-- Column picker -->
    <div style="margin-bottom:18px">
      <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:8px">Columns to include</div>
      <div style="display:flex;flex-wrap:wrap;gap:8px">
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-date"    onchange="escUpdateExportPreview()" checked> Date</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-asset"   onchange="escUpdateExportPreview()" checked> Asset</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-totalep" onchange="escUpdateExportPreview()" checked> Total EP</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-totalsrv" onchange="escUpdateExportPreview()" checked> Total SRV</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-updep"   onchange="escUpdateExportPreview()" checked> Updated EP</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-updsrv"  onchange="escUpdateExportPreview()" checked> Updated SRV</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-eppct"   onchange="escUpdateExportPreview()" checked> EP %</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-srvpct"  onchange="escUpdateExportPreview()" checked> SRV %</label>
        <label class="col-chip"><input type="checkbox" id="esc-exp-col-notes"   onchange="escUpdateExportPreview()" checked> Notes</label>
      </div>
    </div>

    <!-- Live preview -->
    <div style="margin-bottom:18px">
      <div style="font-family:var(--mono);font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:var(--text3);margin-bottom:6px">Preview</div>
      <div style="font-size:12px;color:var(--green);margin-bottom:8px" id="esc-exp-preview-count"></div>
      <div class="table-wrap" style="max-height:160px;overflow-y:auto">
        <table><thead id="esc-exp-preview-thead"></thead><tbody id="esc-exp-preview-tbody"></tbody></table>
      </div>
    </div>

    <div style="display:flex;gap:10px;justify-content:flex-end">
      <button class="btn" onclick="escCloseExportModal()">Cancel</button>
      <button class="btn btn-primary" onclick="escDoExport()">Export</button>
    </div>
  </div>
</div>

</body>
</html>
