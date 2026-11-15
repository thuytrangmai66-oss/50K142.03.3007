import type { AuthUser } from '../domain/auth';
import type { Permission } from '../services/permissions';

/** Read-only projection capability. It is never consulted by login, session or writes. */
export const CLOUD_READ_AUTHORIZER = Symbol('CoCo cloud read projection');
export type CloudReadAuthorizer = <T>(permission: Permission, query: (user: AuthUser) => Promise<T>) => Promise<T>;
export interface CloudReadPort { [CLOUD_READ_AUTHORIZER]: CloudReadAuthorizer }
export interface CloudServiceOptions {
  /** Must come from authenticated coco_identity(), not a role selected in the UI. */
  currentUser(): AuthUser | null;
  subscribe(onChange: () => void): () => void;
  invalidate(): void;
}
export type CloudSnapshot = Record<string, unknown[]>;
