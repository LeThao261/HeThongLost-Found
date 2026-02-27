/* ============================================================
   danh-sach.js  –  Màn hình Danh sách đồ thất lạc

   LOGIC ĐỊA ĐIỂM (@MaDiaDiem):
   SP chỉ nhận 1 tham số @MaDiaDiem. SP tự xử lý phân cấp
   bằng Recursive CTE. 3 dropdown là UI cascade để người dùng
   chọn dần từ cấp 1 → 2 → 3. Chỉ MaDiaDiem của cấp thấp nhất
   được chọn mới truyền vào SP.
   ============================================================ */

const pageSizeDefault = 9;
let currentPage    = 1;
let totalPages     = 1;
let isFilterActive = false;
let activeTab      = '';
let filterVisible  = true;
// FE và BE chạy cùng host/port: dùng prefix /api cho backend
const apiBaseUrl   = '/api';

// ─── DOM REFS ───
const loaiBaiSelect     = document.getElementById('loaiBaiSelect');
const nhomDoSelect      = document.getElementById('nhomDoSelect');
const loaiDoSelect      = document.getElementById('loaiDoSelect');
const mauSacSelect      = document.getElementById('mauSacSelect');
const capMotSelect      = document.getElementById('capMotSelect');  // Cấp 1: Loại khu vực
const capHaiSelect      = document.getElementById('capHaiSelect');   // Cấp 2: Khu/Dãy/Tòa
const capBaSelect       = document.getElementById('capBaSelect');    // Cấp 3: Địa điểm cụ thể
const tuNgayInput       = document.getElementById('tuNgayInput');
const denNgayInput      = document.getElementById('denNgayInput');
const searchBtn         = document.getElementById('searchBtn');
const resetBtn          = document.getElementById('resetBtn');
const emptyResetBtn     = document.getElementById('emptyResetBtn');
const timeError         = document.getElementById('timeError');
const postsGrid         = document.getElementById('postsGrid');
const emptyState        = document.getElementById('emptyState');
const emptyTitle        = document.getElementById('emptyTitle');
const emptyDescription  = document.getElementById('emptyDescription');
const paginationWrapper = document.getElementById('paginationWrapper');
const currentPageText   = document.getElementById('currentPageText');
const totalPagesText    = document.getElementById('totalPagesText');
const prevPageBtn       = document.getElementById('prevPageBtn');
const nextPageBtn       = document.getElementById('nextPageBtn');
const postCountText     = document.getElementById('postCountText');
const filterCard        = document.getElementById('filterCard');
const toggleFilterBtn   = document.getElementById('toggleFilterBtn');
const toggleFilterLabel = document.getElementById('toggleFilterLabel');
const tabBtns           = document.querySelectorAll('.tab-btn');

// ─── TOGGLE FILTER ───
toggleFilterBtn.addEventListener('click', () => {
  filterVisible = !filterVisible;
  filterCard.classList.toggle('hidden', !filterVisible);
  toggleFilterLabel.textContent = filterVisible ? 'Ẩn bộ lọc' : 'Hiện bộ lọc';
});

// ─── TABS ───
tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    tabBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    activeTab = btn.dataset.tab;
    currentPage = 1;
    loadPosts(currentPage);
  });
});

// ─── LẤY MaDiaDiem CUỐI CÙNG ĐƯỢC CHỌN ───
// Ưu tiên cấp 3 → cấp 2 → cấp 1 → rỗng
// SP nhận 1 giá trị duy nhất, tự đệ quy lấy toàn bộ con cháu.
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

// ─── BUILD PARAMS ───
function buildQueryParams(pageNumber) {
  const params = new URLSearchParams();
  params.set('PageNumber', pageNumber || 1);
  params.set('PageSize', pageSizeDefault);

  const loaiBai   = activeTab || loaiBaiSelect.value;
  const maNhomDo  = nhomDoSelect.value;
  const maLoaiDo  = loaiDoSelect.value;
  const maMau     = mauSacSelect.value;
  const maDiaDiem = getSelectedMaDiaDiem(); // ← 1 giá trị duy nhất
  const tuNgay    = tuNgayInput.value;
  const denNgay   = denNgayInput.value;

  isFilterActive = !!(loaiBai || maNhomDo || maLoaiDo || maMau || maDiaDiem || tuNgay || denNgay);
  timeError.classList.add('d-none');

  if (tuNgay && !denNgay) {
    params.set('ThoiGian_Tu', new Date(tuNgay).toISOString());
  } else if (!tuNgay && denNgay) {
    params.set('ThoiGian_Den', new Date(denNgay).toISOString());
  } else if (tuNgay && denNgay) {
    const tuDate  = new Date(tuNgay);
    const denDate = new Date(denNgay);
    if (tuDate > denDate) {
      timeError.classList.remove('d-none');
      throw new Error('INVALID_TIME_RANGE');
    }
    params.set('ThoiGian_Tu',  tuDate.toISOString());
    params.set('ThoiGian_Den', denDate.toISOString());
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
function renderPosts(data, totalRecords) {
  postsGrid.innerHTML = '';
  cardIdx = 0;

  if (!data || data.length === 0) {
    postsGrid.classList.add('d-none');
    paginationWrapper.classList.add('d-none');
    emptyState.classList.remove('d-none');
    if (isFilterActive) {
      emptyTitle.textContent       = 'Không tìm thấy bài đăng phù hợp.';
      emptyDescription.textContent = 'Hãy thử thay đổi hoặc xóa bớt bộ lọc tìm kiếm.';
      emptyResetBtn.classList.remove('d-none');
    } else {
      emptyTitle.textContent       = 'Hiện chưa có bài đăng nào.';
      emptyDescription.textContent = 'Khi có bài đăng mới, chúng sẽ hiển thị tại đây.';
      emptyResetBtn.classList.add('d-none');
    }
    postCountText.textContent = 'Không tìm thấy bài đăng';
    return;
  }

  emptyState.classList.add('d-none');
  postsGrid.classList.remove('d-none');

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

  postCountText.textContent = `Tìm thấy ${totalRecords} bài đăng`;
}

function updatePagination(totalRecords) {
  totalPages  = Math.max(1, Math.ceil(totalRecords / pageSizeDefault));
  currentPage = Math.min(currentPage, totalPages);
  if (totalRecords <= 0) { paginationWrapper.classList.add('d-none'); return; }
  paginationWrapper.classList.remove('d-none');
  currentPageText.textContent = currentPage;
  totalPagesText.textContent  = totalPages;
  prevPageBtn.disabled = currentPage <= 1;
  nextPageBtn.disabled = currentPage >= totalPages;
}

// ─── API CALLS ───
async function loadPosts(pageNumber) {
  try {
    const params   = buildQueryParams(pageNumber);
    const response = await fetch(`${apiBaseUrl}/posts?${params.toString()}`);
    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      if (response.status === 400 && errorData?.message) {
        timeError.textContent = errorData.message;
        timeError.classList.remove('d-none');
        return;
      }
      throw new Error('Lỗi tải dữ liệu');
    }
    const result = await response.json();
    const { data, totalRecords, pageNumber: returnedPage } = result;
    currentPage = returnedPage || pageNumber || 1;
    renderPosts(data, totalRecords);
    updatePagination(totalRecords);
  } catch (error) {
    if (error.message === 'INVALID_TIME_RANGE') return;
    console.error(error);
    emptyState.classList.remove('d-none');
    postsGrid.classList.add('d-none');
    emptyTitle.textContent       = 'Không tải được dữ liệu.';
    emptyDescription.textContent = 'Vui lòng thử tải lại trang sau ít phút.';
    emptyResetBtn.classList.add('d-none');
    paginationWrapper.classList.add('d-none');
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
    loaiDoSelect.innerHTML = '<option value="">Không tải được dữ liệu</option>';
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

// Chỉ load địa điểm cấp 1 (gốc, không có cha)
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
  // Reset toàn bộ cascade địa điểm
  capMotSelect.value  = '';
  capHaiSelect.innerHTML = '<option value="">Mọi nơi trong trường</option>';
  capHaiSelect.disabled  = true;
  capBaSelect.innerHTML  = '<option value="">Mọi nơi trong trường</option>';
  capBaSelect.disabled   = true;
  tuNgayInput.value   = '';
  denNgayInput.value  = '';
  timeError.classList.add('d-none');
  isFilterActive = false;
  activeTab      = '';
  tabBtns.forEach(b => b.classList.remove('active'));
  tabBtns[0].classList.add('active');
  currentPage = 1;
  loadPosts(currentPage);
}

// ─── EVENT LISTENERS ───
nhomDoSelect.addEventListener('change', e => { loaiDoSelect.value = ''; loadLoaiDo(e.target.value); });

// Cascade địa điểm: chọn cấp 1 → load cấp 2, chọn cấp 2 → load cấp 3
capMotSelect.addEventListener('change', e => loadCapHai(e.target.value));
capHaiSelect.addEventListener('change', e => loadCapBa(e.target.value));

searchBtn.addEventListener('click', () => { currentPage = 1; try { loadPosts(currentPage); } catch (_) {} });
resetBtn.addEventListener('click', resetFilters);
emptyResetBtn.addEventListener('click', resetFilters);
prevPageBtn.addEventListener('click', () => { if (currentPage > 1)          { currentPage--; loadPosts(currentPage); } });
nextPageBtn.addEventListener('click', () => { if (currentPage < totalPages) { currentPage++; loadPosts(currentPage); } });

// ─── INIT ───
document.addEventListener('DOMContentLoaded', async () => {
  await Promise.all([loadNhomDo(), loadMauSac(), loadCapMot()]);
  currentPage    = 1;
  isFilterActive = false;
  loadPosts(currentPage);
});
