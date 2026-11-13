// Frozen schema from commit 22d3fbd; migration tests must retain this old format.
export const PHASE_2_STORES = {
  appMetadata: '&key', taiKhoan: '&TenDangNhap, MaNV', nhanVien: '&MaNV, &SoDienThoai',
  khachHang: '&MaKH, &SoDienThoaiKH',
  khungGiaThuMua: '&MaKhungGia, MaNV, &[LoaiSanPham+ThuongHieu+TinhTrang]',
  yeuCauPheDuyetGia: '&MaYC, MaNV, MaKhungGia, MaHDTM, TrangThai',
  hoaDonThuMua: '&MaHDTM, MaKH, MaNV, NgayThuMua',
  chiTietHoaDonTM: '&[MaHDTM+MaKhungGia], MaHDTM, MaKhungGia',
  sanPham: '&MaSP, MaHDTM, MaKhungGia, [MaHDTM+MaKhungGia], TrangThai, NgayNhapKho',
  hoaDonBanHang: '&MaHDBH, MaKH, MaNV, NgayBan',
  chiTietHoaDonBH: '&[MaHDBH+MaSP], MaHDBH, MaSP', accountSecurity: '&TenDangNhap', memberships: '&MaKH',
  productCosts: '&MaSP, MaHDTM, MaKhungGia', discountApplications: '&[MaSP+cycleStartedOn+milestone], MaSP, executedAt',
  notifications: '&id, recipient, MaYC', recordVersions: '&key', operations: '&id', auditEntries: '&id, actor, executedAt',
  issuedIdentifiers: '&key',
};
