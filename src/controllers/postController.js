const { sql, getPool } = require("../config/db");

function parseNullableInt(value) {
  if (value === undefined || value === null || value === "") return null;
  const n = Number.parseInt(String(value), 10);
  return Number.isFinite(n) ? n : null;
}

function parseNullableDateTime(value) {
  if (value === undefined || value === null || value === "") return null;
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? null : d;
}

function normalizePageNumber(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n >= 1 ? n : 1;
}

function normalizePageSize(value) {
  const n = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(n) && n >= 1 ? n : 9;
}

function extractTotalRecords(result, fallback = 0) {
  // Common patterns:
  // - recordsets[1][0].TotalRecords (2nd recordset)
  // - output.TotalRecords (output parameter)
  const fromSecondRecordset = result?.recordsets?.[1]?.[0];
  if (fromSecondRecordset && typeof fromSecondRecordset === "object") {
    const v =
      fromSecondRecordset.TotalRecords ??
      fromSecondRecordset.totalRecords ??
      fromSecondRecordset.total_records ??
      fromSecondRecordset.Total ??
      fromSecondRecordset.total;
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }

  const fromOutput = result?.output?.TotalRecords ?? result?.output?.totalRecords;
  if (fromOutput !== undefined) {
    const n = Number(fromOutput);
    if (Number.isFinite(n)) return n;
  }

  return fallback;
}

async function getPosts(req, res) {
  const {
    LoaiBai,
    MaNhomDo,
    MaLoaiDo,
    MaMau,
    MaDiaDiem,
    ThoiGian_Tu,
    ThoiGian_Den,
    PageNumber,
    PageSize,
  } = req.query;

  const pageNumber = normalizePageNumber(PageNumber);
  const pageSize = normalizePageSize(PageSize);

  const loaiBai =
    LoaiBai === undefined || LoaiBai === null || String(LoaiBai).trim() === ""
      ? null
      : String(LoaiBai).trim();

  const maNhomDo = parseNullableInt(MaNhomDo);
  const maLoaiDo = parseNullableInt(MaLoaiDo);
  const maMau = parseNullableInt(MaMau);
  const maDiaDiem = parseNullableInt(MaDiaDiem);

  const thoiGianTu = parseNullableDateTime(ThoiGian_Tu);
  const thoiGianDen = parseNullableDateTime(ThoiGian_Den);

  try {
    const pool = await getPool();
    const request = pool.request();

    // Map đúng kiểu dữ liệu SQL:
    // - NVARCHAR -> sql.NVarChar
    // - INT      -> sql.Int
    // - DATETIME -> sql.DateTime
    request.input("LoaiBai", sql.NVarChar(20), loaiBai);
    request.input("MaNhomDo", sql.Int, maNhomDo);
    request.input("MaLoaiDo", sql.Int, maLoaiDo);
    request.input("MaMau", sql.Int, maMau);
    request.input("MaDiaDiem", sql.Int, maDiaDiem);
    request.input("ThoiGian_Tu", sql.DateTime, thoiGianTu);
    request.input("ThoiGian_Den", sql.DateTime, thoiGianDen);
    request.input("PageNumber", sql.Int, pageNumber);
    request.input("PageSize", sql.Int, pageSize);

    const result = await request.execute("sp_GetLostFoundPosts");
    const data = result?.recordset ?? [];
    const totalRecords = extractTotalRecords(result, data.length);

    return res.json({
      data,
      totalRecords,
      pageNumber,
      pageSize,
    });
  } catch (err) {
    const message = [
      err?.message,
      err?.originalError?.info?.message,
      err?.originalError?.message,
    ]
      .filter(Boolean)
      .map(String)
      .join(" | ");
    if (message.includes("Khoảng thời gian không hợp lệ")) {
      return res.status(400).json({ message: "Khoảng thời gian không hợp lệ" });
    }

    console.error("getPosts error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

module.exports = {
  getPosts,
};

