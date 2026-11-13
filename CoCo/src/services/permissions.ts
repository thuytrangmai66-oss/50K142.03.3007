import type { Role } from '../domain/auth';

// Roles come from SRS actors, never from sidebar artwork or caller input.
const both: readonly Role[] = ['owner', 'staff'];
const owner: readonly Role[] = ['owner'];
export const PERMISSIONS = {
  'home.read': both,
  'purchases.read': both, 'purchases.create': both,
  'sales.read': both, 'sales.create': both,
  'inventory.read': both, 'inventory.update': both, 'discounts.read': both,
  'customers.read': both, 'customers.create': both, 'customers.update': both, 'customers.delete': both,
  'price-brackets.read': owner, 'price-brackets.create': owner, 'price-brackets.update': owner,
  'approvals.read': owner, 'approvals.decide': owner,
  'reports.read': owner,
  'staff.read': owner, 'staff.create': owner, 'staff.update': owner, 'staff.delete': owner,
} as const;
export type Permission = keyof typeof PERMISSIONS;
export function hasPermission(role: Role, permission: Permission): boolean {
  return Object.hasOwn(PERMISSIONS, permission) && (PERMISSIONS[permission] as readonly Role[]).includes(role);
}

export const ROUTE_PERMISSIONS: Readonly<Record<string, Permission>> = {
  purchases: 'purchases.read', sales: 'sales.read', inventory: 'inventory.read', customers: 'customers.read',
  'price-brackets': 'price-brackets.read', approvals: 'approvals.read', reports: 'reports.read', staff: 'staff.read',
};
