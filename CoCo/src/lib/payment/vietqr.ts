/** Local NAPAS account-transfer payload. Rendering never contacts a QR/bank API. */
export const COCO_BANK = Object.freeze({ bin: '970443', name: 'SHB', account: '0947800469', holder: 'MAI THUY TRANG' });

function tlv(id: string, value: string): string {
  if (!/^[\x20-\x7E]+$/.test(value) || value.length > 99) throw new Error('Dữ liệu QR không hợp lệ');
  return `${id}${String(value.length).padStart(2, '0')}${value}`;
}

export function crc16Ccitt(value: string): string {
  let crc = 0xffff;
  for (const byte of new TextEncoder().encode(value)) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) crc = ((crc << 1) ^ (crc & 0x8000 ? 0x1021 : 0)) & 0xffff;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

export function createVietQr(amount: number, reference: string): string {
  if (!Number.isSafeInteger(amount) || amount <= 0 || amount > 9_999_999_999_999) throw new Error('Số tiền QR không hợp lệ');
  if (!/^[A-Za-z0-9]{1,25}$/.test(reference)) throw new Error('Mã giao dịch QR không hợp lệ');
  const beneficiary = tlv('00', COCO_BANK.bin) + tlv('01', COCO_BANK.account);
  const provider = tlv('00', 'A000000727') + tlv('01', beneficiary) + tlv('02', 'QRIBFTTA');
  const payload = tlv('00', '01') + tlv('01', '12') + tlv('38', provider)
    + tlv('53', '704') + tlv('54', String(amount)) + tlv('58', 'VN') + tlv('62', tlv('08', reference)) + '6304';
  return payload + crc16Ccitt(payload);
}
