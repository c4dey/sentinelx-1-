'use strict';

// kulay per role — ginagamit sa avatar at badges
const VM_ROLE_COLORS = { Admin: '#ff6b6b', Analyst: '#58a6ff', Viewer: '#69db7c' };
const VM_ROLE_BG     = { Admin: 'rgba(255,107,107,0.15)', Analyst: 'rgba(88,166,255,0.15)', Viewer: 'rgba(105,219,124,0.15)' };
const VM_ROLE_BORDER = { Admin: 'rgba(255,107,107,0.3)',  Analyst: 'rgba(88,166,255,0.3)',  Viewer: 'rgba(105,219,124,0.3)' };

let vmUsers = [
  { id:1, first:'Admin',    last:'User',    email:'admin@vmmonitor.com',   password:'admin123',   role:'Admin',   initials:'AU', color:'#ff6b6b', bg:'rgba(255,107,107,0.15)' },
  { id:2, first:'Security', last:'Analyst', email:'analyst@vmmonitor.com', password:'analyst123', role:'Analyst', initials:'SA', color:'#58a6ff', bg:'rgba(88,166,255,0.15)'  },
  { id:3, first:'Read',     last:'Viewer',  email:'viewer@vmmonitor.com',  password:'viewer123',  role:'Viewer',  initials:'RV', color:'#69db7c', bg:'rgba(105,219,124,0.15)' },
];
let vmCurrentUser = null;

function vmGetInitials(f, l) { return (f[0] + (l[0] || '')).toUpperCase(); }
function vmMakeColor(r)      { return VM_ROLE_COLORS[r] || '#8d96a0'; }
function vmMakeBg(r)         { return VM_ROLE_BG[r]     || 'rgba(141,150,160,0.15)'; }
function vmMakeBorder(r)     { return VM_ROLE_BORDER[r] || 'rgba(141,150,160,0.3)'; }

// sign out — dinadaan sa unified auth para ma-clear lahat
function vmDoSignOut()       { unifiedSignOut(); }
function vmToggleUserMenu()  { document.getElementById('vm-user-menu').classList.toggle('open'); }

function vmInitWithUser(u) {
  vmCurrentUser = u;
  document.getElementById('vm-main-app').style.display = 'flex';

  // set up avatar
  const av = document.getElementById('vm-user-avatar-btn');
  av.textContent      = u.initials;
  av.style.background = u.bg;
  av.style.color      = u.color;
  av.style.border     = '1px solid ' + vmMakeBorder(u.role);

  document.getElementById('vm-menu-name').textContent  = u.first + ' ' + u.last;
  document.getElementById('vm-menu-email').textContent = u.email;
  document.getElementById('vm-menu-role-badge').innerHTML =
    `<span style="font-family:var(--mono);font-size:10px;padding:2px 8px;border-radius:4px;background:${u.bg};color:${u.color};border:1px solid ${vmMakeBorder(u.role)}">${u.role}</span>`;

  const isAdmin  = u.role === 'Admin';
  const isViewer = u.role === 'Viewer';
  document.getElementById('vm-add-vuln-btn').style.display      = isViewer ? 'none' : '';
  document.getElementById('vm-tab-btn-import').style.display    = isViewer ? 'none' : '';
  document.getElementById('vm-manage-users-item').style.display = isAdmin  ? ''     : 'none';
  document.getElementById('vm-tab-btn-users').style.display     = isAdmin  ? ''     : 'none';

  vmRenderUsersGrid();
  // Load from backend if available, else render from localStorage
  if (window.SX_BACKEND_MODE) {
    vmLoadFromBackend();
  } else {
    vmRender();
  }
}

function vmToggleAuth(mode) { /* no-op — unified auth na */ }

// isasara yung mga dropdown pag nag-click kahit saan sa labas
document.addEventListener('click', e => {
  if (!e.target.closest('#vm-user-avatar-btn') && !e.target.closest('#vm-user-menu'))
    document.getElementById('vm-user-menu').classList.remove('open');
  if (!e.target.closest('#esc-user-avatar-btn') && !e.target.closest('#esc-user-menu'))
    document.getElementById('esc-user-menu')?.classList.remove('open');
  if (!e.target.closest('#vm-export-menu-wrap'))
    document.getElementById('vm-export-dropdown')?.classList.remove('open');
  if (!e.target.closest('#esc-export-menu-wrap'))
    document.getElementById('esc-export-dropdown')?.classList.remove('open');
});

// tab switching — dashboard, vulnerabilities, matrix, etc
const VM_ALL_TABS = ['dashboard', 'vulnerabilities', 'matrix', 'compare', 'import', 'users'];

function vmSwitchTab(id, el) {
  document.querySelectorAll('#app-vm .tab').forEach(t => t.classList.remove('active'));
  if (el) el.classList.add('active');
  VM_ALL_TABS.forEach(t => {
    document.getElementById('vm-tab-' + t).style.display = (t === id) ? '' : 'none';
  });
  if (id === 'users')           vmRenderUsersGrid();
  if (id === 'vulnerabilities') vmRenderMonthPills();
  if (id === 'compare')         vmRenderCompareTab();
}
function vmSwitchTabById(id) { vmSwitchTab(id, document.getElementById('vm-tab-btn-' + id)); }

// user management — render ng cards at delete
function vmRenderUsersGrid() {
  const grid    = document.getElementById('vm-users-grid'); if (!grid) return;
  const isAdmin = vmCurrentUser && vmCurrentUser.role === 'Admin';
  grid.innerHTML = vmUsers.map(u => `
    <div class="user-card">
      <div class="user-card-avatar" style="background:${u.bg};color:${u.color};border:1px solid ${vmMakeBorder(u.role)}">${u.initials}</div>
      <div class="user-card-info">
        <div class="user-card-name">${u.first} ${u.last}</div>
        <div class="user-card-email">${u.email}</div>
        <div style="margin-top:6px"><span style="font-family:var(--mono);font-size:10px;padding:2px 8px;border-radius:4px;background:${u.bg};color:${u.color};border:1px solid ${vmMakeBorder(u.role)}">${u.role}</span></div>
      </div>
      ${isAdmin && u.id !== vmCurrentUser.id ? `<div class="user-card-actions"><button class="icon-btn" style="color:var(--critical)" onclick="vmDeleteUser(${u.id})">🗑</button></div>` : ''}
    </div>`).join('');
}

function vmDeleteUser(id) {
  if (confirm('Remove this user?')) {
    vmUsers = vmUsers.filter(u => u.id !== id);
    vmRenderUsersGrid();
  }
}

// yung add vulnerability at add user modal — shared nila ito
let vmModalMode = 'vuln';

function vmOpenModal(mode) {
  vmModalMode = mode || 'vuln';

  if (vmModalMode === 'vuln') {
    ['vm-f-id', 'vm-f-asset', 'vm-f-name', 'vm-f-ticket', 'vm-f-comment']
      .forEach(id => document.getElementById(id).value = '');
    vmDrumReset();
    document.getElementById('vm-f-severity').value = 'Medium';
    document.getElementById('vm-f-status').value   = 'Open';
  }

  if (vmModalMode === 'user') {
    ['vm-mu-first', 'vm-mu-last', 'vm-mu-email', 'vm-mu-pass']
      .forEach(id => document.getElementById(id).value = '');
    document.getElementById('vm-mu-role').value = 'Analyst';
  }

  document.getElementById('vm-modal-vuln-body').style.display = vmModalMode === 'vuln' ? '' : 'none';
  document.getElementById('vm-modal-user-body').style.display = vmModalMode === 'user' ? '' : 'none';
  document.getElementById('vm-modal-title').textContent       = vmModalMode === 'user' ? 'Add new user' : 'Add vulnerability entry';
  document.getElementById('vm-modal-submit-btn').textContent  = vmModalMode === 'user' ? 'Create user' : 'Add entry';
  document.getElementById('vm-modal').classList.add('open');
}

function vmCloseModal() { document.getElementById('vm-modal').classList.remove('open'); }

function vmModalSubmit() {
  if (vmModalMode === 'user') {
    const first = document.getElementById('vm-mu-first').value.trim();
    const last  = document.getElementById('vm-mu-last').value.trim();
    const email = document.getElementById('vm-mu-email').value.trim();
    const pass  = document.getElementById('vm-mu-pass').value;
    const role  = document.getElementById('vm-mu-role').value;
    if (!first || !last || !email || !pass) { alert('Please fill in all fields.'); return; }
    if (vmUsers.find(u => u.email === email)) { alert('Email already exists.'); return; }
    vmUsers.push({ id: Date.now(), first, last, email, password: pass, role,
      initials: vmGetInitials(first, last), color: vmMakeColor(role), bg: vmMakeBg(role) });
    vmCloseModal();
    vmRenderUsersGrid();
  } else {
    vmAddVulnerability();
  }
}

// yung actual data storage — naka-localStorage para hindi mawala pag refresh
let vmData         = JSON.parse(localStorage.getItem('vm_data') || '[]');
let vmFilterAssets = new Set();
let vmFilterSevs   = new Set();
let vmFilterPeriods= new Set();
let vmFilterStat   = 'all';
let vmSearchQ      = '';
let vmImportBuffer = null;
let _vmLoading     = false;

// ── data persistence — API when backend up, localStorage fallback ──
function vmSaveData() {
  localStorage.setItem('vm_data', JSON.stringify(vmData));
}

async function vmLoadFromBackend() {
  if (!window.SX_BACKEND_MODE) return;
  try {
    _vmLoading = true;
    vmData = await SxAPI.vmList();
    // normalise field names (backend uses snake_case)
    vmData = vmData.map(r => ({
      id:       r.cvss_id || r.id,
      _dbId:    r.id,
      name:     r.name || '',
      asset:    r.asset,
      severity: r.severity,
      status:   r.status,
      ticket:   r.ticket || '',
      cvss:     r.cvss_score || '',
      category: r.category || '',
      comment:  r.comment || '',
      period:   r.period || '',
      evidence: r.evidence || [],
    }));
    localStorage.setItem('vm_data', JSON.stringify(vmData));
    vmRender();
  } catch(err) {
    console.warn('[VM] Backend load failed, using localStorage:', err.message);
  } finally { _vmLoading = false; }
}

async function vmPersist(record, dbId) {
  if (!window.SX_BACKEND_MODE) { vmSaveData(); return; }
  try {
    const payload = {
      cvss_id:    record.id,
      name:       record.name,
      asset:      record.asset,
      severity:   record.severity,
      status:     record.status,
      ticket:     record.ticket || '',
      cvss_score: record.cvss  || '',
      category:   record.category || '',
      comment:    record.comment || '',
      period:     record.period || '',
      evidence:   record.evidence || [],
    };
    if (dbId) {
      const updated = await SxAPI.vmUpdate(dbId, payload);
      record._dbId = updated.id;
    } else {
      const created = await SxAPI.vmCreate(payload);
      record._dbId = created.id;
    }
    vmSaveData();
  } catch(err) {
    console.warn('[VM] Persist failed:', err.message);
    vmSaveData(); // still save locally
  }
}

async function vmDeletePersist(record) {
  vmSaveData();
  if (!window.SX_BACKEND_MODE || !record._dbId) return;
  try { await SxAPI.vmDelete(record._dbId); } catch(err) { console.warn('[VM] Delete failed:', err.message); }
}

function vmAddVulnerability() {
  const getPeriod = () => {
    const iso = document.getElementById('vm-f-period-iso').value;
    if (iso) return iso;  // e.g. "2026-04"
    const m = document.getElementById('vm-f-period-month').value;
    const y = document.getElementById('vm-f-period-year').value;
    if (m && y) {
      const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      const mNum = String(MONTHS.indexOf(m) + 1).padStart(2, '0');
      return `${y}-${mNum}`;
    }
    return '';
  };

  const row = {
    id:       document.getElementById('vm-f-id').value.trim()   || 'CVSS ' + (vmData.length + 1),
    name:     document.getElementById('vm-f-name').value.trim(),
    asset:    document.getElementById('vm-f-asset').value.trim(),
    severity: document.getElementById('vm-f-severity').value,
    status:   document.getElementById('vm-f-status').value,
    ticket:   document.getElementById('vm-f-ticket').value.trim(),
    cvss:     document.getElementById('vm-f-cvss') ? document.getElementById('vm-f-cvss').value.trim() : '',
    category: document.getElementById('vm-f-category') ? document.getElementById('vm-f-category').value : '',
    evidence: [],
    comment:  document.getElementById('vm-f-comment').value.trim(),
    period:   getPeriod(),
    _dbId:    null,
  };

  if (!row.name)  { alert('Vulnerability name is required.'); return; }
  if (!row.asset) { alert('Asset is required.'); return; }

  vmData.push(row);
  vmCloseModal();
  vmRender();
  vmPersist(row, null);
}

// filtering logic — by asset, severity, period, status, at search
function vmFiltered() {
  return vmData.filter(r => {
    const mA  = vmFilterAssets.size  === 0 || vmFilterAssets.has(r.asset);
    const mS  = vmFilterSevs.size    === 0 || vmFilterSevs.has(r.severity);
    const mP  = vmFilterPeriods.size === 0 || vmFilterPeriods.has(r.period);
    const mSt = vmFilterStat === 'all' || r.status === vmFilterStat;
    const mQ  = !vmSearchQ || [r.id, r.name, r.asset, r.ticket].join(' ').toLowerCase().includes(vmSearchQ.toLowerCase());
    return mA && mS && mP && mSt && mQ;
  });
}

function vmSidebarFilterSeverity(s, el) {
  if (s === 'all') {
    vmFilterSevs.clear();
    ['vm-sidebar-sev-all', 'vm-sidebar-sev-critical', 'vm-sidebar-sev-high', 'vm-sidebar-sev-medium', 'vm-sidebar-sev-low']
      .forEach(id => document.getElementById(id).classList.remove('active'));
    document.getElementById('vm-sidebar-sev-all').classList.add('active');
  } else {
    if (vmFilterSevs.has(s)) vmFilterSevs.delete(s); else vmFilterSevs.add(s);
    document.getElementById('vm-sidebar-sev-all').classList.toggle('active', vmFilterSevs.size === 0);
    el.classList.toggle('active', vmFilterSevs.has(s));
  }
  vmSwitchTabById('vulnerabilities');
  vmRender();
}

function vmSidebarFilterAsset(a, el) {
  if (vmFilterAssets.has(a)) vmFilterAssets.delete(a); else vmFilterAssets.add(a);
  el.classList.toggle('active', vmFilterAssets.has(a));
  const allEl = document.getElementById('vm-sidebar-asset-all');
  if (allEl) allEl.classList.toggle('active', vmFilterAssets.size === 0);
  vmSearchQ = '';
  vmSwitchTabById('vulnerabilities');
  vmRender();
}

function vmSidebarFilterAllAssets(el) {
  vmFilterAssets.clear();
  vmSearchQ = '';
  document.querySelectorAll('#vm-asset-list .sidebar-item').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  vmSwitchTabById('vulnerabilities');
  vmRender();
}

function vmSidebarFilterPeriod(period, el) {
  if (vmFilterPeriods.has(period)) vmFilterPeriods.delete(period); else vmFilterPeriods.add(period);
  el.classList.toggle('active', vmFilterPeriods.has(period));
  const allEl = document.getElementById('vm-sidebar-period-all');
  if (allEl) allEl.classList.toggle('active', vmFilterPeriods.size === 0);
  vmSwitchTabById('vulnerabilities');
  vmRender();
}

function vmSidebarFilterAllPeriods(el) {
  vmFilterPeriods.clear();
  document.querySelectorAll('#vm-month-sidebar .sidebar-month').forEach(e => e.classList.remove('active'));
  el.classList.add('active');
  vmSwitchTabById('vulnerabilities');
  vmRender();
}

function vmFilterByPill(period, el) {
  if (period === 'all') {
    vmFilterPeriods.clear();
    document.querySelectorAll('#vm-month-pills .month-pill').forEach(e => e.classList.remove('active'));
    el.classList.add('active');
  } else {
    if (vmFilterPeriods.has(period)) vmFilterPeriods.delete(period); else vmFilterPeriods.add(period);
    el.classList.toggle('active', vmFilterPeriods.has(period));
    document.querySelectorAll('#vm-month-pills .month-pill').forEach(e => {
      if (e.dataset.period === 'all') e.classList.toggle('active', vmFilterPeriods.size === 0);
    });
  }
  vmRender();
}

function vmFilterStatus(s) { vmFilterStat = s; vmRender(); }
function vmFilterTable(q)  { vmSearchQ = q; vmRender(); }

// irrender yung assets at periods sa sidebar
function vmRenderAssetsSidebar() {
  const assets  = [...new Set(vmData.map(r => r.asset))];
  const allItem = `<div class="sidebar-item${vmFilterAssets.size === 0 ? ' active' : ''}" id="vm-sidebar-asset-all" onclick="vmSidebarFilterAllAssets(this)">
    <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--accent);opacity:0.5"></span>All assets</div>
    <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${vmData.length}</span>
  </div>`;
  document.getElementById('vm-asset-list').innerHTML = allItem + assets.map(a => {
    const count    = vmData.filter(r => r.asset === a).length;
    const isActive = vmFilterAssets.has(a);
    return `<div class="sidebar-item${isActive ? ' active' : ''}" onclick="vmSidebarFilterAsset('${a.replace(/'/g, "\\'")}',this)">
      <div class="sidebar-item-name" style="font-size:12px">${a}</div>
      <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${count}</span>
    </div>`;
  }).join('');
}

function vmFmtPeriod(p) {
  if (!p) return '—';
  // ISO format "2026-04" → "Apr 2026"
  const m = p.match(/^(\d{4})-(\d{2})$/);
  if (m) {
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    return `${months[parseInt(m[2])-1]} ${m[1]}`;
  }
  return p;
}

function vmRenderMonths() {
  const months  = [...new Set(vmData.map(r => r.period).filter(Boolean))].sort().reverse();
  const allItem = `<div class="sidebar-month${vmFilterPeriods.size === 0 ? ' active' : ''}" id="vm-sidebar-period-all" onclick="vmSidebarFilterAllPeriods(this)">
    <span>All periods</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${vmData.length}</span>
  </div>`;
  document.getElementById('vm-month-sidebar').innerHTML = allItem + months.map(m => {
    const count = vmData.filter(r => r.period === m).length;
    return `<div class="sidebar-month${vmFilterPeriods.has(m) ? ' active' : ''}" data-period="${m}" onclick="vmSidebarFilterPeriod('${m}',this)">
      <span>${vmFmtPeriod(m)}</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${count}</span>
    </div>`;
  }).join('');
}

function vmRenderMonthPills() {
  const months = [...new Set(vmData.map(r => r.period).filter(Boolean))].sort().reverse();
  document.getElementById('vm-month-pills').innerHTML =
    `<div class="month-pill${vmFilterPeriods.size === 0 ? ' active' : ''}" data-period="all" onclick="vmFilterByPill('all',this)">All periods</div>` +
    months.map(m =>
      `<div class="month-pill${vmFilterPeriods.has(m) ? ' active' : ''}" data-period="${m}" onclick="vmFilterByPill('${m}',this)">${vmFmtPeriod(m)}</div>`
    ).join('');
}

// helpers para sa severity badges at status dots
function vmSevClass(s)    { return { Critical:'sev-critical', High:'sev-high', Medium:'sev-medium', Low:'sev-low' }[s] || 'sev-low'; }
function vmStatusDot(s)   { return { Open:'status-open', 'In Progress':'status-progress', Resolved:'status-resolved' }[s] || 'status-open'; }

function vmRenderTable(tbodyId, rows) {
  const tb = document.getElementById(tbodyId); if (!tb) return;
  if (!rows.length) {
    tb.innerHTML = `<tr class="empty-row"><td colspan="10">No vulnerabilities match your filters</td></tr>`;
    return;
  }
  tb.innerHTML = rows.map(r => {
    const idx = vmData.indexOf(r);
    return `<tr>
      <td class="cvss-id">${r.id}</td>
      <td class="vuln-name"><span class="vuln-name-text">${r.name}</span></td>
      <td style="font-family:var(--mono);font-size:12px;color:var(--text2)">${r.asset}</td>
      <td><span class="sev-badge ${vmSevClass(r.severity)}">${r.severity}</span></td>
      <td><span class="status-dot ${vmStatusDot(r.status)}"></span> ${r.status}</td>
      <td>${r.ticket
        ? `<span class="ticket-link">${r.ticket}</span>`
        : `<span class="ticket-empty" onclick="vmSetTicket(${idx})">+ Add ticket</span>`}</td>
      <td><div class="evidence-zone">
        ${r.evidence.map(f => `<div class="file-chip">${f}<span class="file-chip-x" onclick="vmRemoveFile(${idx},'${f}')">×</span></div>`).join('')}
        <label class="upload-btn">📎 Upload<input type="file" style="display:none" onchange="vmAddFile(${idx},this)"/></label>
      </div></td>
      <td class="comment-cell"><div class="comment-wrapper">
        <input class="comment-input" value="${r.comment.replace(/"/g, '&quot;')}" placeholder="Add comment..." onchange="vmUpdateComment(${idx},this.value)" />
        ${r.comment ? `<div class="comment-tooltip">${r.comment.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</div>` : ''}
      </div></td>
      <td style="font-family:var(--mono);font-size:11px;color:var(--text3)">${vmFmtPeriod(r.period)}</td>
      <td><div class="actions-cell">
        <select class="icon-btn" style="cursor:pointer;padding:3px 6px;font-size:11px" onchange="vmUpdateStatus(${idx},this.value)">
          <option ${r.status === 'Open'        ? 'selected' : ''}>Open</option>
          <option ${r.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option ${r.status === 'Resolved'    ? 'selected' : ''}>Resolved</option>
        </select>
        <button class="icon-btn" onclick="vmDeleteRow(${idx})">🗑</button>
      </div></td>
    </tr>`;
  }).join('');
}

// main render — tinatawag ito pag may pagbabago sa data o filters
function vmRender() {
  const rows = vmFiltered();
  vmRenderTable('vm-vuln-tbody', rows);

  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  vmData.forEach(r => counts[r.severity] = (counts[r.severity] || 0) + 1);

  document.getElementById('vm-count-all').textContent      = vmData.length;
  document.getElementById('vm-count-critical').textContent = counts.Critical || 0;
  document.getElementById('vm-count-high').textContent     = counts.High     || 0;
  document.getElementById('vm-count-medium').textContent   = counts.Medium   || 0;
  document.getElementById('vm-count-low').textContent      = counts.Low      || 0;
  document.getElementById('vm-dash-critical').textContent  = counts.Critical || 0;
  document.getElementById('vm-dash-high').textContent      = counts.High     || 0;
  document.getElementById('vm-dash-medium').textContent    = counts.Medium   || 0;
  document.getElementById('vm-dash-low').textContent       = counts.Low      || 0;

  vmRenderAssetsSidebar();
  vmRenderMonths();
  vmRenderMonthPills();
  vmRenderMatrix();
  vmRenderDashboardPanels();
}

// yung mga action sa loob ng table rows — edit, delete, upload
function vmUpdateComment(idx, val) { vmData[idx].comment = val; vmPersist(vmData[idx], vmData[idx]._dbId); }
function vmUpdateStatus(idx, val)  { vmData[idx].status  = val; vmPersist(vmData[idx], vmData[idx]._dbId); vmRender(); }
function vmRemoveFile(idx, name)   { vmData[idx].evidence = vmData[idx].evidence.filter(f => f !== name); vmPersist(vmData[idx], vmData[idx]._dbId); vmRender(); }
function vmAddFile(idx, input)     { if (input.files[0]) { vmData[idx].evidence.push(input.files[0].name); vmPersist(vmData[idx], vmData[idx]._dbId); vmRender(); } }

function vmSetTicket(idx) {
  const t = prompt('Enter internal ticket ID (e.g. INC-042):');
  if (t && t.trim()) { vmData[idx].ticket = t.trim(); vmPersist(vmData[idx], vmData[idx]._dbId); vmRender(); }
}
function vmDeleteRow(idx) {
  if (confirm('Delete this vulnerability entry?')) {
    const rec = vmData.splice(idx, 1)[0];
    vmDeletePersist(rec);
    vmRender();
  }
}

// asset x CVSS matrix — table view ng lahat ng vulnerabilities per asset
function vmRenderMatrix() {
  const assets  = [...new Set(vmData.map(r => r.asset))];
  const cvssIds = [...new Set(vmData.map(r => r.id))];
  const lookup  = {};
  vmData.forEach(r => { lookup[r.asset + '_' + r.id] = r.severity; });

  const sevChar = { Critical: 'C', High: 'H', Medium: 'M', Low: 'L' };
  const sevDot  = { Critical: 'md-c', High: 'md-h', Medium: 'md-m', Low: 'md-none' };

  let html = `<table class="matrix-table"><thead><tr><th>Asset \\ CVSS</th>`;
  cvssIds.forEach(c => html += `<th>${c}</th>`);
  html += `</tr></thead><tbody>`;
  assets.forEach(a => {
    html += `<tr><td style="font-family:var(--mono);font-size:12px;font-weight:500;color:var(--text2)">${a}</td>`;
    cvssIds.forEach(c => {
      const sev = lookup[a + '_' + c];
      html += `<td><div class="matrix-cell">${sev
        ? `<div class="matrix-dot ${sevDot[sev] || 'md-none'}">${sevChar[sev] || ''}</div>`
        : `<span class="md-none">·</span>`}</div></td>`;
    });
    html += `</tr>`;
  });
  html += `</tbody></table>`;
  document.getElementById('vm-matrix-container').innerHTML = html;
}

// drag and drop import ng xlsx/csv at export ng current data
function vmDragOver(e)    { e.preventDefault(); document.getElementById('vm-drop-zone').classList.add('drag'); }
function vmDragLeave()    { document.getElementById('vm-drop-zone').classList.remove('drag'); }
function vmDropFile(e)    { e.preventDefault(); vmDragLeave(); vmProcessFile(e.dataTransfer.files[0]); }
function vmHandleFileInput(input) { if (input.files[0]) vmProcessFile(input.files[0]); }

function vmProcessFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      const wb = XLSX.read(e.target.result, { type: 'array' });
      const ws = wb.Sheets[wb.SheetNames[0]];

      // Use raw: false so dates come as strings, header: 1 for array mode first
      // then we detect headers manually so we can skip blank/junk rows properly
      const raw = XLSX.utils.sheet_to_json(ws, {
        defval:    null,   // null for empty — easier to filter than ''
        blankrows: false,  // skip rows where every cell is blank
        raw:       false,  // format dates as strings
      });

      // Filter out rows where the critical fields (Asset + CVSS ID) are both missing —
      // these are formatting rows, sum rows, notes rows, or Excel ghost rows
      const meaningful = raw.filter(r => {
        const asset  = r['Asset']   || r['asset']   || r['ASSET']   || r['Hostname'] || '';
        const cvssId = r['CVSS ID'] || r['cvss_id'] || r['CVE ID']  || r['id']       || '';
        // Must have at least an asset name to be a real row
        return String(asset).trim() !== '' && String(asset).trim() !== 'null';
      });

      vmImportBuffer = meaningful;
      vmShowPreview(meaningful);
    } catch (err) {
      alert('Could not read file: ' + err.message);
    }
  };
  reader.readAsArrayBuffer(file);
}

function vmShowPreview(rows) {
  if (!rows.length) {
    alert('No valid rows found. Make sure your file has an "Asset" column with data.');
    return;
  }
  document.getElementById('vm-import-preview').style.display = '';
  document.getElementById('vm-preview-count').textContent    = rows.length;
  const keys = Object.keys(rows[0]).filter(k => rows.some(r => r[k] !== null && r[k] !== ''));
  document.getElementById('vm-preview-header').innerHTML = keys.map(k => `<th>${k}</th>`).join('');
  document.getElementById('vm-preview-body').innerHTML =
    rows.slice(0, 8).map(r =>
      `<tr>${keys.map(k => `<td style="color:var(--text2);font-size:12px">${r[k] ?? ''}</td>`).join('')}</tr>`
    ).join('') +
    (rows.length > 8 ? `<tr><td colspan="${keys.length}" style="color:var(--text3);font-size:11px;padding:8px 14px">…and ${rows.length - 8} more rows</td></tr>` : '');
}

async function vmConfirmImport() {
  if (!vmImportBuffer) return;
  const VALID_SEV    = new Set(['Critical','High','Medium','Low']);
  const VALID_STATUS = new Set(['Open','In Progress','Resolved']);
  const records = [];
  vmImportBuffer.forEach(r => {
    const key = (...names) => {
      for (const n of names) {
        const v = r[n] ?? r[n.toLowerCase()] ?? r[n.toUpperCase()] ?? r[n.replace(/ /g,'_')] ?? '';
        if (v !== '' && v !== null && v !== undefined) return String(v).trim();
      }
      return '';
    };
    const rawSev    = key('Severity','severity','SEVERITY');
    const rawStatus = key('Status','status','STATUS');
    const severity  = VALID_SEV.has(rawSev)       ? rawSev    : 'Medium';
    const status    = VALID_STATUS.has(rawStatus)  ? rawStatus : 'Open';
    const cvss_id   = key('CVSS ID','CVSS_ID','cvss_id','CVE ID','id') || 'CVE-?';
    const asset     = key('Asset','asset','ASSET','Hostname');
    if (!asset) return;
    records.push({
      cvss_id,
      name:       key('Vulnerability Name','Name','name','Remarks','remarks','Description'),
      asset, severity, status,
      ticket:     key('Ticket','Internal Ticket','ticket','TICKET'),
      cvss_score: key('CVSS Score','cvss_score','Score','score'),
      category:   key('Category','category','CATEGORY'),
      comment:    key('Remarks','remarks','Comments','comment','Notes','notes'),
      period:     key('Date','date','DATE','Period','period'),
      evidence:   [],
    });
  });

  vmImportBuffer = null;
  document.getElementById('vm-import-preview').style.display = 'none';
  document.getElementById('vm-file-input').value = '';

  if (window.SX_BACKEND_MODE && records.length) {
    try {
      await SxAPI.vmBulk(records);
      await vmLoadFromBackend();
    } catch(err) {
      console.warn('[VM] Bulk import failed, saving locally:', err.message);
      records.forEach(r => vmData.push({ id: r.cvss_id, name: r.name, asset: r.asset,
        severity: r.severity, status: r.status, ticket: r.ticket || '', cvss: r.cvss_score || '',
        category: r.category || '', comment: r.comment || '', period: r.period || '', evidence: [], _dbId: null }));
      vmSaveData(); vmRender();
    }
  } else {
    records.forEach(r => vmData.push({ id: r.cvss_id, name: r.name, asset: r.asset,
      severity: r.severity, status: r.status, ticket: r.ticket || '', cvss: r.cvss_score || '',
      category: r.category || '', comment: r.comment || '', period: r.period || '', evidence: [], _dbId: null }));
    vmSaveData(); vmRender();
  }

  const toast = document.getElementById('vm-toast');
  if (toast) {
    document.getElementById('vm-toast-msg').textContent  = `Imported ${records.length} entries successfully!`;
    document.getElementById('vm-toast-icon').textContent = '✓';
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
  }
}

function vmCancelImport() {
  vmImportBuffer = null;
  document.getElementById('vm-import-preview').style.display = 'none';
  document.getElementById('vm-file-input').value = '';
}

// ── EXPORT MODAL ──────────────────────────────────────────────
let vmExportFormat = 'xlsx';

function vmOpenExportModal() {
  // populate period options
  const periods = [...new Set(vmData.map(r => r.period).filter(Boolean))].sort().reverse();
  const assets  = [...new Set(vmData.map(r => r.asset).filter(Boolean))].sort();
  const perSel  = document.getElementById('vm-exp-periods');
  const assSel  = document.getElementById('vm-exp-assets');
  perSel.innerHTML  = `<option value="all" selected>All periods</option>` + periods.map(p => `<option value="${p}">${vmFmtPeriod(p)}</option>`).join('');
  assSel.innerHTML  = `<option value="all" selected>All assets</option>`  + assets.map(a  => `<option value="${a}">${a}</option>`).join('');
  // reset checkboxes
  ['vm-exp-sev-critical','vm-exp-sev-high','vm-exp-sev-medium','vm-exp-sev-low'].forEach(id => document.getElementById(id).checked = true);
  ['vm-exp-st-open','vm-exp-st-inprogress','vm-exp-st-resolved'].forEach(id => document.getElementById(id).checked = true);
  ['vm-exp-col-id','vm-exp-col-name','vm-exp-col-asset','vm-exp-col-severity','vm-exp-col-status','vm-exp-col-ticket','vm-exp-col-period','vm-exp-col-remarks'].forEach(id => document.getElementById(id).checked = true);
  vmExportFormat = 'xlsx';
  document.querySelectorAll('.exp-fmt-btn').forEach(b => b.classList.toggle('active', b.dataset.fmt === 'xlsx'));
  vmUpdateExportPreview();
  document.getElementById('vm-export-modal').classList.add('open');
}

function vmCloseExportModal() { document.getElementById('vm-export-modal').classList.remove('open'); }

function vmSetExportFormat(fmt, el) {
  vmExportFormat = fmt;
  document.querySelectorAll('.exp-fmt-btn').forEach(b => b.classList.toggle('active', b.dataset.fmt === fmt));
}

function vmGetExportRows() {
  const period   = document.getElementById('vm-exp-periods').value;
  const asset    = document.getElementById('vm-exp-assets').value;
  const sevs     = ['Critical','High','Medium','Low'].filter(s => document.getElementById(`vm-exp-sev-${s.toLowerCase()}`).checked);
  const statuses = [];
  if (document.getElementById('vm-exp-st-open').checked)       statuses.push('Open');
  if (document.getElementById('vm-exp-st-inprogress').checked) statuses.push('In Progress');
  if (document.getElementById('vm-exp-st-resolved').checked)   statuses.push('Resolved');
  return vmData.filter(r =>
    (period === 'all' || r.period === period) &&
    (asset  === 'all' || r.asset  === asset)  &&
    sevs.includes(r.severity) &&
    statuses.includes(r.status)
  );
}

function vmGetExportCols() {
  const map = {
    'vm-exp-col-id':       ['CVSS ID',    r => r.id],
    'vm-exp-col-name':     ['Vuln Name',  r => r.name],
    'vm-exp-col-asset':    ['Asset',      r => r.asset],
    'vm-exp-col-severity': ['Severity',   r => r.severity],
    'vm-exp-col-status':   ['Status',     r => r.status],
    'vm-exp-col-ticket':   ['Ticket',     r => r.ticket || ''],
    'vm-exp-col-period':   ['Period',     r => vmFmtPeriod(r.period)],
    'vm-exp-col-remarks':  ['Remarks',    r => r.name || r.comment || ''],
  };
  return Object.entries(map).filter(([id]) => document.getElementById(id).checked).map(([, v]) => v);
}

function vmUpdateExportPreview() {
  const rows = vmGetExportRows();
  document.getElementById('vm-exp-preview-count').textContent = `${rows.length} record${rows.length !== 1 ? 's' : ''} will be exported`;
  const cols = vmGetExportCols();
  const thead = document.getElementById('vm-exp-preview-thead');
  const tbody = document.getElementById('vm-exp-preview-tbody');
  thead.innerHTML = `<tr>${cols.map(([label]) => `<th>${label}</th>`).join('')}</tr>`;
  tbody.innerHTML = rows.slice(0, 5).map(r =>
    `<tr>${cols.map(([, fn]) => `<td>${fn(r)}</td>`).join('')}</tr>`
  ).join('') + (rows.length > 5 ? `<tr><td colspan="${cols.length}" style="color:var(--text3);font-size:11px">…and ${rows.length-5} more</td></tr>` : '');
}

function vmDoExport() {
  const rows = vmGetExportRows();
  const cols = vmGetExportCols();
  if (!rows.length) { alert('No records match the current filters.'); return; }
  const date = new Date().toISOString().split('T')[0];

  if (vmExportFormat === 'xlsx') {
    const data = rows.map(r => Object.fromEntries(cols.map(([label, fn]) => [label, fn(r)])));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Vulnerabilities');
    XLSX.writeFile(wb, `vm_export_${date}.xlsx`);
    vmCloseExportModal();

  } else if (vmExportFormat === 'csv') {
    const header = cols.map(([l]) => `"${l}"`).join(',');
    const body   = rows.map(r => cols.map(([,fn]) => `"${String(fn(r)).replace(/"/g,"'")}"`).join(',')).join('\n');
    const blob   = new Blob([header + '\n' + body], { type:'text/csv' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a'); a.href=url; a.download=`vm_export_${date}.csv`; a.click();
    URL.revokeObjectURL(url);
    vmCloseExportModal();

  } else if (vmExportFormat === 'pdf') {
    const printDiv = document.getElementById('vm-print-area') || (() => { const d=document.createElement('div'); d.id='vm-print-area'; document.body.appendChild(d); return d; })();
    const counts   = { Critical:0, High:0, Medium:0, Low:0 };
    rows.forEach(r => counts[r.severity] = (counts[r.severity]||0)+1);
    const SEV_STYLES = { Critical:'color:#b91c1c;font-weight:700', High:'color:#c2410c;font-weight:700', Medium:'color:#a16207;font-weight:700', Low:'color:#166534;font-weight:700' };
    printDiv.innerHTML = `
      <div class="print-header" style="display:block;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #1a1a2e">
        <div style="font-size:22pt;font-weight:800;color:#1a1a2e">SentinelX</div>
        <div style="font-size:13pt;font-weight:600;color:#374151;margin-top:2px">Vulnerability Management Report</div>
        <div style="display:flex;gap:24px;margin-top:10px;font-size:9pt;color:#6b7280">
          <span>Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
          <span>Records: ${rows.length}</span>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <span style="background:#fef2f2;color:#b91c1c;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">Critical: ${counts.Critical}</span>
          <span style="background:#fff7ed;color:#c2410c;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">High: ${counts.High}</span>
          <span style="background:#fefce8;color:#a16207;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">Medium: ${counts.Medium}</span>
          <span style="background:#f0fdf4;color:#166534;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">Low: ${counts.Low}</span>
        </div>
      </div>
      <table>
        <thead><tr>${cols.map(([l])=>`<th>${l}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>`<tr>${cols.map(([l,fn])=>{
          const v=fn(r); const s=l==='Severity'?(SEV_STYLES[v]||''):l==='Status'&&v==='Resolved'?'color:#166534':'';
          return `<td style="${s}">${v}</td>`;
        }).join('')}</tr>`).join('')}</tbody>
      </table>`;
    vmCloseExportModal();
    setTimeout(() => window.print(), 150);


















  } else if (vmExportFormat === 'sheets') {
    const header = cols.map(([l]) => `"${l}"`).join(',');
    const body   = rows.map(r => cols.map(([,fn]) => `"${String(fn(r)).replace(/"/g,"'")}"`).join(',')).join('\n');
    const blob   = new Blob([header + '\n' + body], { type:'text/csv' });
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a'); a.href=url; a.download=`vm_export_${date}.csv`; a.click();
    URL.revokeObjectURL(url);
    vmCloseExportModal();
    setTimeout(() => {
      window.open('https://sheets.new', '_blank');
      const toast = document.getElementById('vm-toast');
      if (toast) {
        document.getElementById('vm-toast-msg').textContent  = 'CSV downloaded — drag it into the new Google Sheet!';
        document.getElementById('vm-toast-icon').textContent = '📊';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 5000);
      }
    }, 600);
  }
}

// keep old name for compatibility
function vmExportXLSX() { vmOpenExportModal(); }
function vmExportCSV()   { vmOpenExportModal(); }
function vmExportPDF()   { vmOpenExportModal(); }
function vmExportSheets(){ vmOpenExportModal(); }

// yung mga dashboard panels — bar chart, status breakdown, top assets
function vmRenderDashboardPanels() {
  const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 };
  vmData.forEach(r => counts[r.severity] = (counts[r.severity] || 0) + 1);

  // bar chart
  const canvas = document.getElementById('vm-vuln-chart');
  if (canvas) {
    requestAnimationFrame(() => {
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const W   = canvas.offsetWidth || 480;
      const H   = 160;
      canvas.width  = W * dpr; canvas.height = H * dpr;
      canvas.style.width  = W + 'px'; canvas.style.height = H + 'px';
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, W, H);

      const bars = [
        { label:'Critical', val:counts.Critical, color:'#f43f7a', glow:'rgba(244,63,122,0.4)' },
        { label:'High',     val:counts.High,     color:'#f97316', glow:'rgba(249,115,22,0.4)' },
        { label:'Medium',   val:counts.Medium,   color:'#a78bfa', glow:'rgba(167,139,250,0.4)' },
        { label:'Low',      val:counts.Low,      color:'#34d399', glow:'rgba(52,211,153,0.4)' },
      ];
      const maxVal = Math.max(...bars.map(b => b.val), 1);
      const barW   = Math.min(60, (W - 80) / bars.length - 20);
      const gap    = (W - 60 - bars.length * barW) / (bars.length + 1);
      const startX = 36, bottomY = H - 28;

      ctx.strokeStyle = 'rgba(176,106,255,0.06)'; ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        const y = bottomY - (i / 4) * (bottomY - 14);
        ctx.beginPath(); ctx.moveTo(startX, y); ctx.lineTo(W - 8, y); ctx.stroke();
      }

      bars.forEach((b, i) => {
        const x    = startX + gap + i * (barW + gap);
        const barH = Math.max((b.val / maxVal) * (bottomY - 14), b.val > 0 ? 4 : 0);
        const y    = bottomY - barH;

        ctx.shadowColor = b.glow; ctx.shadowBlur = 16;
        const grad = ctx.createLinearGradient(x, y, x, bottomY);
        grad.addColorStop(0, b.color); grad.addColorStop(1, b.color + '22');
        ctx.fillStyle = grad;
        ctx.beginPath();
        if (ctx.roundRect) ctx.roundRect(x, y, barW, barH, [5, 5, 0, 0]); else ctx.rect(x, y, barW, barH);
        ctx.fill(); ctx.shadowBlur = 0;

        ctx.fillStyle = b.color; ctx.font = `600 12px 'IBM Plex Mono',monospace`; ctx.textAlign = 'center';
        if (b.val > 0) ctx.fillText(b.val, x + barW / 2, y - 6);
        ctx.fillStyle = '#3d5068'; ctx.font = `10px 'IBM Plex Mono',monospace`;
        ctx.fillText(b.label, x + barW / 2, H - 6);
      });
    });
  }

  // status breakdown
  const statCounts = { Open: 0, 'In Progress': 0, Resolved: 0 };
  vmData.forEach(r => statCounts[r.status] = (statCounts[r.status] || 0) + 1);
  const statTotal = vmData.length || 1;
  const sbEl = document.getElementById('vm-status-breakdown');
  if (sbEl) {
    sbEl.innerHTML = [
      { key:'Open',        color:'var(--critical)', label:'Open' },
      { key:'In Progress', color:'var(--high)',     label:'In Progress' },
      { key:'Resolved',    color:'var(--low)',      label:'Resolved' },
    ].map(s => {
      const n   = statCounts[s.key] || 0;
      const pct = Math.round(n / statTotal * 100);
      return `<div class="status-row-item">
        <div class="status-row-label"><span>${s.label}</span><strong style="color:${s.color}">${n} (${pct}%)</strong></div>
        <div class="status-bar-bg"><div class="status-bar-fill" style="width:${pct}%;background:${s.color}"></div></div>
      </div>`;
    }).join('');
  }

  // top 5 assets
  const assetMap = {};
  vmData.forEach(r => {
    if (!assetMap[r.asset]) assetMap[r.asset] = { total: 0, critical: 0, high: 0 };
    assetMap[r.asset].total++;
    if (r.severity === 'Critical') assetMap[r.asset].critical++;
    if (r.severity === 'High')     assetMap[r.asset].high++;
  });
  const sorted = Object.entries(assetMap).sort((a, b) => b[1].total - a[1].total).slice(0, 5);
  const maxA   = sorted[0]?.[1]?.total || 1;
  const taEl   = document.getElementById('vm-top-assets-list');
  if (taEl) {
    taEl.innerHTML = sorted.map(([name, info]) => {
      const w    = Math.round(info.total / maxA * 100);
      const hasC = info.critical > 0;
      const dc   = hasC ? 'var(--critical)' : 'var(--high)';
      return `<div class="asset-row-item">
        <span class="asset-sev-dot" style="background:${dc};box-shadow:0 0 6px ${dc}"></span>
        <div class="asset-row-name">${name}</div>
        <div class="asset-bar-track"><div class="asset-bar-fill" style="width:${w}%;background:${dc}"></div></div>
        <div class="asset-badges">
          <span class="asset-row-count">${info.total}</span>
          ${info.critical ? `<span class="sev-badge sev-critical" style="font-size:10px;padding:2px 7px">C:${info.critical}</span>` : ''}
          ${info.high     ? `<span class="sev-badge sev-high"     style="font-size:10px;padding:2px 7px">H:${info.high}</span>`     : ''}
        </div>
      </div>`;
    }).join('') || '<div style="color:var(--text3);font-size:13px;padding:8px 0">No data yet</div>';
  }
}
