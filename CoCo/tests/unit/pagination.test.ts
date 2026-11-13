import { describe, expect, it } from 'vitest';
import { DEFAULT_PAGE_SIZE, paginate } from '../../src/domain/pagination';

describe('shared list pagination', () => {
  it.each([[0,1,0],[1,1,1],[9,1,9],[10,2,9],[25,3,9]])('slices %i records before rendering', (total,pages,visible) => {
    const rows=Array.from({length:total},(_,i)=>i+1), result=paginate(rows,1);
    expect(DEFAULT_PAGE_SIZE).toBe(9);
    expect(result).toMatchObject({total,pages,page:1,requestedPage:1});
    expect(result.rows).toHaveLength(visible);
    expect(rows).toHaveLength(total);
  });
  it('partitions 25 records into exactly 9 + 9 + 7 without gaps or duplicates', () => {
    const rows=Array.from({length:25},(_,i)=>i+1);
    const pages=[paginate(rows,1),paginate(rows,2),paginate(rows,3)];
    expect(pages.map(p=>p.rows)).toEqual([[1,2,3,4,5,6,7,8,9],[10,11,12,13,14,15,16,17,18],[19,20,21,22,23,24,25]]);
    expect(pages.flatMap(p=>p.rows)).toEqual(rows);
  });
  it('clamps a removed/filtered last page and cannot bounce back after data is added', () => {
    const reduced=paginate([1,2,3],3);
    expect(reduced).toMatchObject({page:1,pages:1,requestedPage:3,rows:[1,2,3]});
    expect(paginate(Array.from({length:25},(_,i)=>i),reduced.page).page).toBe(1);
  });
  it.each([0,-1,1.5,NaN,Infinity])('normalizes invalid requested page %s', page => {
    expect(paginate([1,2],page).page).toBe(1);
  });
  it('supports an explicit module capacity without mutating the data', () => {
    const rows=Object.freeze([1,2,3,4,5]);
    expect(paginate(rows,2,2)).toMatchObject({rows:[3,4],total:5,page:2,pages:3});
    expect(rows).toEqual([1,2,3,4,5]);
    expect(()=>paginate(rows,1,0)).toThrow(RangeError);
  });
});
