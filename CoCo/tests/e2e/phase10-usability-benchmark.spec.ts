import { expect, test } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import os from 'node:os';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';
import { closeNotice } from './purchase-helpers';

test.use({ hasTouch: true, viewport: { width: 1440, height: 900 } });
for (const role of ['owner','staff'] as const) test(`G10-T05 ${role}: measured customer search, keyboard, touch and error-free create/delete`, async ({ page }, info) => {
  test.setTimeout(90_000);
  const errors: string[] = [];
  page.on('pageerror', error=>errors.push(error.message));
  page.on('console', message=>{if(message.type()==='error')errors.push(message.text());});
  await bootstrapOwner(page); if(role==='staff')await addStaffFixture(page);
  await login(page,role,role==='owner'?'only-for-tests!':'staff-test!');
  await page.getByRole('link',{name:'Khách hàng',exact:true}).tap();
  const results: { records: number; warmup: number; samplesMs: number[]; p50Ms: number; p95Ms: number }[]=[];
  let currentCount=0;
  for(const count of [25,1000]) {
    // Synthetic benchmark-only legacy dataset, in this test context. No fake creation timestamps.
    await page.evaluate(({from,to})=>new Promise<void>((resolve,reject)=>{
      const request=indexedDB.open('CoCoDB');request.onerror=()=>reject(request.error);
      request.onsuccess=()=>{
        const db=request.result,tx=db.transaction(['khachHang','recordVersions'],'readwrite');
        for(let i=from+1;i<=to;i++){
          const suffix=String(i).padStart(7,'0'),id=`KH${suffix}`;
          tx.objectStore('khachHang').add({MaKH:id,TenKH:`Khách benchmark ${i}`,SoDienThoaiKH:`093${suffix}`,DiemTichLuy:0});
          tx.objectStore('recordVersions').put({key:JSON.stringify(['khachHang',id]),version:1,updatedAt:new Date().toISOString()});
        }
        tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{db.close();reject(tx.error);};
      };
    }),{from:currentCount,to:count});
    currentCount=count; await page.reload();
    const samples:number[]=[];
    for(let iteration=0;iteration<6;iteration++){
      const id=count===25?10+iteration*2:500+iteration*50;
      const started=await page.evaluate(()=>performance.now());
      await page.getByRole('textbox',{name:'Tìm khách hàng theo số điện thoại'}).fill(`093${String(id).padStart(7,'0')}`);
      await page.getByRole('button',{name:'Tìm khách hàng',exact:true}).click();
      await expect(page.getByRole('link',{name:`Khách benchmark ${id}`,exact:true})).toBeVisible();
      await expect(page.locator('tbody tr')).toHaveCount(1);
      const elapsed=await page.evaluate(()=>performance.now())-started;
      if(iteration>0)samples.push(elapsed);
    }
    const sorted=[...samples].sort((a,b)=>a-b);
    expect(samples.every(value=>Number.isFinite(value)&&value>=0)).toBe(true);
    results.push({records:count,warmup:1,samplesMs:samples,p50Ms:sorted[Math.ceil(sorted.length*.5)-1],p95Ms:sorted[Math.ceil(sorted.length*.95)-1]});
    await page.getByRole('button',{name:'Xóa tìm kiếm',exact:true}).click();
  }
  await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).tap();
  const form=page.getByRole('dialog',{name:'Tạo thông tin khách hàng',exact:true});
  const name=form.getByLabel('Họ tên',{exact:true}),phone=form.getByLabel('Số điện thoại',{exact:true});
  await name.focus(); await page.keyboard.press('Tab'); await expect(phone).toBeFocused();
  await name.fill('Bản ghi cảm ứng G10'); await phone.fill('0912345678');
  await form.getByRole('button',{name:'Lưu',exact:true}).tap();
  await closeNotice(page,'Đã thêm thông tin khách hàng');
  await page.getByRole('textbox',{name:'Tìm khách hàng theo số điện thoại'}).fill('0912345678');
  await page.getByRole('button',{name:'Tìm khách hàng',exact:true}).click();
  await page.getByRole('link',{name:'Bản ghi cảm ứng G10',exact:true}).tap();
  await page.getByRole('button',{name:'Xóa tài khoản',exact:true}).tap();
  const confirmation=page.getByRole('dialog',{name:'Có chắc chắn xóa thông tin khách hàng không?',exact:true});
  await page.keyboard.press('Escape'); await expect(confirmation).toHaveCount(0);
  await expect(page.getByLabel('Họ tên',{exact:true})).toHaveValue('Bản ghi cảm ứng G10');
  await page.getByRole('button',{name:'Xóa tài khoản',exact:true}).tap();
  await confirmation.getByRole('button',{name:'Xác nhận',exact:true}).tap();
  await closeNotice(page,'Đã xóa thông tin khách hàng');
  await expect(page.locator(':modal')).toHaveCount(0);
  await page.screenshot({path:info.outputPath(`${role}-touch-customer-list.png`)});
  await writeFile(info.outputPath('search-benchmark.json'),JSON.stringify({role,measurement:'UI latency including Playwright interaction/auto-wait; no SLA verdict',
    machine:{os:os.platform(),release:os.release(),cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,memoryGiB:Math.round(os.totalmem()/2**30),node:process.version},
    browser:page.context().browser()?.version(),viewport:page.viewportSize(),results},null,2));
  expect(errors).toEqual([]);
});
