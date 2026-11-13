import { useEffect, useLayoutEffect, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import { DEFAULT_PAGE_SIZE } from '../../domain/pagination';

/** Presentation capacity only. A resize starts at page 1; subsequent pages keep
 * the measured capacity so changing pages cannot repeat or skip records. */
export function useListPageSize(page: number, setPage: Dispatch<SetStateAction<number>>) {
  const ref = useRef<HTMLElement>(null);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  useEffect(() => {
    const resize = () => { setPage(1); setPageSize(DEFAULT_PAGE_SIZE); };
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [setPage]);
  useLayoutEffect(() => {
    const section = ref.current, main = section?.closest<HTMLElement>('#main-content');
    if (!section || !main) return;
    function measure() {
      if (!section || !main) return;
      const mr = main.getBoundingClientRect(), sr = section.getBoundingClientRect(), style = getComputedStyle(main);
      const top = parseFloat(style.paddingTop), bottom = parseFloat(style.paddingBottom);
      const shellBottom = parseFloat(getComputedStyle(main.closest('.app-shell')!).paddingBottom);
      const viewportRoom = innerHeight - (mr.top + scrollY) - top - bottom - shellBottom;
      // Below the sidebar breakpoint main has natural height. Its current
      // content height must not keep an empty/short list above the footer.
      const visible = style.overflowY === 'auto' ? Math.min(main.clientHeight - top - bottom, viewportRoom) : viewportRoom;
      const budget = Math.max(0, visible - (sr.top - mr.top + main.scrollTop - top));
      const height = `${budget}px`;
      if (section.style.getPropertyValue('--list-available-height') !== height) section.style.setProperty('--list-available-height', height);
      // Learn from the first page only. Paging must not change the slice size.
      if (page !== 1) return;
      const table = section.querySelector<HTMLTableElement>('.data-table');
      const nav = section.querySelector<HTMLElement>('.pagination');
      if (!table || !nav || table.querySelector('.empty-state')) return;
      const available = budget - (table.getBoundingClientRect().top - sr.top) - nav.getBoundingClientRect().height - parseFloat(getComputedStyle(nav).marginTop);
      const header = table.tHead?.getBoundingClientRect().height ?? 0;
      const heights = Array.from(table.tBodies[0].rows, row => row.getBoundingClientRect().height);
      if (header + heights.reduce((sum, height) => sum + height, 0) <= available + 1) return;
      // Account for a wrapped label anywhere in the sampled first page rather
      // than assuming every row is as short as the first one.
      let fits = 1;
      for (let count = heights.length - 1; count >= 1; count--) {
        const windows = heights.slice(0, heights.length - count + 1).map((_, start) => heights.slice(start, start + count).reduce((sum, height) => sum + height, 0));
        if (header + Math.max(...windows) <= available + 1) { fits = count; break; }
      }
      setPageSize(current => Math.min(current, fits));
    }
    measure();
    let frame = 0;
    const observer = new ResizeObserver(() => { cancelAnimationFrame(frame); frame = requestAnimationFrame(measure); });
    observer.observe(main); observer.observe(section);
    const table = section.querySelector('.data-table'); if (table) observer.observe(table);
    return () => { observer.disconnect(); cancelAnimationFrame(frame); };
  });
  return { ref, pageSize };
}
