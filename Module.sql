--1.Xem danh sách bài đăng cá nhân
--
-- MÃ LỖI (Error codes)
-- E001: Tài khoản chưa đăng nhập / không hoạt động
-- E002: Tài khoản hiện không thể thực hiện thao tác
-- E003: Không hợp lệ hoặc không có quyền
-- E004: Trạng thái không hợp lệ cho bài 'Mất'
-- E005: Trạng thái không hợp lệ cho bài 'Nhặt'
-- E006: Trạng thái không thay đổi
-- E007: Không thể xóa bài này
--
CREATE OR ALTER PROCEDURE sp_GetMyPosts
    @MaNguoiDung INT,
    @LoaiBai NVARCHAR(10) = NULL  -- NULL = Tất cả
AS
BEGIN
    SET NOCOUNT ON;

    -- 1️⃣ Kiểm tra tài khoản tồn tại và đang hoạt động
    IF NOT EXISTS (
        SELECT 1
        FROM NguoiDung
        WHERE MaNguoiDung = @MaNguoiDung
          AND TrangThaiTK = 1
    )
    BEGIN
        RAISERROR(N'[E001] Bạn cần đăng nhập để thực hiện thao tác này',16,1);
        RETURN;
    END

    -- 2️⃣ Truy vấn danh sách bài đăng cá nhân
    SELECT 
        bd.MaBaiDang,
        bd.LoaiBai,
        ndg.TenNhomDo,
        ld.TenLoaiDo,
        bd.DacDiemNhanDang,
        bd.ThoiGian_Tu,
        bd.ThoiGian_Den,
        dd.TenDiaDiem,
        bd.TrangThai,
        bd.NgayDang,
        ha.DuongDanAnh
    FROM BaiDang bd
    JOIN LoaiDo ld ON bd.MaLoaiDo = ld.MaLoaiDo
    JOIN NhomDo ndg ON ld.MaNhomDo = ndg.MaNhomDo
    JOIN DiaDiem dd ON bd.MaDiaDiem = dd.MaDiaDiem

    -- Lấy 1 ảnh đại diện (nếu có)
    OUTER APPLY (
        SELECT TOP 1 DuongDanAnh
        FROM HinhAnh
        WHERE MaBaiDang = bd.MaBaiDang
        ORDER BY MaAnh ASC
    ) ha

    WHERE bd.MaNguoiDung = @MaNguoiDung
      AND bd.TrangThai <> N'Đã xóa'
      AND (
            @LoaiBai IS NULL
            OR bd.LoaiBai = @LoaiBai
          )

    ORDER BY bd.NgayDang DESC;
END
--2.Cập nhật trạng thái
CREATE OR ALTER PROCEDURE sp_UpdateMyPostStatus
    @MaBaiDang INT,
    @MaNguoiDung INT,
    @TrangThaiMoi NVARCHAR(20)
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM NguoiDung
            WHERE MaNguoiDung = @MaNguoiDung
            AND TrangThaiTK = 1
        )
        BEGIN
            RAISERROR(N'[E002] Tài khoản của bạn hiện không thể thực hiện thao tác này',16,1);
            ROLLBACK;
            RETURN;
        END

        DECLARE @LoaiBai NVARCHAR(10);

        SELECT @LoaiBai = LoaiBai
        FROM BaiDang
        WHERE MaBaiDang = @MaBaiDang
        AND MaNguoiDung = @MaNguoiDung
        AND TrangThai = N'Đang tìm';

        IF @LoaiBai IS NULL
        BEGIN
            RAISERROR(N'[E003] Không hợp lệ hoặc không có quyền',16,1);
            ROLLBACK;
            RETURN;
        END

        IF (@LoaiBai = N'Mất' AND @TrangThaiMoi <> N'Đã tìm thấy')
        BEGIN
            RAISERROR(N'[E004] Trạng thái không hợp lệ cho bài mất',16,1);
            ROLLBACK;
            RETURN;
        END

        IF (@LoaiBai = N'Nhặt' AND @TrangThaiMoi <> N'Đã trả')
        BEGIN
            RAISERROR(N'[E005] Trạng thái không hợp lệ cho bài nhặt',16,1);
            ROLLBACK;
            RETURN;
        END

        UPDATE BaiDang
        SET TrangThai = @TrangThaiMoi,
            NgayCapNhat = GETDATE()
        WHERE MaBaiDang = @MaBaiDang
        AND TrangThai <> @TrangThaiMoi;

        IF @@ROWCOUNT = 0
        BEGIN
            RAISERROR(N'[E006] Trạng thái không thay đổi',16,1);
            ROLLBACK;
            RETURN;
        END

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END
--Trigger thông báo Cập nhật trạng thái
CREATE OR ALTER TRIGGER trg_Notify_OnStatusChange
ON BaiDang
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;

    IF UPDATE(TrangThai)
    BEGIN
        INSERT INTO ThongBao
        (
            MaNguoiDung,
            TieuDe,
            NoiDung,
            MaBaiDang,
            LoaiThongBao,
            DaXem,
            DanhDauXemSau,
            NgayTao
        )
        SELECT 
            i.MaNguoiDung,
            N'Cập nhật trạng thái',
            CASE 
                WHEN i.TrangThai = N'Đã tìm thấy' 
                    THEN N'Bài đăng của bạn đã được cập nhật thành "Đã tìm thấy".'
                WHEN i.TrangThai = N'Đã trả'
                    THEN N'Bài đăng của bạn đã được cập nhật thành "Đã trả".'
            END,
            i.MaBaiDang,
            N'CAP_NHAT_TRANG_THAI',
            0,
            0,
            GETDATE()
        FROM inserted i
        JOIN deleted d ON i.MaBaiDang = d.MaBaiDang
        WHERE d.TrangThai = N'Đang tìm'
        AND i.TrangThai IN (N'Đã tìm thấy', N'Đã trả')
        AND i.TrangThai <> d.TrangThai;
    END
END
--3.Xóa bài đăng
CREATE OR ALTER PROCEDURE sp_DeleteMyPost
    @MaBaiDang INT,
    @MaNguoiDung INT
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF NOT EXISTS (
            SELECT 1 FROM NguoiDung
            WHERE MaNguoiDung = @MaNguoiDung
            AND TrangThaiTK = 1
        )
        BEGIN
            RAISERROR(N'[E002] Tài khoản của bạn hiện không thể thực hiện thao tác này',16,1);
            ROLLBACK;
            RETURN;
        END

        IF NOT EXISTS (
            SELECT 1 FROM BaiDang
            WHERE MaBaiDang = @MaBaiDang
            AND MaNguoiDung = @MaNguoiDung
            AND TrangThai = N'Đang tìm'
        )
        BEGIN
            RAISERROR(N'[E007] Không thể xóa bài này',16,1);
            ROLLBACK;
            RETURN;
        END

        UPDATE BaiDang
        SET TrangThai = N'Đã xóa',
            NgayXoa = GETDATE()
        WHERE MaBaiDang = @MaBaiDang;

        DELETE FROM Matching
        WHERE MaBaiDangMat = @MaBaiDang
           OR MaBaiDangNhat = @MaBaiDang;

        INSERT INTO ThongBao
        (
            MaNguoiDung,
            TieuDe,
            NoiDung,
            MaBaiDang,
            LoaiThongBao,
            DaXem,
            DanhDauXemSau,
            NgayTao
        )
        VALUES
        (
            @MaNguoiDung,
            N'Xóa bài đăng',
            N'Bài đăng của bạn đã được xóa thành công.',
            @MaBaiDang,
            N'XOA_BAI_DANG',
            0,
            0,
            GETDATE()
        );

        COMMIT;
    END TRY
    BEGIN CATCH
        ROLLBACK;
        THROW;
    END CATCH
END