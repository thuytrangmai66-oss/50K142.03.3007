export type AuthErrorCode = 'REQUIRED' | 'INVALID_CREDENTIALS' | 'SETUP_COMPLETE' | 'INVALID_PROFILE' | 'AUTH_REQUIRED' | 'FORBIDDEN' | 'SYSTEM';
const messages: Record<AuthErrorCode, string> = {
  REQUIRED: 'Tên đăng nhập hoặc mật khẩu không được để trống',
  INVALID_CREDENTIALS: 'Tên đăng nhập hoặc mật khẩu không đúng',
  SETUP_COMPLETE: 'Tài khoản chủ cửa hàng đã được thiết lập. Vui lòng đăng nhập.',
  INVALID_PROFILE: 'Vui lòng nhập họ tên, tên đăng nhập tối đa 10 ký tự và số điện thoại gồm đúng 10 chữ số.',
  AUTH_REQUIRED: 'Phiên đăng nhập đã kết thúc. Vui lòng đăng nhập lại.',
  FORBIDDEN: 'Bạn không có quyền truy cập chức năng này.',
  SYSTEM: 'Đăng nhập thất bại!',
};
export class AuthError extends Error {
  constructor(public readonly code: AuthErrorCode) { super(messages[code]); this.name = 'AuthError'; }
}
