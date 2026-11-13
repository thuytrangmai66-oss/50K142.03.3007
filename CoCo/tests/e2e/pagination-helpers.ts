import type { Page } from '@playwright/test';

/** Fixtures live only in an isolated test context, never in the user's DB. */
export async function addRows(page: Page, from: number, to: number) {
  if (from === to) return;
  await page.evaluate(({ from, to }) => new Promise<void>((resolve, reject) => {
    const request = indexedDB.open('CoCoDB');
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result;
      const tx = db.transaction(['khachHang', 'nhanVien', 'taiKhoan', 'accountSecurity', 'khungGiaThuMua', 'appMetadata'], 'readwrite');
      const owner = tx.objectStore('taiKhoan').get('owner');
      owner.onsuccess = () => {
        const security = tx.objectStore('accountSecurity').get('owner');
        security.onsuccess = () => {
          for (let i = from + 1; i <= to; i++) {
            const suffix = String(i).padStart(4, '0');
            const name = i === 5 ? 'Tên kiểm tra phân trang có nhiều từ để xuống dòng' : `Bản ghi phân trang ${suffix}`;
            tx.objectStore('khachHang').add({ MaKH: `KH${suffix}`, TenKH: name, SoDienThoaiKH: `093${String(i).padStart(7, '0')}`, DiemTichLuy: 0 });
            tx.objectStore('nhanVien').add({ MaNV: `NV${suffix}`, HoTen: name, SoDienThoai: `092${String(i).padStart(7, '0')}` });
            tx.objectStore('taiKhoan').add({ TenDangNhap: `nv${suffix}`, MaNV: `NV${suffix}` });
            tx.objectStore('accountSecurity').add({ ...security.result, TenDangNhap: `nv${suffix}`, role: 'staff' });
            tx.objectStore('khungGiaThuMua').add({ MaKhungGia: `KG${suffix}`, LoaiSanPham: name, ThuongHieu: `Thương hiệu ${suffix}`, TinhTrang: 2, GiaMin: 50000, GiaMax: 100000, MaNV: owner.result.MaNV });
            tx.objectStore('appMetadata').add({ key: `condition-catalog:KG${suffix}`, value: 'coco:conditions:2026-11-11' });
          }
        };
      };
      tx.oncomplete = () => { db.close(); resolve(); };
      tx.onabort = () => { db.close(); reject(tx.error); };
    };
  }), { from, to });
}
