'use strict';

// ── ESC state ─────────────────────────────────────────────────
let escCurrentUser = null;
let escRecords     = JSON.parse(localStorage.getItem('esc_records') || '[]');

let escSidebarStatusFilter     = 'all';
let escSidebarComplianceFilter = null;
let escSidebarPeriodsFilter    = new Set();   // multi-select
let escCurrentAssetFilter      = 'all';
let escCurrentOutdatedFilter   = new Set();   // multi-select
let escCurrentDateFilter       = new Set();   // multi-select
let escFilterAssetsSet         = new Set();
let escImportBuffer            = null;

document.addEventListener('DOMContentLoaded', () => {
  escSetDefaultDate();
  escRenderAll();
  escRenderPeriodSidebar();
  escRenderSidebarCounts();
});

// ── INIT ──────────────────────────────────────────────────────
function escInitWithUser(u) {
  const BORDER = {
    Admin:   'rgba(255,107,107,0.3)',
    Analyst: 'rgba(88,166,255,0.3)',
    Viewer:  'rgba(105,219,124,0.3)',
  };
  escCurrentUser = {
    email:  u.email, pass: u.password || '', first: u.first, last: u.last, role: u.role,
    bg:     u.bg, color: u.color,
    border: BORDER[u.role] || 'rgba(141,150,160,0.3)',
  };
  escApplyUserUI();
  if (window.SX_BACKEND_MODE) {
    escLoadFromBackend();
  } else {
    escRenderAll();
  }
}

function escDoSignOut()     { unifiedSignOut(); }

function escToggleUserMenu(forceClose) {
  const menu = document.getElementById('esc-user-menu');
  if (forceClose) { menu.classList.remove('open'); return; }
  menu.classList.toggle('open');
}

function escShowAuthError(el, msg) { el.textContent = msg; el.style.display = 'block'; }

function escApplyUserUI() {
  if (!escCurrentUser) return;
  const initials = (escCurrentUser.first[0] + escCurrentUser.last[0]).toUpperCase();
  const av       = document.getElementById('esc-user-avatar-btn');
  av.textContent    = initials;
  av.style.background = escCurrentUser.bg    || 'rgba(141,150,160,0.15)';
  av.style.color      = escCurrentUser.color || '#8d96a0';
  av.style.border     = '1px solid ' + (escCurrentUser.border || 'rgba(141,150,160,0.3)');

  document.getElementById('esc-main-app').style.display       = 'flex';
  document.getElementById('esc-menu-name').textContent        = `${escCurrentUser.first} ${escCurrentUser.last}`;
  document.getElementById('esc-menu-email').textContent       = escCurrentUser.email;
  document.getElementById('esc-menu-role-badge').innerHTML    = `<span class="demo-btn-role role-${escCurrentUser.role.toLowerCase()}">${escCurrentUser.role}</span>`;

  const isAdmin  = escCurrentUser.role === 'Admin';
  const isViewer = escCurrentUser.role === 'Viewer';
  document.getElementById('esc-tab-btn-users').style.display      = isAdmin  ? '' : 'none';
  document.getElementById('esc-tab-btn-import').style.display     = isViewer ? 'none' : '';
  document.getElementById('esc-manage-users-item').style.display  = isAdmin  ? '' : 'none';
  document.querySelectorAll('.btn.btn-primary.btn-sm[onclick="escOpenRecordModal()"]').forEach(el => el.style.display = isViewer ? 'none' : '');
  escRenderUsersGrid();
}

// ── MODALS ────────────────────────────────────────────────────
function escOpenRecordModal() {
  escClearForm();
  document.getElementById('esc-record-modal').classList.add('open');
}
function escCloseRecordModal() { document.getElementById('esc-record-modal').classList.remove('open'); }
function escRecordModalBgClick(e) {
  if (e.target === document.getElementById('esc-record-modal')) escCloseRecordModal();
}
function escCloseUserModal() { document.getElementById('esc-user-modal').classList.remove('open'); }

function escOpenUserModal() {
  document.getElementById('esc-user-modal').classList.add('open');
}

// ── USER MANAGEMENT ───────────────────────────────────────────
function escAddUser() {
  const first = document.getElementById('esc-mu-first').value.trim();
  const last  = document.getElementById('esc-mu-last').value.trim();
  const email = document.getElementById('esc-mu-email').value.trim().toLowerCase();
  const pass  = document.getElementById('esc-mu-pass').value;
  const role  = document.getElementById('esc-mu-role').value;

  if (!first || !last || !email || pass.length < 6) {
    escShowToast('Fill all fields (min 6-char password).', '!');
    return;
  }
  if (sentinelUsers.find(u => u.email.toLowerCase() === email)) {
    escShowToast('Email already registered.', '!');
    return;
  }

  sentinelUsers.push({
    id: Date.now(), email, password: pass, first, last, role,
    initials: (first[0] + last[0]).toUpperCase(),
    color: ({ Admin:'#ff6b6b', Analyst:'#58a6ff', Viewer:'#69db7c' }[role] || '#8d96a0'),
    bg:    ({ Admin:'rgba(255,107,107,0.15)', Analyst:'rgba(88,166,255,0.15)', Viewer:'rgba(105,219,124,0.15)' }[role] || 'rgba(141,150,160,0.15)'),
  });
  localStorage.setItem('sx_users', JSON.stringify(sentinelUsers));
  escCloseUserModal();
  escRenderUsersGrid();
  escShowToast(`User ${first} added.`, 'OK');
}

function escRenderUsersGrid() {
  const grid = document.getElementById('esc-users-grid'); if (!grid) return;
  const colors = { Admin:'#f43f7a', Analyst:'#b06aff', Viewer:'#34d399' };
  grid.innerHTML = sentinelUsers.map((u, i) => `
    <div class="user-card">
      <div class="user-card-avatar" style="background:${colors[u.role] || '#263040'}22;color:${colors[u.role] || '#7a8fa8'}">${(u.first[0] + u.last[0]).toUpperCase()}</div>
      <div class="user-card-info">
        <div class="user-card-name">${u.first} ${u.last}</div>
        <div class="user-card-email">${u.email}</div>
        <div style="margin-top:5px"><span class="demo-btn-role role-${u.role.toLowerCase()}">${u.role}</span></div>
      </div>
      <div class="user-card-actions">
        ${escCurrentUser?.role === 'Admin' && u.email !== escCurrentUser?.email
          ? `<button class="icon-btn" onclick="escDeleteUser(${i})" title="Delete">✕</button>`
          : ''}
      </div>
    </div>`).join('');
}

function escDeleteUser(idx) {
  if (!confirm('Remove this user?')) return;
  sentinelUsers.splice(idx, 1);
  localStorage.setItem('sx_users', JSON.stringify(sentinelUsers));
  escRenderUsersGrid();
  escShowToast('User removed.', '–');
}

// ── TABS ──────────────────────────────────────────────────────
const ESC_ALL_TABS = ['dashboard', 'assets', 'outdated', 'dates', 'compare', 'import', 'users'];

function escSwitchTab(id, el) {
  document.querySelectorAll('#app-esc .tab').forEach(t => t.classList.remove('active'));
  ESC_ALL_TABS.forEach(t => {
    const p = document.getElementById(`esc-tab-${t}`);
    if (p) p.style.display = 'none';
  });
  if (el) el.classList.add('active');
  const panel = document.getElementById(`esc-tab-${id}`);
  if (panel) panel.style.display = '';

  if (id === 'dashboard') escRenderHome();
  if (id === 'assets')    escRenderAssets();
  if (id === 'outdated')  escRenderOutdated();
  if (id === 'dates')     escRenderDates();
  if (id === 'users')     escRenderUsersGrid();
  if (id === 'compare')   escRenderCompareTab();
}

function escSwitchTabById(id) { escSwitchTab(id, document.getElementById(`esc-tab-btn-${id}`)); }
function escGlobalSearch(q)   { if (!q) return; escSwitchTabById('assets'); }

// ── HELPERS ───────────────────────────────────────────────────
function escPct(num, den) { if (!den || den <= 0) return 0; return Math.round((num / den) * 100); }

function escFmtDate(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

function escSaveRecords()   { localStorage.setItem('esc_records', JSON.stringify(escRecords)); }

// ── ESC backend persistence layer ────────────────────────────
async function escLoadFromBackend() {
  if (!window.SX_BACKEND_MODE) return;
  try {
    const rows = await SxAPI.escList();
    escRecords = rows.map(r => ({
      id:         r.id,
      _dbId:      r.id,
      date:       r.date,
      asset:      r.asset,
      totalEP:    r.total_ep,
      totalSrv:   r.total_srv,
      updatedEP:  r.updated_ep,
      updatedSrv: r.updated_srv,
      epPct:      r.ep_pct,
      srvPct:     r.srv_pct,
      notes:      r.notes || '',
    }));
    localStorage.setItem('esc_records', JSON.stringify(escRecords));
    escRenderAll();
    escRenderPeriodSidebar();
    escRenderAssetSidebar();
    escRenderSidebarCounts();
  } catch(err) {
    console.warn('[ESC] Backend load failed, using localStorage:', err.message);
  }
}

async function escPersistRecord(record) {
  escSaveRecords();
  if (!window.SX_BACKEND_MODE) return;
  const payload = {
    date:        record.date,
    asset:       record.asset,
    total_ep:    record.totalEP,
    total_srv:   record.totalSrv,
    updated_ep:  record.updatedEP,
    updated_srv: record.updatedSrv,
    notes:       record.notes || '',
  };
  try {
    if (record._dbId) {
      await SxAPI.escUpdate(record._dbId, payload);
    } else {
      const created = await SxAPI.escCreate(payload);
      record._dbId = created.id;
      record.id    = created.id;
      escSaveRecords();
    }
  } catch(err) {
    console.warn('[ESC] Persist failed:', err.message);
  }
}

async function escDeletePersist(record) {
  escSaveRecords();
  if (!window.SX_BACKEND_MODE || !record._dbId) return;
  try { await SxAPI.escDelete(record._dbId); } catch(err) { console.warn('[ESC] Delete failed:', err.message); }
}


function escSetDefaultDate(){ const el = document.getElementById('esc-f-date'); if (el) el.value = new Date().toISOString().split('T')[0]; }
function escSetText(id, val){ const e = document.getElementById(id); if (e) e.textContent = val; }
function escSetWidth(id, val){ const e = document.getElementById(id); if (e) e.style.width = `${Math.max(0, Math.min(100, val))}%`; }

// ── FORM ──────────────────────────────────────────────────────
// live preview habang nagtatype
function escCalcCompliance() {
  const tEP  = parseFloat(document.getElementById('esc-f-total-ep').value)  || 0;
  const tSrv = parseFloat(document.getElementById('esc-f-total-srv').value) || 0;
  const uEP  = parseFloat(document.getElementById('esc-f-updated-ep').value)  || 0;
  const uSrv = parseFloat(document.getElementById('esc-f-updated-srv').value) || 0;
  const epP  = escPct(uEP, tEP);
  const srvP = escPct(uSrv, tSrv);

  document.getElementById('esc-f-ep-pct').value  = tEP  ? epP  + '%' : '';
  document.getElementById('esc-f-srv-pct').value = tSrv ? srvP + '%' : '';
  document.getElementById('esc-prev-ep-pct').textContent  = `${epP}%`;
  document.getElementById('esc-prev-ep-bar').style.width  = `${epP}%`;
  document.getElementById('esc-prev-srv-pct').textContent = `${srvP}%`;
  document.getElementById('esc-prev-srv-bar').style.width = `${srvP}%`;

  const asset = document.getElementById('esc-f-asset').value || '—';
  const date  = document.getElementById('esc-f-date').value  || '—';
  const notes = document.getElementById('esc-f-notes').value || 'None';
  document.getElementById('esc-preview-card').innerHTML =
    `<strong style="color:var(--text)">${asset}</strong><br/>Date: ${escFmtDate(date)}<br/>Endpoints: ${uEP}/${tEP} updated (${epP}%)<br/>Servers: ${uSrv}/${tSrv} updated (${srvP}%)<br/>Notes: ${notes}`;
}

function escSubmitRecord() {
  const date  = document.getElementById('esc-f-date').value.trim();
  const asset = document.getElementById('esc-f-asset').value.trim();
  const tEP   = parseInt(document.getElementById('esc-f-total-ep').value)    || 0;
  const tSrv  = parseInt(document.getElementById('esc-f-total-srv').value)   || 0;
  const uEP   = parseInt(document.getElementById('esc-f-updated-ep').value)  || 0;
  const uSrv  = parseInt(document.getElementById('esc-f-updated-srv').value) || 0;
  const notes = document.getElementById('esc-f-notes').value.trim();

  if (!date)         return escShowToast('Please enter a date.', '!');
  if (!asset)        return escShowToast('Please enter an asset name.', '!');
  if (!tEP && !tSrv) return escShowToast('Please enter at least one sample count.', '!');

  const cEP  = Math.min(uEP,  tEP);
  const cSrv = Math.min(uSrv, tSrv);

  const record = {
    id: Date.now(), _dbId: null, date, asset,
    totalEP:   tEP,  totalSrv: tSrv,
    updatedEP: cEP,  updatedSrv: cSrv,
    epPct:     escPct(cEP, tEP),
    srvPct:    escPct(cSrv, tSrv),
    notes,
  };

  escRecords.push(record);
  escPersistRecord(record);
  escRenderSidebarCounts();
  escRenderPeriodSidebar();
  escRenderAssetSidebar();
  escClearForm();
  escCloseRecordModal();
  escRenderRecentRecords();
  escShowToast(`Record for "${asset}" saved!`, 'OK');
}

function escClearForm() {
  ['esc-f-asset', 'esc-f-total-ep', 'esc-f-total-srv', 'esc-f-updated-ep', 'esc-f-updated-srv', 'esc-f-ep-pct', 'esc-f-srv-pct', 'esc-f-notes']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  escSetDefaultDate();
  document.getElementById('esc-prev-ep-pct').textContent  = '0%';
  document.getElementById('esc-prev-ep-bar').style.width  = '0%';
  document.getElementById('esc-prev-srv-pct').textContent = '0%';
  document.getElementById('esc-prev-srv-bar').style.width = '0%';
  document.getElementById('esc-preview-card').textContent = 'Fill in the form to preview your record here.';
}

function escClearAllRecords() {
  if (!escRecords.length) return escShowToast('No records to clear.', 'ℹ️');
  if (!confirm('Clear ALL records? This cannot be undone.')) return;
  escRecords = [];
  escSaveRecords();
  escRenderSidebarCounts();
  escRenderPeriodSidebar();
  escRenderAssetSidebar();
  escRenderRecentRecords();
  escRenderHome();
  escShowToast('All records cleared.', '–');
}

// ── RECORDS ───────────────────────────────────────────────────
function escRenderRecentRecords() {
  const sorted  = [...escRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  const canEdit = escCurrentUser && escCurrentUser.role !== 'Viewer';
  const makeHtml = records => {
    if (!records.length) return `<div class="empty-row" style="text-align:center;padding:40px;color:var(--text3)">No records yet — use + Add Record to save one</div>`;
    return records.map(r => {
      const compliant = r.epPct >= 100 && r.srvPct >= 100;
      return `
      <div class="asset-row-item">
        <div class="asset-row-icon2 ${compliant ? 'updated' : 'outdated'}">${compliant ? 'OK' : '!'}</div>
        <div class="asset-row-info2">
          <div class="asset-row-name2">${r.asset}</div>
          <div class="asset-row-sub2">${escFmtDate(r.date)} · EP: ${r.updatedEP}/${r.totalEP} (${r.epPct}%) · SRV: ${r.updatedSrv}/${r.totalSrv} (${r.srvPct}%)</div>
        </div>
        <div class="asset-row-right2">
          <span class="badge ${compliant ? 'badge-updated' : 'badge-outdated'}">${compliant ? 'Compliant' : 'Outdated'}</span>
          ${canEdit ? `<button onclick="escOpenEditRecord(${r.id})" style="background:rgba(76,158,255,0.1);border:1px solid rgba(76,158,255,0.2);color:var(--accent);cursor:pointer;font-size:11px;padding:2px 8px;border-radius:4px;font-family:var(--mono)">Edit</button>` : ''}
          ${canEdit ? `<button onclick="escDeleteRecord(${r.id})" style="background:none;border:none;color:var(--critical);cursor:pointer;font-size:13px;padding:2px" title="Delete">✕</button>` : ''}
        </div>
      </div>`;
    }).join('');
  };
  const tabContainer = document.getElementById('esc-recent-records-tab');
  if (tabContainer) tabContainer.innerHTML = makeHtml(sorted);
}

function escOpenEditRecord(id) {
  const r = escRecords.find(r => r.id === id);
  if (!r) return;
  // Populate edit modal fields
  document.getElementById('esc-edit-id').value          = id;
  document.getElementById('esc-edit-date').value        = r.date;
  document.getElementById('esc-edit-asset').value       = r.asset;
  document.getElementById('esc-edit-total-ep').value    = r.totalEP;
  document.getElementById('esc-edit-total-srv').value   = r.totalSrv;
  document.getElementById('esc-edit-updated-ep').value  = r.updatedEP;
  document.getElementById('esc-edit-updated-srv').value = r.updatedSrv;
  document.getElementById('esc-edit-notes').value       = r.notes || '';
  document.getElementById('esc-edit-modal').classList.add('open');
}

function escCloseEditModal() {
  document.getElementById('esc-edit-modal').classList.remove('open');
}

function escSubmitEditRecord() {
  const id    = parseInt(document.getElementById('esc-edit-id').value);
  const idx   = escRecords.findIndex(r => r.id === id);
  if (idx === -1) return;

  const tEP   = parseInt(document.getElementById('esc-edit-total-ep').value)    || 0;
  const tSrv  = parseInt(document.getElementById('esc-edit-total-srv').value)   || 0;
  const uEP   = Math.min(parseInt(document.getElementById('esc-edit-updated-ep').value)  || 0, tEP);
  const uSrv  = Math.min(parseInt(document.getElementById('esc-edit-updated-srv').value) || 0, tSrv);
  const date  = document.getElementById('esc-edit-date').value.trim();
  const asset = document.getElementById('esc-edit-asset').value.trim();
  const notes = document.getElementById('esc-edit-notes').value.trim();

  if (!date || !asset) return escShowToast('Date and asset are required.', '!');

  const updated = {
    ...escRecords[idx], date, asset,
    totalEP: tEP, totalSrv: tSrv,
    updatedEP: uEP, updatedSrv: uSrv,
    epPct:  escPct(uEP,  tEP),
    srvPct: escPct(uSrv, tSrv),
    notes,
  };
  escRecords[idx] = updated;
  escPersistRecord(updated);
  escCloseEditModal();
  escRenderSidebarCounts();
  escRenderPeriodSidebar();
  escRenderAssetSidebar();
  escRenderAll();
  escShowToast(`Record for "${asset}" updated.`, '✓');
}

function escDeleteRecord(id) {
  const rec = escRecords.find(r => r.id === id);
  escRecords = escRecords.filter(r => r.id !== id);
  if (rec) escDeletePersist(rec);
  escRenderSidebarCounts();
  escRenderPeriodSidebar();
  escRenderAssetSidebar();
  escRenderRecentRecords();
  escRenderAll();
  escShowToast('Record deleted.', '–');
}

// ── DATA AGGREGATION ──────────────────────────────────────────
function escGetAssetSummaries() {
  const map = {};
  escRecords.forEach(r => {
    if (!map[r.asset]) map[r.asset] = { asset:r.asset, totalEP:0, totalSrv:0, updatedEP:0, updatedSrv:0, dates:[], notes:[] };
    map[r.asset].totalEP   += r.totalEP;   map[r.asset].totalSrv   += r.totalSrv;
    map[r.asset].updatedEP += r.updatedEP; map[r.asset].updatedSrv += r.updatedSrv;
    map[r.asset].dates.push(r.date);
    if (r.notes) map[r.asset].notes.push(r.notes);
  });
  return Object.values(map).map(a => ({
    ...a,
    epPct:      escPct(a.updatedEP,  a.totalEP),
    srvPct:     escPct(a.updatedSrv, a.totalSrv),
    latestDate: a.dates.sort().reverse()[0],
    // An asset is "compliant" when BOTH EP and SRV are fully updated
    isUpdated:  a.totalEP > 0 && a.updatedEP >= a.totalEP && (a.totalSrv === 0 || a.updatedSrv >= a.totalSrv),
  }));
}

function escGetGlobalTotals() {
  const s        = escGetAssetSummaries();
  const tEP      = s.reduce((x, a) => x + a.totalEP,   0);
  const tSrv     = s.reduce((x, a) => x + a.totalSrv,  0);
  const uEP      = s.reduce((x, a) => x + a.updatedEP, 0);
  const uSrv     = s.reduce((x, a) => x + a.updatedSrv,0);
  const compliant    = s.filter(a =>  a.isUpdated).length;
  const nonCompliant = s.filter(a => !a.isUpdated).length;
  const lastDate = escRecords.length
    ? [...escRecords].sort((a, b) => new Date(b.date) - new Date(a.date))[0].date
    : null;
  // Main compliance % = compliant assets / total assets (not raw EP counts)
  const assetCompliancePct = escPct(compliant, s.length);
  return {
    totalEP: tEP, totalSrv: tSrv, updEP: uEP, updSrv: uSrv, lastDate, summaries: s,
    compliantCount: compliant, nonCompliantCount: nonCompliant,
    assetCompliancePct,   // ← primary % shown on gauge
  };
}

// ── SIDEBAR ───────────────────────────────────────────────────
function escRenderSidebarCounts() {
  const s       = escGetAssetSummaries();
  const updated = s.filter(a =>  a.isUpdated).length;
  const outdated= s.filter(a => !a.isUpdated).length;
  const high    = s.filter(a => a.epPct >= 80).length;
  const med     = s.filter(a => a.epPct >= 50 && a.epPct < 80).length;
  const low     = s.filter(a => a.epPct < 50).length;
  escSetText('esc-count-all-assets', s.length);
  escSetText('esc-count-updated',    updated);
  escSetText('esc-count-outdated',   outdated);
  escSetText('esc-count-comp-high',  high);
  escSetText('esc-count-comp-medium',med);
  escSetText('esc-count-comp-low',   low);
}

function escRenderPeriodSidebar() {
  const periods   = [...new Set(escRecords.map(r => r.date.slice(0, 7)))].sort().reverse();
  const container = document.getElementById('esc-period-sidebar'); if (!container) return;
  const allActive = escSidebarPeriodsFilter.size === 0;
  const allItem   = `<div class="sidebar-month ${allActive ? 'active' : ''}" onclick="escSidebarFilterAllPeriods(this)">
    <span>All periods</span>
    <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${escRecords.length}</span>
  </div>`;
  const items = periods.map(p => {
    const label    = new Date(p + '-01').toLocaleDateString('en-US', { year:'numeric', month:'short' });
    const count    = escRecords.filter(r => r.date.slice(0, 7) === p).length;
    const isActive = escSidebarPeriodsFilter.has(p);
    return `<div class="sidebar-month ${isActive ? 'active' : ''}" onclick="escSidebarTogglePeriod('${p}',this)">
      <span>${label}</span><span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${count}</span>
    </div>`;
  }).join('');
  container.innerHTML = allItem + items;
}

function escSidebarTogglePeriod(period, el) {
  if (escSidebarPeriodsFilter.has(period)) escSidebarPeriodsFilter.delete(period);
  else escSidebarPeriodsFilter.add(period);
  // sync dates + outdated filters
  escCurrentDateFilter    = new Set(escSidebarPeriodsFilter);
  escCurrentOutdatedFilter= new Set(escSidebarPeriodsFilter);
  escRenderPeriodSidebar();
  escSwitchTabById('dates');
}

function escSidebarFilterAllPeriods(el) {
  escSidebarPeriodsFilter.clear();
  escCurrentDateFilter     = new Set();
  escCurrentOutdatedFilter = new Set();
  escRenderPeriodSidebar();
  escSwitchTabById('dates');
}

function escRenderAssetSidebar() {
  const list   = document.getElementById('esc-asset-list'); if (!list) return;
  const assets = [...new Set(escRecords.map(r => r.asset).filter(Boolean))];
  const allActive = escFilterAssetsSet.size === 0;
  const allItem = `<div class="sidebar-item${allActive ? ' active' : ''}" onclick="escSidebarFilterAllAssets(this)">
    <div class="sidebar-item-name"><span class="sidebar-dot" style="background:var(--accent);opacity:0.5"></span>All assets</div>
    <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${escRecords.length}</span>
  </div>`;
  list.innerHTML = allActive
    ? allItem + assets.map(a => {
        const count = escRecords.filter(r => r.asset === a).length;
        return `<div class="sidebar-item" onclick="escSidebarFilterAsset('${a.replace(/'/g, "\\'")}',this)">
          <div class="sidebar-item-name" style="font-size:12px">${a}</div>
          <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${count}</span>
        </div>`;
      }).join('')
    : allItem + assets.map(a => {
        const count  = escRecords.filter(r => r.asset === a).length;
        const active = escFilterAssetsSet.has(a);
        return `<div class="sidebar-item${active ? ' active' : ''}" onclick="escSidebarFilterAsset('${a.replace(/'/g, "\\'")}',this)">
          <div class="sidebar-item-name" style="font-size:12px">${a}</div>
          <span style="font-family:var(--mono);font-size:10px;color:var(--text3)">${count}</span>
        </div>`;
      }).join('');
}

function escSidebarFilterAllAssets(el) {
  escFilterAssetsSet.clear();
  document.querySelectorAll('#esc-asset-list .sidebar-item').forEach(i => i.classList.remove('active'));
  el.classList.add('active');
  escRenderAll();
}

function escSidebarFilterAsset(asset, el) {
  document.getElementById('esc-asset-list').querySelector('.sidebar-item').classList.remove('active');
  if (escFilterAssetsSet.has(asset)) { escFilterAssetsSet.delete(asset); el.classList.remove('active'); }
  else { escFilterAssetsSet.add(asset); el.classList.add('active'); }
  if (escFilterAssetsSet.size === 0)
    document.getElementById('esc-asset-list').querySelector('.sidebar-item').classList.add('active');
  escRenderAll();
}

function escSidebarFilterStatus(status, el) {
  escSidebarStatusFilter = status; escSidebarComplianceFilter = null;
  document.querySelectorAll('#app-esc .sidebar-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  escCurrentAssetFilter = status;
  escSwitchTabById('assets');
}

function escSidebarFilterCompliance(level, el) {
  escSidebarComplianceFilter = level; escSidebarStatusFilter = 'all';
  document.querySelectorAll('#app-esc .sidebar-item').forEach(i => i.classList.remove('active'));
  if (el) el.classList.add('active');
  escSwitchTabById('assets');
}

function escSidebarFilterPeriod(period, el) {
  escSidebarTogglePeriod(period, el);
}

// ── HOME / DASHBOARD ──────────────────────────────────────────
function escRenderHome() {
  const t = escGetGlobalTotals();
  // Primary % = compliant assets / total assets
  const compliancePct = t.assetCompliancePct;
  const total         = t.summaries.length;

  escSetText('esc-stat-total-ep',  t.totalEP);
  escSetText('esc-stat-updated',   t.updEP);
  escSetText('esc-stat-outdated',  t.totalEP - t.updEP);
  escSetText('esc-stat-total-srv', t.totalSrv);
  escSetText('esc-band-compliance', compliancePct + '%');
  escSetText('esc-band-assets',    total);
  escSetText('esc-band-ep',        t.totalEP);
  escSetText('esc-band-srv',       t.totalSrv);
  escSetText('esc-band-date',      escFmtDate(t.lastDate));

  // Gauge ring — driven by asset compliance %
  const circ   = 2 * Math.PI * 72;
  const offset = circ - (compliancePct / 100) * circ;
  const ring   = document.getElementById('esc-gauge-ring');
  if (ring) {
    ring.style.strokeDashoffset = offset;
    ring.style.stroke = compliancePct >= 80 ? 'var(--green)' : compliancePct >= 50 ? 'var(--high)' : 'var(--critical)';
  }
  // Gauge center text: "X / Y assets"
  escSetText('esc-gauge-text', compliancePct + '%');
  // Sub-label under gauge showing raw count
  const gaugeSubEl = document.getElementById('esc-gauge-sub');
  if (gaugeSubEl) gaugeSubEl.textContent = `${t.compliantCount} / ${total} assets compliant`;

  // EP and SRV detail bars (raw endpoint counts — kept as secondary info)
  const epGP       = escPct(t.updEP,  t.totalEP);
  const srvGP      = escPct(t.updSrv, t.totalSrv);
  const outdatedPct= t.totalEP > 0 ? (100 - epGP) : 0;
  escSetText('esc-gauge-updated-pct',  epGP + '%');       escSetWidth('esc-gauge-bar-updated',  epGP);
  escSetText('esc-gauge-outdated-pct', outdatedPct + '%'); escSetWidth('esc-gauge-bar-outdated', outdatedPct);

  // Compliant/non-compliant bars
  escSetText('esc-rem-compliant',    `${t.compliantCount} / ${total} (${compliancePct}%)`);
  escSetWidth('esc-rem-bar-compliant', compliancePct);
  escSetText('esc-rem-noncompliant', `${t.nonCompliantCount} / ${total} (${escPct(t.nonCompliantCount, total)}%)`);
  escSetWidth('esc-rem-bar-noncompliant', escPct(t.nonCompliantCount, total));
  escSetText('esc-rem-total', total);
  escSetWidth('esc-rem-bar-total', total > 0 ? 100 : 0);

  escRenderBarChart(t.summaries);
  escRenderHomeTable(t.summaries);
}

function escRenderBarChart(summaries) {
  const chart = document.getElementById('esc-bar-chart');
  if (!summaries.length) {
    chart.innerHTML = `<div style="display:flex;align-items:center;justify-content:center;flex-direction:column;gap:8px;color:var(--text3);width:100%;min-height:160px"><div style="font-size:13px;letter-spacing:.08em;font-family:var(--mono)">NO DATA</div><div style="font-size:12px">No data yet — add records</div></div>`;
    return;
  }

  const containerW = chart.offsetWidth || 500;
  const HEIGHT = 140, LPAD = 38, RPAD = 16, BPAD = 24, TOP = 18;
  const n       = summaries.length;
  const totalInner = containerW - LPAD - RPAD;
  const slotW   = Math.floor(totalInner / n);
  const BARW    = Math.min(Math.max(Math.floor(slotW * 0.45), 16), 48);
  const svgH    = HEIGHT + BPAD + TOP;
  const gridLines = [0, 25, 50, 75, 100];

  let svg = `<svg width="${containerW}" height="${svgH}" viewBox="0 0 ${containerW} ${svgH}" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<defs>`;
  summaries.forEach((a, i) => {
    const pct = a.epPct;
    const col = pct >= 100 ? '#34d399' : pct >= 80 ? '#a78bfa' : pct >= 50 ? '#f97316' : '#f43f7a';
    svg += `<linearGradient id="ebg${i}" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${col}" stop-opacity="0.9"/><stop offset="100%" stop-color="${col}" stop-opacity="0.2"/></linearGradient>`;
    svg += `<filter id="egw${i}" x="-60%" y="-60%" width="220%" height="220%"><feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="${col}" flood-opacity="0.4"/></filter>`;
  });
  svg += `</defs>`;

  gridLines.forEach(g => {
    const y = Math.round(TOP + HEIGHT - (g / 100) * HEIGHT) + 0.5;
    svg += `<line x1="${LPAD}" y1="${y}" x2="${containerW - RPAD}" y2="${y}" stroke="rgba(176,106,255,0.07)" stroke-width="1"/>`;
    svg += `<text x="${LPAD - 5}" y="${y + 3}" text-anchor="end" font-family="IBM Plex Mono,monospace" font-size="8" fill="rgba(255,255,255,0.2)">${g}%</text>`;
  });

  summaries.forEach((a, i) => {
    const slotX = LPAD + i * slotW;
    const x     = slotX + (slotW - BARW) / 2;
    const pct   = a.epPct;
    const barH  = Math.max(Math.round((pct / 100) * HEIGHT), 3);
    const y     = TOP + HEIGHT - barH;
    const col   = pct >= 100 ? '#34d399' : pct >= 80 ? '#a78bfa' : pct >= 50 ? '#f97316' : '#f43f7a';
    svg += `<rect x="${x}" y="${y}" width="${BARW}" height="${barH}" rx="4" ry="4" fill="url(#ebg${i})" filter="url(#egw${i})"/>`;
    svg += `<text x="${x + BARW / 2}" y="${y - 5}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="9" font-weight="700" fill="${col}">${pct}%</text>`;
    const label = a.asset.length > 10 ? a.asset.slice(0, 9) + '…' : a.asset;
    svg += `<text x="${slotX + slotW / 2}" y="${TOP + HEIGHT + BPAD - 4}" text-anchor="middle" font-family="IBM Plex Mono,monospace" font-size="8.5" fill="rgba(255,255,255,0.4)">${label}</text>`;
  });

  svg += `<line x1="${LPAD}" y1="${TOP + HEIGHT}" x2="${containerW - RPAD}" y2="${TOP + HEIGHT}" stroke="rgba(176,106,255,0.2)" stroke-width="1"/>`;
  svg += `</svg>`;
  chart.innerHTML = svg;
}

function escRenderHomeTable(summaries) {
  const tbody = document.getElementById('esc-home-table-body');
  if (!summaries.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="6">No assets recorded — add a record to begin</td></tr>`;
    return;
  }
  const sorted = [...summaries].sort((a, b) => b.epPct - a.epPct);
  tbody.innerHTML = sorted.map(a => {
    const dotColor = a.isUpdated ? 'var(--green)' : 'var(--critical)';
    const pctColor = a.epPct >= 80 ? 'var(--green)' : a.epPct >= 50 ? 'var(--high)' : 'var(--critical)';
    return `<tr>
      <td><div class="asset-name"><div class="asset-dot" style="background:${dotColor}"></div>${a.asset}</div></td>
      <td class="mono-text">${a.totalEP}</td>
      <td class="mono-text">${a.totalSrv}</td>
      <td class="mono-text">${a.updatedEP}</td>
      <td><span style="font-family:var(--mono);font-size:12px;font-weight:700;color:${pctColor}">${a.epPct}%</span>
        <div class="progress-track" style="margin-top:4px">
          <div class="progress-fill ${a.epPct >= 100 ? 'updated' : a.epPct >= 50 ? 'accent' : 'outdated'}" style="width:${a.epPct}%"></div>
        </div></td>
      <td><span class="badge ${a.isUpdated ? 'badge-updated' : 'badge-outdated'}">${a.isUpdated ? 'Updated' : 'Outdated'}</span></td>
    </tr>`;
  }).join('');
}

// ── ASSETS TAB ────────────────────────────────────────────────
function escRenderAssets() {
  const summaries = escGetAssetSummaries();
  let filtered;
  if (escSidebarComplianceFilter) {
    filtered = summaries.filter(a =>
      escSidebarComplianceFilter === 'high'   ? a.epPct >= 80 :
      escSidebarComplianceFilter === 'medium' ? a.epPct >= 50 && a.epPct < 80 :
      a.epPct < 50);
  } else {
    filtered = escCurrentAssetFilter === 'all'     ? summaries :
               escCurrentAssetFilter === 'updated' ? summaries.filter(a =>  a.isUpdated) :
                                                     summaries.filter(a => !a.isUpdated);
  }

  escSetText('esc-asset-count-meta', `${filtered.length} asset${filtered.length !== 1 ? 's' : ''}`);
  escRenderSidebarCounts();

  const list = document.getElementById('esc-asset-list-tab');
  list.innerHTML = !filtered.length
    ? `<div class="empty-row" style="text-align:center;padding:48px;color:var(--text3)">No assets match this filter</div>`
    : filtered.map(a => `
      <div class="asset-row-item">
        <div class="asset-row-icon2 ${a.isUpdated ? 'updated' : 'outdated'}">${a.isUpdated ? 'OK' : '!'}</div>
        <div class="asset-row-info2">
          <div class="asset-row-name2">${a.asset}</div>
          <div class="asset-row-sub2">EP: ${a.updatedEP}/${a.totalEP} (${a.epPct}%) · SRV: ${a.updatedSrv}/${a.totalSrv} (${a.srvPct}%) · Last: ${escFmtDate(a.latestDate)}</div>
        </div>
        <div class="asset-row-right2">
          <span class="badge ${a.isUpdated ? 'badge-updated' : 'badge-outdated'}">${a.isUpdated ? 'Updated' : 'Outdated'}</span>
          <span class="mono-text" style="color:var(--text3);font-size:10px">${a.epPct}%</span>
        </div>
      </div>`).join('');

  const epList  = document.getElementById('esc-asset-ep-progress');
  const srvList = document.getElementById('esc-asset-srv-progress');
  if (!summaries.length) {
    epList.innerHTML  = `<div style="color:var(--text3);font-size:12px;padding:8px">No data yet</div>`;
    srvList.innerHTML = `<div style="color:var(--text3);font-size:12px;padding:8px">No data yet</div>`;
    return;
  }
  epList.innerHTML = summaries.map(a => {
    const c = a.epPct >= 100 ? 'var(--green)' : a.epPct >= 50 ? 'var(--high)' : 'var(--critical)';
    return `<div><div class="status-row-label"><span>${a.asset}</span><strong style="color:${c}">${a.epPct}%</strong></div><div class="status-bar-bg"><div class="status-bar-fill" style="background:${c};width:${a.epPct}%"></div></div></div>`;
  }).join('');
  srvList.innerHTML = summaries.map(a => {
    const c = a.srvPct >= 100 ? 'var(--green)' : a.srvPct >= 50 ? 'var(--high)' : 'var(--critical)';
    return `<div><div class="status-row-label"><span>${a.asset}</span><strong style="color:${c}">${a.srvPct}%</strong></div><div class="status-bar-bg"><div class="status-bar-fill" style="background:${c};width:${a.srvPct}%"></div></div></div>`;
  }).join('');
}

function escFilterAssets(filter, el) {
  escCurrentAssetFilter  = filter;
  escSidebarComplianceFilter = null;
  document.querySelectorAll('[id^="esc-pill-"]').forEach(b => b.classList.remove('btn-primary'));
  if (el) el.classList.add('btn-primary');
  escRenderAssets();
}

// ── OUTDATED TAB ──────────────────────────────────────────────
function escRenderOutdated() {
  const summaries = escGetAssetSummaries();
  const outdated  = summaries.filter(a => !a.isUpdated);
  escBuildDateChips('esc-outdated-date-filter', 'escFilterOutdated');

  const filtered = escCurrentOutdatedFilter.size === 0
    ? outdated
    : outdated.filter(a => escCurrentOutdatedFilter.has(a.latestDate.slice(0, 7)));

  escSetText('esc-outdated-count', `${filtered.length} asset${filtered.length !== 1 ? 's' : ''}`);
  escRenderSidebarCounts();

  const list = document.getElementById('esc-outdated-alert-list');
  list.innerHTML = !filtered.length
    ? `<div class="empty-row" style="text-align:center;padding:48px;color:var(--text3)">No outdated assets — all compliant</div>`
    : filtered.map(a => {
        const outdEP  = a.totalEP  - a.updatedEP;
        const outdSrv = a.totalSrv - a.updatedSrv;
        const sev     = a.epPct < 50 ? 'critical' : 'high';
        return `<div class="alert-row"><div class="alert-sev-bar ${sev}"></div>
          <div class="alert-info"><div class="alert-title">${a.asset}</div>
            <div class="alert-meta"><span>${escFmtDate(a.latestDate)}</span><span>${outdEP} EP outdated</span><span>${outdSrv} SRV outdated</span><span>EP: ${a.epPct}% &middot; SRV: ${a.srvPct}%</span></div>
          </div>
          <div class="alert-actions"><span class="badge ${sev === 'critical' ? 'badge-outdated' : 'badge-pending'}">${sev === 'critical' ? 'CRITICAL' : 'HIGH'}</span></div>
        </div>`;
      }).join('');

  const tbody = document.getElementById('esc-outdated-table-body');
  tbody.innerHTML = !filtered.length
    ? `<tr class="empty-row"><td colspan="7">No outdated assets found</td></tr>`
    : filtered.map(a => {
        const outdEP  = a.totalEP  - a.updatedEP;
        const outdSrv = a.totalSrv - a.updatedSrv;
        const sev     = a.epPct < 50 ? 'badge-outdated' : 'badge-pending';
        return `<tr>
          <td><div class="asset-name"><div class="asset-dot" style="background:var(--critical)"></div>${a.asset}</div></td>
          <td class="mono-text">${escFmtDate(a.latestDate)}</td>
          <td class="mono-text" style="color:var(--critical)">${outdEP}</td>
          <td class="mono-text" style="color:var(--high)">${outdSrv}</td>
          <td><span style="color:${a.epPct  >= 50 ? 'var(--high)' : 'var(--critical)'};font-family:var(--mono);font-weight:700">${a.epPct}%</span></td>
          <td><span style="color:${a.srvPct >= 50 ? 'var(--high)' : 'var(--critical)'};font-family:var(--mono);font-weight:700">${a.srvPct}%</span></td>
          <td><span class="badge ${sev}">${a.epPct < 50 ? 'Critical' : 'High'}</span></td>
        </tr>`;
      }).join('');
}

function escFilterOutdated(filter, el) {
  if (filter === 'all') {
    escCurrentOutdatedFilter = new Set();
    escSidebarPeriodsFilter  = new Set();
    escCurrentDateFilter     = new Set();
    document.querySelectorAll('#esc-outdated-date-filter .month-pill').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
  } else {
    if (escCurrentOutdatedFilter.has(filter)) escCurrentOutdatedFilter.delete(filter);
    else escCurrentOutdatedFilter.add(filter);
    escSidebarPeriodsFilter = new Set(escCurrentOutdatedFilter);
    escCurrentDateFilter    = new Set(escCurrentOutdatedFilter);
    document.querySelectorAll('#esc-outdated-date-filter .month-pill').forEach(c => {
      const p = c.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      if (p === 'all') c.classList.toggle('active', escCurrentOutdatedFilter.size === 0);
      else if (p) c.classList.toggle('active', escCurrentOutdatedFilter.has(p));
    });
  }
  escRenderPeriodSidebar();
  escRenderOutdated();
}

// ── DATES TAB ─────────────────────────────────────────────────
function escRenderDates() {
  const sorted   = [...escRecords].sort((a, b) => new Date(b.date) - new Date(a.date));
  const filtered = escCurrentDateFilter.size === 0
    ? sorted
    : sorted.filter(r => escCurrentDateFilter.has(r.date.slice(0, 7)));

  escBuildDateChips('esc-date-filter-chips', 'escFilterDates');
  escSetText('esc-dates-count', `${filtered.length} record${filtered.length !== 1 ? 's' : ''}`);

  const timeline = document.getElementById('esc-timeline-list');
  timeline.innerHTML = !filtered.length
    ? `<div style="text-align:center;padding:48px;color:var(--text3)">No records found</div>`
    : filtered.map(r => {
        const status = r.epPct >= 100 && r.srvPct >= 100 ? 'updated' : r.epPct >= 50 ? 'pending' : 'outdated';
        const icon   = status === 'updated' ? 'OK' : status === 'pending' ? '⏳' : '!';
        const canEdit = escCurrentUser.role !== 'Viewer';
        return `<div class="timeline-item"><div class="timeline-dot ${status}">${icon}</div>
          <div class="timeline-content"><div class="timeline-title">${r.asset}</div>
            <div class="timeline-sub">EP: ${r.updatedEP}/${r.totalEP} (${r.epPct}%) · SRV: ${r.updatedSrv}/${r.totalSrv} (${r.srvPct}%)</div>
            ${r.notes ? `<div class="timeline-sub" style="color:var(--text3);font-style:italic">${r.notes}</div>` : ''}
            <div class="timeline-date">${escFmtDate(r.date)}</div>
          </div>
          <div style="display:flex;flex-direction:column;align-items:flex-end;gap:6px">
            <span class="badge ${status === 'updated' ? 'badge-updated' : status === 'pending' ? 'badge-pending' : 'badge-outdated'}">${status === 'updated' ? '✓ Compliant' : status === 'pending' ? 'Partial' : 'Outdated'}</span>
            ${canEdit ? `<div style="display:flex;gap:4px">
              <button onclick="escOpenEditRecord(${r.id})" style="background:rgba(76,158,255,0.1);border:1px solid rgba(76,158,255,0.2);color:var(--accent);cursor:pointer;font-size:11px;padding:2px 8px;border-radius:4px;font-family:var(--mono)">Edit</button>
              <button onclick="escDeleteRecord(${r.id})" style="background:rgba(244,63,122,0.08);border:1px solid rgba(244,63,122,0.15);color:var(--critical);cursor:pointer;font-size:11px;padding:2px 8px;border-radius:4px;font-family:var(--mono)">✕</button>
            </div>` : ''}
          </div>
        </div>`;
      }).join('');

  const tbody = document.getElementById('esc-dates-table-body');
  tbody.innerHTML = !filtered.length
    ? `<tr class="empty-row"><td colspan="4">No records yet</td></tr>`
    : filtered.map(r => {
        const ec = r.epPct  >= 100 ? 'var(--green)' : r.epPct  >= 50 ? 'var(--high)' : 'var(--critical)';
        const sc = r.srvPct >= 100 ? 'var(--green)' : r.srvPct >= 50 ? 'var(--high)' : 'var(--critical)';
        return `<tr>
          <td class="mono-text">${escFmtDate(r.date)}</td>
          <td><div class="asset-name">${r.asset}</div></td>
          <td><span style="font-family:var(--mono);font-weight:700;color:${ec}">${r.epPct}%</span></td>
          <td><span style="font-family:var(--mono);font-weight:700;color:${sc}">${r.srvPct}%</span></td>
        </tr>`;
      }).join('');
}

function escFilterDates(filter, el) {
  if (filter === 'all') {
    escCurrentDateFilter     = new Set();
    escSidebarPeriodsFilter  = new Set();
    escCurrentOutdatedFilter = new Set();
    document.querySelectorAll('#esc-date-filter-chips .month-pill').forEach(c => c.classList.remove('active'));
    if (el) el.classList.add('active');
  } else {
    if (escCurrentDateFilter.has(filter)) escCurrentDateFilter.delete(filter);
    else escCurrentDateFilter.add(filter);
    escSidebarPeriodsFilter  = new Set(escCurrentDateFilter);
    escCurrentOutdatedFilter = new Set(escCurrentDateFilter);
    document.querySelectorAll('#esc-date-filter-chips .month-pill').forEach(c => {
      const p = c.getAttribute('onclick')?.match(/'([^']+)'/)?.[1];
      if (p === 'all') c.classList.toggle('active', escCurrentDateFilter.size === 0);
      else if (p) c.classList.toggle('active', escCurrentDateFilter.has(p));
    });
  }
  escRenderPeriodSidebar();
  escRenderDates();
}

function escBuildDateChips(containerId, callbackName) {
  const periods   = [...new Set(escRecords.map(r => r.date.slice(0, 7)))].sort().reverse();
  const container = document.getElementById(containerId);
  container.querySelectorAll('.month-pill:not(:first-child)').forEach(c => c.remove());
  // update "All" pill active state
  const allPill = container.querySelector('.month-pill');
  if (allPill) {
    const filterSet = callbackName === 'escFilterDates' ? escCurrentDateFilter : escCurrentOutdatedFilter;
    allPill.classList.toggle('active', filterSet.size === 0);
  }
  periods.forEach(p => {
    const chip = document.createElement('span');
    chip.className = 'month-pill';
    chip.textContent = new Date(p + '-01').toLocaleDateString('en-US', { year:'numeric', month:'short' });
    chip.setAttribute('onclick', `${callbackName}('${p}',this)`);
    const filterSet = callbackName === 'escFilterDates' ? escCurrentDateFilter : escCurrentOutdatedFilter;
    if (filterSet.has(p)) chip.classList.add('active');
    container.appendChild(chip);
  });
}

// ── IMPORT ────────────────────────────────────────────────────
function escDragOver(e)    { e.preventDefault(); document.getElementById('esc-drop-zone').classList.add('drag'); }
function escDragLeave()    { document.getElementById('esc-drop-zone').classList.remove('drag'); }
function escDropFile(e)    { e.preventDefault(); escDragLeave(); escProcessFile(e.dataTransfer.files[0]); }
function escHandleFileInput(input) { if (input.files[0]) escProcessFile(input.files[0]); }

function escProcessFile(file) {
  const reader = new FileReader();
  reader.onload = e => {
    try {
      let rows;
      if (file.name.toLowerCase().endsWith('.csv')) {
        const text  = new TextDecoder().decode(e.target.result);
        const lines = text.trim().split('\n');
        const hdrs  = lines[0].split(',').map(h => h.replace(/^"|"$/g, '').trim());
        rows = lines.slice(1)
          .map(line => {
            const vals = line.split(',').map(v => v.replace(/^"|"$/g, '').trim());
            const obj  = {};
            hdrs.forEach((h, i) => obj[h] = vals[i] || null);
            return obj;
          })
          // Skip rows where Asset is missing
          .filter(r => {
            const asset = r['Asset'] || r['asset'] || r['ASSET'] || '';
            return String(asset).trim() !== '' && String(asset).trim() !== 'null';
          });
      } else {
        const wb = XLSX.read(e.target.result, { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        rows = XLSX.utils.sheet_to_json(ws, {
          defval:    null,
          blankrows: false,
          raw:       false,
        }).filter(r => {
          const asset = r['Asset'] || r['asset'] || r['ASSET'] || r['Hostname'] || '';
          return String(asset).trim() !== '' && String(asset).trim() !== 'null';
        });
      }
      if (!rows.length) return escShowToast('No valid data rows found in the file.', '!');
      escImportBuffer = rows;
      escShowImportPreview(rows);
    } catch (err) { escShowToast('Could not read file: ' + err.message, '!'); }
  };
  reader.readAsArrayBuffer(file);
}

function escShowImportPreview(rows) {
  if (!rows.length) return;
  document.getElementById('esc-import-preview').style.display = '';
  document.getElementById('esc-preview-count').textContent    = rows.length;
  const keys = Object.keys(rows[0]).filter(k => rows.some(r => r[k] !== null && r[k] !== ''));
  document.getElementById('esc-preview-header').innerHTML = keys.map(k => `<th>${k}</th>`).join('');
  document.getElementById('esc-preview-body').innerHTML   =
    rows.slice(0, 8).map(r =>
      `<tr>${keys.map(k => `<td style="color:var(--text2);font-size:12px">${r[k] ?? ''}</td>`).join('')}</tr>`
    ).join('') +
    (rows.length > 8 ? `<tr><td colspan="${keys.length}" style="color:var(--text3);font-size:11px;padding:8px 14px">…and ${rows.length - 8} more rows</td></tr>` : '');
}
}

async function escConfirmImport() {
  if (!escImportBuffer) return;
  const records = [];
  escImportBuffer.forEach(r => {
    const key = (...names) => {
      for (const n of names) {
        const v = r[n] ?? r[n.toLowerCase()] ?? r[n.toUpperCase()] ?? r[n.replace(/ /g,'_')] ?? '';
        if (v !== '' && v !== null && v !== undefined) return String(v).trim();
      }
      return '';
    };
    const date  = key('Date','date','DATE') || new Date().toISOString().split('T')[0];
    const asset = key('Asset','asset','ASSET','Hostname');
    if (!asset) return;
    const tEP  = parseInt(key('Total EP','total_ep','TotalEP','Total Endpoints','total ep')) || 0;
    const tSrv = parseInt(key('Total SRV','total_srv','TotalSRV','Total Servers','total srv')) || 0;
    const uEP  = parseInt(key('Updated EP','updated_ep','UpdatedEP','Updated Endpoints','updated ep')) || 0;
    const uSrv = parseInt(key('Updated SRV','updated_srv','UpdatedSRV','Updated Servers','updated srv')) || 0;
    const notes = key('Notes','notes','Remarks','remarks','Comments') || '';
    records.push({ date, asset, total_ep: tEP, total_srv: tSrv, updated_ep: Math.min(uEP,tEP), updated_srv: Math.min(uSrv,tSrv), notes });
  });

  escImportBuffer = null;
  document.getElementById('esc-import-preview').style.display = 'none';
  document.getElementById('esc-import-file-input').value = '';

  if (window.SX_BACKEND_MODE && records.length) {
    try {
      await SxAPI.escBulk(records);
      await escLoadFromBackend();
    } catch(err) {
      console.warn('[ESC] Bulk import failed, saving locally:', err.message);
      records.forEach((r, i) => escRecords.push({ id: Date.now()+i, _dbId: null, date: r.date, asset: r.asset,
        totalEP: r.total_ep, totalSrv: r.total_srv, updatedEP: r.updated_ep, updatedSrv: r.updated_srv,
        epPct: escPct(r.updated_ep, r.total_ep), srvPct: escPct(r.updated_srv, r.total_srv), notes: r.notes }));
      escSaveRecords();
      escRenderSidebarCounts(); escRenderPeriodSidebar(); escRenderAssetSidebar(); escRenderAll();
    }
  } else {
    records.forEach((r, i) => escRecords.push({ id: Date.now()+i, _dbId: null, date: r.date, asset: r.asset,
      totalEP: r.total_ep, totalSrv: r.total_srv, updatedEP: r.updated_ep, updatedSrv: r.updated_srv,
      epPct: escPct(r.updated_ep, r.total_ep), srvPct: escPct(r.updated_srv, r.total_srv), notes: r.notes }));
    escSaveRecords();
    escRenderSidebarCounts(); escRenderPeriodSidebar(); escRenderAssetSidebar(); escRenderAll();
  }
  escShowToast(`Imported ${records.length} records successfully!`, '✓');
}

function escCancelImport() {
  escImportBuffer = null;
  document.getElementById('esc-import-preview').style.display = 'none';
  document.getElementById('esc-import-file-input').value = '';
}

// ── EXPORT MODAL ──────────────────────────────────────────────
let escExportFormat = 'xlsx';

function escOpenExportModal() {
  if (!escRecords.length) return escShowToast('No records to export.', 'ℹ️');
  const periods = [...new Set(escRecords.map(r => r.date.slice(0,7)))].sort().reverse();
  const assets  = [...new Set(escRecords.map(r => r.asset))].sort();
  const perSel  = document.getElementById('esc-exp-periods');
  const assSel  = document.getElementById('esc-exp-assets');
  perSel.innerHTML = `<option value="all" selected>All periods</option>` + periods.map(p => {
    const label = new Date(p+'-01').toLocaleDateString('en-US',{year:'numeric',month:'long'});
    return `<option value="${p}">${label}</option>`;
  }).join('');
  assSel.innerHTML = `<option value="all" selected>All assets</option>` + assets.map(a => `<option value="${a}">${a}</option>`).join('');
  // reset col checkboxes
  ['esc-exp-col-date','esc-exp-col-asset','esc-exp-col-totalep','esc-exp-col-totalsrv','esc-exp-col-updep','esc-exp-col-updsrv','esc-exp-col-eppct','esc-exp-col-srvpct','esc-exp-col-notes']
    .forEach(id => document.getElementById(id).checked = true);
  // reset compliance filter
  document.getElementById('esc-exp-comp-all').checked = true;
  escExportFormat = 'xlsx';
  document.querySelectorAll('#esc-export-modal .exp-fmt-btn').forEach(b => b.classList.toggle('active', b.dataset.fmt === 'xlsx'));
  escUpdateExportPreview();
  document.getElementById('esc-export-modal').classList.add('open');
}

function escCloseExportModal() { document.getElementById('esc-export-modal').classList.remove('open'); }

function escSetExportFormat(fmt) {
  escExportFormat = fmt;
  document.querySelectorAll('#esc-export-modal .exp-fmt-btn').forEach(b => b.classList.toggle('active', b.dataset.fmt === fmt));
}

function escGetExportRows() {
  const period = document.getElementById('esc-exp-periods').value;
  const asset  = document.getElementById('esc-exp-assets').value;
  const comp   = document.querySelector('input[name="esc-exp-comp"]:checked')?.value || 'all';
  return escRecords.filter(r => {
    const periodMatch = period === 'all' || r.date.slice(0,7) === period;
    const assetMatch  = asset  === 'all' || r.asset === asset;
    const compMatch   = comp   === 'all'
      || (comp === 'compliant'    && r.epPct === 100 && r.srvPct === 100)
      || (comp === 'noncompliant' && (r.epPct < 100  || r.srvPct < 100));
    return periodMatch && assetMatch && compMatch;
  }).sort((a,b) => new Date(b.date)-new Date(a.date));
}

function escGetExportCols() {
  const map = {
    'esc-exp-col-date':    ['Date',       r => r.date],
    'esc-exp-col-asset':   ['Asset',      r => r.asset],
    'esc-exp-col-totalep': ['Total EP',   r => r.totalEP],
    'esc-exp-col-totalsrv':['Total SRV',  r => r.totalSrv],
    'esc-exp-col-updep':   ['Updated EP', r => r.updatedEP],
    'esc-exp-col-updsrv':  ['Updated SRV',r => r.updatedSrv],
    'esc-exp-col-eppct':   ['EP %',       r => r.epPct + '%'],
    'esc-exp-col-srvpct':  ['SRV %',      r => r.srvPct + '%'],
    'esc-exp-col-notes':   ['Notes',      r => r.notes || ''],
  };
  return Object.entries(map).filter(([id]) => document.getElementById(id)?.checked).map(([,v]) => v);
}

function escUpdateExportPreview() {
  const rows = escGetExportRows();
  const cols = escGetExportCols();
  document.getElementById('esc-exp-preview-count').textContent = `${rows.length} record${rows.length !== 1 ? 's' : ''} will be exported`;
  document.getElementById('esc-exp-preview-thead').innerHTML = `<tr>${cols.map(([l]) => `<th>${l}</th>`).join('')}</tr>`;
  document.getElementById('esc-exp-preview-tbody').innerHTML =
    rows.slice(0,5).map(r => `<tr>${cols.map(([,fn]) => `<td>${fn(r)}</td>`).join('')}</tr>`).join('') +
    (rows.length > 5 ? `<tr><td colspan="${cols.length}" style="color:var(--text3);font-size:11px">…and ${rows.length-5} more</td></tr>` : '');
}

function escDoExport() {
  const rows = escGetExportRows();
  const cols = escGetExportCols();
  if (!rows.length) return escShowToast('No records match the current filters.', '⚠️');
  const date = new Date().toISOString().split('T')[0];

  if (escExportFormat === 'xlsx') {
    const data = rows.map(r => Object.fromEntries(cols.map(([l,fn]) => [l, fn(r)])));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'ESC Records');
    XLSX.writeFile(wb, `esc_export_${date}.xlsx`);
    escCloseExportModal();
    escShowToast('Exported as XLSX!', '📥');

  } else if (escExportFormat === 'csv') {
    const header = cols.map(([l]) => `"${l}"`).join(',');
    const body   = rows.map(r => cols.map(([,fn]) => `"${String(fn(r)).replace(/"/g,"'")}"`).join(',')).join('\n');
    const blob   = new Blob([header+'\n'+body], {type:'text/csv'});
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a'); a.href=url; a.download=`esc_export_${date}.csv`; a.click();
    URL.revokeObjectURL(url);
    escCloseExportModal();
    escShowToast('Exported as CSV!', '📥');

  } else if (escExportFormat === 'pdf') {
    const totals   = escGetGlobalTotals();
    const printDiv = document.getElementById('esc-print-area') || (() => { const d=document.createElement('div'); d.id='esc-print-area'; document.body.appendChild(d); return d; })();
    printDiv.innerHTML = `
      <div class="print-header" style="display:block;margin-bottom:20px;padding-bottom:12px;border-bottom:3px solid #1a1a2e">
        <div style="font-size:22pt;font-weight:800;color:#1a1a2e">SentinelX</div>
        <div style="font-size:13pt;font-weight:600;color:#374151;margin-top:2px">Endpoint Sensor Compliance Report</div>
        <div style="display:flex;gap:24px;margin-top:10px;font-size:9pt;color:#6b7280">
          <span>Generated: ${new Date().toLocaleDateString('en-US',{year:'numeric',month:'long',day:'numeric'})}</span>
          <span>Records: ${rows.length}</span>
        </div>
        <div style="display:flex;gap:10px;margin-top:8px">
          <span style="background:#f0fdf4;color:#166534;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">Compliant: ${totals.compliantCount} / ${totals.summaries.length} (${totals.assetCompliancePct}%)</span>
          <span style="background:#fff7ed;color:#c2410c;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">Non-Compliant: ${totals.nonCompliantCount}</span>
          <span style="background:#eff6ff;color:#1d4ed8;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">EP: ${totals.updEP}/${totals.totalEP}</span>
          <span style="background:#eff6ff;color:#1d4ed8;padding:2px 10px;border-radius:4px;font-size:9pt;font-weight:600">SRV: ${totals.updSrv}/${totals.totalSrv}</span>
        </div>
      </div>
      <table>
        <thead><tr>${cols.map(([l])=>`<th>${l}</th>`).join('')}</tr></thead>
        <tbody>${rows.map(r=>{
          const ec=r.epPct>=100?'#166534':r.epPct>=80?'#1d4ed8':r.epPct>=50?'#c2410c':'#b91c1c';
          const sc=r.srvPct>=100?'#166534':r.srvPct>=80?'#1d4ed8':r.srvPct>=50?'#c2410c':'#b91c1c';
          return `<tr>${cols.map(([l,fn])=>{const v=fn(r);const s=l==='EP %'?`color:${ec};font-weight:700`:l==='SRV %'?`color:${sc};font-weight:700`:'';return `<td style="${s}">${v}</td>`;}).join('')}</tr>`;
        }).join('')}</tbody>
      </table>`;
    escCloseExportModal();
    setTimeout(() => window.print(), 150);

  } else if (escExportFormat === 'sheets') {
    const header = cols.map(([l]) => `"${l}"`).join(',');
    const body   = rows.map(r => cols.map(([,fn]) => `"${String(fn(r)).replace(/"/g,"'")}"`).join(',')).join('\n');
    const blob   = new Blob([header+'\n'+body], {type:'text/csv'});
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement('a'); a.href=url; a.download=`esc_export_${date}.csv`; a.click();
    URL.revokeObjectURL(url);
    escCloseExportModal();
    setTimeout(() => { window.open('https://sheets.new','_blank'); escShowToast('CSV downloaded — drag it into the new Google Sheet!','📊'); }, 600);
  }
}

// keep old names for compat
function escExportData()   { escOpenExportModal(); }
function escExportCSV()    { escOpenExportModal(); }
function escExportXLSX()   { escOpenExportModal(); }
function escExportPDF()    { escOpenExportModal(); }
function escExportSheets() { escOpenExportModal(); }

// ── TOAST ─────────────────────────────────────────────────────
let escToastTimer = null;

function escShowToast(msg, icon = 'OK') {
  const toast = document.getElementById('esc-toast');
  document.getElementById('esc-toast-msg').textContent  = msg;
  document.getElementById('esc-toast-icon').textContent = icon;
  toast.classList.add('show');
  clearTimeout(escToastTimer);
  escToastTimer = setTimeout(() => toast.classList.remove('show'), 3000);
}

// ── GLOBAL RENDER ─────────────────────────────────────────────
function escRenderAll() {
  escRenderHome();
  escRenderSidebarCounts();
  escRenderAssetSidebar();
}
