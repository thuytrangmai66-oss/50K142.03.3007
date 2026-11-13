/** Default list capacity approved in the pagination request, 11/11/2026. */
export const DEFAULT_PAGE_SIZE = 9;
export interface PageResult<T> { rows: T[]; total: number; page: number; pages: number; requestedPage: number }

export function paginate<T>(rows: readonly T[], requestedPage: number, pageSize = DEFAULT_PAGE_SIZE): PageResult<T> {
  if (!Number.isSafeInteger(pageSize) || pageSize < 1) throw new RangeError('Invalid page size');
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const page = Math.min(pages, Math.max(1, Number.isSafeInteger(requestedPage) ? requestedPage : 1));
  return { rows: rows.slice((page - 1) * pageSize, page * pageSize), total: rows.length, page, pages, requestedPage };
}
