import Dexie from 'dexie';
import { PHASE_2_STORES } from './phase2-schema';
import { CoCoDatabase } from '../../src/db/schema';

async function snapshot(db: Dexie) {
  const tables = [...db.tables].sort((a, b) => a.name.localeCompare(b.name));
  return Promise.all(tables.map(async table => ({ name: table.name, key: table.schema.primKey.src, rows: await table.toArray() })));
}

/** Dedicated verification DB only; application CoCoDB and user data untouched. */
export async function verifyNativeMigrationRollback() {
  const name = 'T07NativeUpgradeVerification', frozen = { ...PHASE_2_STORES, authSessions: '&tokenHash, username' };
  const legacy = new Dexie(name); legacy.version(3).stores(frozen); await legacy.open();
  await legacy.transaction('rw', legacy.tables, async () => {
    await legacy.table('appMetadata').put({ key: 't07-sentinel', value: 'keep' });
    await legacy.table('nhanVien').add({ MaNV: 'NVOLD', HoTen: 'Legacy', SoDienThoai: '0900000090' });
    await legacy.table('khachHang').add({ MaKH: 'KHOLD', TenKH: 'Khách cũ', SoDienThoaiKH: '0900000091', DiemTichLuy: 37 });
    await legacy.table('khungGiaThuMua').add({ MaKhungGia: 'KGOLD', LoaiSanPham: 'Áo', ThuongHieu: 'Legacy', TinhTrang: 90, GiaMin: 50000, GiaMax: 100000, MaNV: 'NVOLD' });
    await legacy.table('hoaDonThuMua').add({ MaHDTM: 'TMOLD', MaNV: 'NVOLD', MaKH: 'KHOLD', NgayThuMua: '2026-11-10T18:00:00Z', TongTienTM: 80001, TrangThai: 90 });
    await legacy.table('chiTietHoaDonTM').add({ MaHDTM: 'TMOLD', MaKhungGia: 'KGOLD', SoLuong: 1, DonGia: 80001, ThanhTien: 80001 });
    await legacy.table('sanPham').add({ MaSP: 'SPOLD', TenSP: 'Áo cũ', MaHDTM: 'TMOLD', MaKhungGia: 'KGOLD', NgayNhapKho: '2026-11-11', NgayBatDauChuKyGiam: '2026-11-11', GiaGocChuKyGiam: 120000, GiaBanHienHanh: 120000, TrangThai: 90 });
  });
  const before = await snapshot(legacy); legacy.close();
  const broken = new CoCoDatabase(name);
  broken.version(4).upgrade(async tx => {
    await tx.table('appMetadata').put({ key: 't07-sentinel', value: 'wrong' });
    await tx.table('purchaseDrafts').put({ id: 'must-rollback' });
    throw new Error('T07 intentional migration abort');
  });
  let rejected = false;
  try { await broken.open(); } catch { rejected = true; } finally { broken.close(); }
  const old = new Dexie(name); old.version(3).stores(frozen); await old.open();
  const rollbackNativeVersion = old.backendDB().version, rollbackStoreCount = old.tables.length;
  const rollbackPreservedEveryLegacyStore = JSON.stringify(await snapshot(old)) === JSON.stringify(before);
  old.close();
  const runtime = new CoCoDatabase(name); await runtime.open();
  try {
    const after = await snapshot(runtime), legacyNames = new Set(before.map(t => t.name));
    return {
      upgradeRejected: rejected, rollbackNativeVersion, rollbackStoreCount, rollbackPreservedEveryLegacyStore,
      runtimeNativeVersion: runtime.backendDB().version, runtimeStoreCount: runtime.tables.length,
      successPreservedEveryLegacyStore: JSON.stringify(after.filter(t => legacyNames.has(t.name))) === JSON.stringify(before),
      addedStores: after.filter(t => !legacyNames.has(t.name)).map(t => t.name),
      newStoresEmpty: after.filter(t => !legacyNames.has(t.name)).every(t => t.rows.length === 0),
      legacyInvoiceStatus: (await runtime.hoaDonThuMua.get('TMOLD'))!.TrangThai,
      legacyProductStatus: (await runtime.sanPham.get('SPOLD'))!.TrangThai,
      legacyCondition: (await runtime.khungGiaThuMua.get('KGOLD'))!.TinhTrang,
    };
  } finally { await runtime.delete(); }
}
