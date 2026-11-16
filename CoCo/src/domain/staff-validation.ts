// Supabase Auth clamps its configured minimum to at least six Unicode code
// points. This is a provider floor, not a claim about this project's full policy.
export const SUPABASE_PASSWORD_FLOOR = 6;
/** Shared UI/Edge preflight; database and Supabase Auth remain authoritative. */
export function validateStaffInput(input: { name?: unknown; phone?: unknown; username?: unknown; password?: unknown }, creating = false, passwordMinimum = 0) {
  const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
  const name = text(input.name), phone = text(input.phone), username = text(input.username);
  const fields: Partial<Record<'name' | 'phone' | 'username' | 'password', string>> = {};
  if (!name) fields.name = 'Họ tên không được để trống';
  else if (name.length > 50) fields.name = 'Họ tên không được vượt quá 50 ký tự';
  if (!phone) fields.phone = 'Số điện thoại không được để trống';
  else if (!/^\d{10}$/.test(phone)) fields.phone = 'Số điện thoại không hợp lệ';
  if (!username) fields.username = 'Tên đăng nhập không được để trống';
  else if (!/^\S{1,10}$/.test(username)) fields.username = 'Tên đăng nhập tối đa 10 ký tự và không chứa khoảng trắng';
  const password = typeof input.password === 'string' ? input.password : '';
  if (creating && !password.trim()) fields.password = 'Mật khẩu không được để trống';
  else if (creating && [...password].length < passwordMinimum) fields.password = `Mật khẩu phải có ít nhất ${passwordMinimum} ký tự`;
  return { name, phone, username, fields };
}

/** Translate only recognized Auth policy errors; never expose an arbitrary provider message. */
export function staffPasswordMessage(error: { code?: string; message?: string }) {
  if (error.code !== 'weak_password' && error.code !== 'validation_failed') return undefined;
  const min = error.message?.match(/^Password should be at least (\d+) characters\.?$/i);
  if (min) return `Mật khẩu phải có ít nhất ${Number(min[1])} ký tự`;
  if (/^Password cannot be longer than \d+ characters\.?$/i.test(error.message ?? '')) return 'Mật khẩu vượt quá độ dài cho phép của hệ thống';
  if (error.code === 'weak_password') return 'Mật khẩu chưa đáp ứng chính sách bảo mật của hệ thống';
  return undefined;
}
