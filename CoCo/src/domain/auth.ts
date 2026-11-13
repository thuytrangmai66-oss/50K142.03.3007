import type { RecordMap } from './records';

export type Role = RecordMap['accountSecurity']['role'];
export interface AuthUser { username: string; employeeId: string; displayName: string; role: Role }
export interface AuthSession {
  tokenHash: string;
  username: string;
  employeeId: string;
  securityVersion: number;
  roleAtIssue: Role;
  createdAt: string;
}
export interface AuthState { needsSetup: boolean; user: AuthUser | null }
