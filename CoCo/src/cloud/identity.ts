import type { AuthUser } from '../domain/auth';

export function parseCloudUser(value: unknown): AuthUser | null {
  if (!value || typeof value !== 'object' || !('user' in value)) throw new Error('Hợp đồng định danh cloud không hợp lệ.');
  if (value.user === null) return null;
  const user = value.user;
  if (!user || typeof user !== 'object' || !('username' in user) || !('employeeId' in user) || !('displayName' in user) || !('role' in user) ||
    typeof user.username !== 'string' || !user.username.trim() || typeof user.employeeId !== 'string' || !user.employeeId.trim() ||
    typeof user.displayName !== 'string' || !user.displayName.trim() || typeof user.role !== 'string' ||
    (user.role !== 'owner' && user.role !== 'staff')) throw new Error('Hợp đồng định danh cloud không hợp lệ.');
  return { username: user.username, employeeId: user.employeeId, displayName: user.displayName, role: user.role };
}
