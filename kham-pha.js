/* ============================================================
   kham-pha.js  –  Màn hình Khám phá

   LOGIC ĐỊA ĐIỂM (@MaDiaDiem):
   Tương tự danh-sach.js: 3 dropdown cascade UI,
   chỉ truyền MaDiaDiem của cấp thấp nhất được chọn vào SP.
   ============================================================ */

// FE và BE chạy cùng host/port: dùng prefix /api cho backend
const apiBaseUrl = '/api';
let activeTab = '';

// ─── DOM REFS ───
const loaiBaiSelect    = document.getElementById('loaiBaiSelect');
const nhomDoSelect     = document.getElementById('nhomDoSelect');
const loaiDoSelect     = document.getElementById('loaiDoSelect');
const mauSacSelect     = document.getElementById('mauSacSelect');
const capMotSelect     = document.getElementById('capMotSelect'); // Cấp 1
const capHaiSelect     = document.getElementById('capHaiSelect');  // Cấp 2
const capBaSelect      = document.getElementById('capBaSelect');    // Cấp 3
const tuNgayInput      = document.getElementById('tuNgayInput');
const denNgayInput     = document.getElementById('denNgayInput');
const searchBtn        = document.getElementById('searchBtn');
const resetBtn         = document.getElementById('resetBtn');
const timeError        = document.getElementById('timeError');
const postsGrid        = document.getElementById('postsGrid');
const emptyState       = document.getElementById('emptyState');
const emptyTitle       = document.getElementById('emptyTitle');
const emptyDescription = document.getElementById('emptyDescription');
const updateTime       = document.getElementById('updateTime');
const viewAllWrap      = document.getElementById('viewAllWrap');
const tabBtns          = document.querySelectorAll('.tab-btn');

// ─── TABS ───
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    loadPosts();
  });
});

// ─── LẤY MaDiaDiem CUỐI CÙNG ĐƯỢC CHỌN ───
function getSelectedMaDiaDiem() {
  if (capBaSelect.value)  return capBaSelect.value;
  if (capHaiSelect.value) return capHaiSelect.value;
  if (capMotSelect.value) return capMotSelect.value;
  return '';
}

// ─── CASCADE ĐỊA ĐIỂM ───
async function loadCapHai(maDiaDiemCha) {
  capHaiSelect.innerHTML = '<option value="">Mọi nơi trong trường</option>';
  capHaiSelect.disabled  = true;
  capBaSelect.innerHTML  = '<option value="">Mọi nơi trong trường</option>';
  capBaSelect.disabled   = true;
  if (!maDiaDiemCha) return;
  try {
    const data = await fetch(`${apiBaseUrl}/master/dia-diem?maDiaDiemCha=${encodeURIComponent(maDiaDiemCha)}`).then(r => r.json());
    if (!data || !data.length) return;
    capHaiSelect.disabled = false;
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.MaDiaDiem; opt.textContent = item.TenDiaDiem;
      capHaiSelect.appendChild(opt);
    });
  } catch (e) { console.error('Không tải được Khu/Dãy/Tòa', e); }
}

async function loadCapBa(maDiaDiemCha) {
  capBaSelect.innerHTML = '<option value="">Mọi nơi trong trường</option>';
  capBaSelect.disabled  = true;
  if (!maDiaDiemCha) return;
  try {
    const data = await fetch(`${apiBaseUrl}/master/dia-diem?maDiaDiemCha=${encodeURIComponent(maDiaDiemCha)}`).then(r => r.json());
    if (!data || !data.length) return;
    capBaSelect.disabled = false;
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.MaDiaDiem; opt.textContent = item.TenDiaDiem;
      capBaSelect.appendChild(opt);
    });
  } catch (e) { console.error('Không tải được địa điểm cụ thể', e); }
}

// ─── HELPERS ───
function setUpdateTime() {
  const now = new Date();
  updateTime.textContent = `Cập nhật lúc ${now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} hôm nay`;
}

function buildQueryParams() {
  const params = new URLSearchParams();
  params.set('PageNumber', 1);
  params.set('PageSize', 8);

  const loaiBai   = activeTab || loaiBaiSelect.value;
  const maNhomDo  = nhomDoSelect.value;
  const maLoaiDo  = loaiDoSelect.value;
  const maMau     = mauSacSelect.value;
  const maDiaDiem = getSelectedMaDiaDiem(); // ← 1 giá trị duy nhất
  const tuNgay    = tuNgayInput.value;
  const denNgay   = denNgayInput.value;

  timeError.classList.add('d-none');

  if (tuNgay && !denNgay) {
    params.set('ThoiGian_Tu', new Date(tuNgay).toISOString());
  } else if (!tuNgay && denNgay) {
    params.set('ThoiGian_Den', new Date(denNgay).toISOString());
  } else if (tuNgay && denNgay) {
    const tu  = new Date(tuNgay);
    const den = new Date(denNgay);
    if (tu > den) {
      timeError.classList.remove('d-none');
      throw new Error('INVALID_TIME_RANGE');
    }
    params.set('ThoiGian_Tu',  tu.toISOString());
    params.set('ThoiGian_Den', den.toISOString());
  }

  if (loaiBai === 'Mat')       params.set('LoaiBai', 'Mất');
  else if (loaiBai === 'Nhat') params.set('LoaiBai', 'Nhặt');
  else if (loaiBai)            params.set('LoaiBai', loaiBai);

  if (maNhomDo)  params.set('MaNhomDo',  maNhomDo);
  if (maLoaiDo)  params.set('MaLoaiDo',  maLoaiDo);
  if (maMau)     params.set('MaMau',     maMau);
  if (maDiaDiem) params.set('MaDiaDiem', maDiaDiem); // ← @MaDiaDiem duy nhất

  return params;
}

function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const diffMs = new Date() - new Date(dateString);
  const m = Math.floor(diffMs / 60000);
  if (m < 1)   return 'Vừa xong';
  if (m < 60)  return `${m} phút trước`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} giờ trước`;
  const d = Math.floor(h / 24);
  if (d < 7)   return `${d} ngày trước`;
  const w = Math.floor(d / 7);
  if (w < 4)   return `${w} tuần trước`;
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} tháng trước`;
  return `${Math.floor(d / 365)} năm trước`;
}

const thumbBgLost  = ['#F3E8FF', '#E0E7FF', '#FCE7F3', '#FEE2E2'];
const thumbBgFound = ['#DCFCE7', '#D1FAE5', '#CFFAFE', '#E0F2FE'];
let cardIdx = 0;

// ─── RENDER ───
function renderPosts(data) {
  postsGrid.innerHTML = '';
  cardIdx = 0;

  if (!data || data.length === 0) {
    postsGrid.classList.add('d-none');
    viewAllWrap.classList.add('d-none');
    emptyState.classList.remove('d-none');
    return;
  }

  emptyState.classList.add('d-none');
  postsGrid.classList.remove('d-none');
  viewAllWrap.classList.remove('d-none');

  data.forEach((item) => {
    const isLost      = item.LoaiBai === 'Mất';
    const badgeClass  = isLost ? 'badge-lost' : 'badge-found';
    const badgeLabel  = isLost ? 'MẤT ĐỒ' : 'NHẶT ĐƯỢC';
    const actionLabel = isLost ? 'XEM CHI TIẾT' : 'XÁC MINH NGAY';
    const btnClass    = isLost ? 'btn-outline' : 'btn-filled';
    const palette     = isLost ? thumbBgLost : thumbBgFound;
    const thumbBg     = palette[cardIdx % palette.length];
    cardIdx++;

    const subtitle  = [item.TenNhomDo, item.TenLoaiDo].filter(Boolean).join(' / ');
    const thumbText = (item.TenLoaiDo || item.TenNhomDo || '').toUpperCase().split(' ').slice(0, 2).join(' ');
    const titleText = [item.TenLoaiDo, item.DacDiemNhanDang].filter(Boolean).join(' – ') || 'Không rõ loại đồ';

    const card = document.createElement('div');
    card.className = 'post-card';
    card.innerHTML = `
      <div class="post-thumb" style="background:${thumbBg}">
        <span class="post-badge ${badgeClass}">${badgeLabel}</span>
        <span class="post-thumb-label">${thumbText}</span>
      </div>
      <div class="post-body">
        <div class="post-title" title="${titleText}">${titleText}</div>
        ${subtitle ? `<div class="post-sub">✦ ${subtitle}</div>` : ''}
        <div class="post-meta"><span class="icon">📍</span>${item.TenDiaDiem || 'Không rõ địa điểm'}</div>
        <div class="post-meta"><span class="icon">🕐</span>${formatRelativeTime(item.NgayDang)}</div>
      </div>
      <div class="post-footer">
        <button class="btn-card ${btnClass}">${actionLabel}</button>
      </div>
    `;
    postsGrid.appendChild(card);
  });

  setUpdateTime();
}

// ─── API CALLS ───
async function loadPosts() {
  try {
    const params   = buildQueryParams();
    const response = await fetch(`${apiBaseUrl}/posts?${params.toString()}`);
    if (!response.ok) throw new Error('Lỗi tải dữ liệu');
    const result   = await response.json();
    renderPosts(result.data || result);
  } catch (error) {
    if (error.message === 'INVALID_TIME_RANGE') return;
    console.error(error);
    emptyState.classList.remove('d-none');
    postsGrid.classList.add('d-none');
    viewAllWrap.classList.add('d-none');
    emptyTitle.textContent       = 'Không tải được dữ liệu.';
    emptyDescription.textContent = 'Vui lòng thử tải lại trang sau ít phút.';
  }
}

async function loadNhomDo() {
  try {
    const data = await fetch(`${apiBaseUrl}/master/nhom-do`).then(r => r.json());
    nhomDoSelect.innerHTML = '<option value="">Tất cả nhóm đồ</option>';
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.MaNhomDo; opt.textContent = item.TenNhomDo;
      nhomDoSelect.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

async function loadLoaiDo(maNhomDo) {
  loaiDoSelect.disabled  = true;
  loaiDoSelect.innerHTML = '<option value="">Đang tải...</option>';
  if (!maNhomDo) {
    loaiDoSelect.innerHTML = '<option value="">Chọn nhóm đồ trước</option>';
    return;
  }
  try {
    const data = await fetch(`${apiBaseUrl}/master/loai-do?maNhomDo=${encodeURIComponent(maNhomDo)}`).then(r => r.json());
    loaiDoSelect.disabled  = false;
    loaiDoSelect.innerHTML = '<option value="">Tất cả loại đồ</option>';
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.MaLoaiDo; opt.textContent = item.TenLoaiDo;
      loaiDoSelect.appendChild(opt);
    });
  } catch (e) {
    loaiDoSelect.disabled  = true;
    loaiDoSelect.innerHTML = '<option value="">Không tải được</option>';
  }
}

async function loadMauSac() {
  try {
    const data = await fetch(`${apiBaseUrl}/master/mau-sac`).then(r => r.json());
    mauSacSelect.innerHTML = '<option value="">Tất cả màu</option>';
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.MaMau; opt.textContent = item.TenMau;
      mauSacSelect.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

// Chỉ load địa điểm cấp 1
async function loadCapMot() {
  try {
    const data = await fetch(`${apiBaseUrl}/master/dia-diem`).then(r => r.json());
    capMotSelect.innerHTML = '<option value="">Mọi nơi trong trường</option>';
    data.forEach(item => {
      const opt = document.createElement('option');
      opt.value = item.MaDiaDiem; opt.textContent = item.TenDiaDiem;
      capMotSelect.appendChild(opt);
    });
  } catch (e) { console.error(e); }
}

function resetFilters() {
  loaiBaiSelect.value = '';
  nhomDoSelect.value  = '';
  loaiDoSelect.innerHTML = '<option value="">Chọn nhóm đồ trước</option>';
  loaiDoSelect.disabled  = true;
  mauSacSelect.value  = '';
  capMotSelect.value  = '';
  capHaiSelect.innerHTML = '<option value="">Mọi nơi trong trường</option>';
  capHaiSelect.disabled  = true;
  capBaSelect.innerHTML  = '<option value="">Mọi nơi trong trường</option>';
  capBaSelect.disabled   = true;
  tuNgayInput.value   = '';
  denNgayInput.value  = '';
  timeError.classList.add('d-none');
  activeTab = '';
  tabBtns.forEach(b => b.classList.remove('active'));
  tabBtns[0].classList.add('active');
  loadPosts();
}

// ─── EVENT LISTENERS ───
nhomDoSelect.addEventListener('change', e => { loaiDoSelect.value = ''; loadLoaiDo(e.target.value); });
capMotSelect.addEventListener('change', e => loadCapHai(e.target.value));
capHaiSelect.addEventListener('change', e => loadCapBa(e.target.value));
searchBtn.addEventListener('click', () => { try { loadPosts(); } catch (_) {} });
resetBtn.addEventListener('click', resetFilters);

// ─── INIT ───
document.addEventListener('DOMContentLoaded', async () => {
  setUpdateTime();
  await Promise.all([loadNhomDo(), loadMauSac(), loadCapMot()]);
  loadPosts();
});
