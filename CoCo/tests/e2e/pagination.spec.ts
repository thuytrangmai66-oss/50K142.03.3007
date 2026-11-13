import { expect, test, type Page } from '@playwright/test';
import { writeFile } from 'node:fs/promises';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';
import { addRows } from './pagination-helpers';

const targets=[{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080}];
const shortWindows=[{width:1366,height:650},{width:800,height:500},{width:640,height:768}];
const counts=[0,1,5,9,10,25];
const button=(page:Page,n:number)=>page.getByRole('button',{name:`Trang ${n}`,exact:true});
const ids=(prefix:string,start:number,end:number)=>Array.from({length:end-start},(_,i)=>`${prefix}${String(start+i+1).padStart(4,'0')}`);

async function geometry(page:Page){
  return page.evaluate(()=>{
    const nav=document.querySelector<HTMLElement>('.pagination')!,list=document.querySelector<HTMLElement>('.reference-list')!;
    const table=document.querySelector<HTMLElement>('.paginated-table > .data-table-scroll')!,main=document.getElementById('main-content')!;
    const nr=nav.getBoundingClientRect(),lr=list.getBoundingClientRect(),tr=table.getBoundingClientRect(),mr=main.getBoundingClientRect();
    const buttons=Array.from(nav.querySelectorAll('button'),b=>b.getBoundingClientRect()),style=getComputedStyle(main);
    const left=mr.left+main.clientLeft+parseFloat(style.paddingLeft),width=main.clientWidth-parseFloat(style.paddingLeft)-parseFloat(style.paddingRight);
    return {y:nr.top-lr.top,centerError:(Math.min(...buttons.map(b=>b.left))+Math.max(...buttons.map(b=>b.right)))/2-(left+width/2),gap:nr.top-tr.bottom,footerGap:lr.bottom-nr.bottom,
      internalVerticalScroll:table.scrollHeight>table.clientHeight+1,tableHeight:tr.height,pageOverflowX:document.documentElement.scrollWidth-innerWidth,mainScroll:main.scrollHeight-main.clientHeight,
      lastRowBottom:table.querySelector('tbody tr:last-child')!.getBoundingClientRect().bottom,tableBottom:tr.bottom,
      pageSize:Number(list.dataset.pageSize),navTop:nr.top,buttonWidth:buttons[0].width,buttonHeight:buttons[0].height,fontSize:parseFloat(getComputedStyle(nav.querySelector('button')!).fontSize),
      rowBorder:getComputedStyle(table.querySelector('tbody td')!).borderBottomWidth};
  });
}

for(const screen of [
  {route:'customers',prefix:'KH',role:'owner'}, {route:'customers',prefix:'KH',role:'staff'},
  {route:'staff',prefix:'NV',role:'owner'}, {route:'price-brackets',prefix:'KG',role:'owner'},
] as const)test(`${screen.role} ${screen.route}: responsive pages, stable footer, no internal scrolling`,async({page},info)=>{
  test.setTimeout(150_000);
  await bootstrapOwner(page);
  if(screen.role==='staff')await addStaffFixture(page);
  await login(page,screen.role,screen.role==='owner'?'only-for-tests!':'staff-test!');
  await page.goto(`./#/${screen.route}`);
  const baseline=new Map<string,number>(),measurements=[];
  let previous=0;
  const cells=page.locator('.data-table tbody tr td:first-child');
  for(const count of counts){
    await addRows(page,previous,count);previous=count;await page.reload();
    await expect(button(page,1)).toHaveAttribute('aria-current','page');await page.evaluate(()=>document.fonts.ready);
    for(const viewport of [...targets,...shortWindows]){
      await page.setViewportSize(viewport);await button(page,1).click();
      const fullHeight=targets.some(v=>v.width===viewport.width&&v.height===viewport.height);
      await expect(async()=>{
        const capacity=Number(await page.locator('.reference-list').getAttribute('data-page-size'));
        if(fullHeight)expect(capacity).toBe(9);
        expect(capacity).toBeGreaterThanOrEqual(1);expect(capacity).toBeLessThanOrEqual(9);
        if(count)await expect(cells).toHaveText(ids(screen.prefix,0,Math.min(count,capacity)));
        else await expect(page.locator('.empty-state')).toBeVisible();
        await page.locator('#main-content').evaluate(el=>{el.scrollTop=0;});await page.evaluate(()=>scrollTo(0,0));
        await expect(page.locator('.pagination'),`${screen.route}: ${count} rows at ${viewport.width}x${viewport.height}`).toBeInViewport({ratio:1});
        if(count)await expect(page.locator('.data-table tbody tr').last()).toBeInViewport({ratio:1});
      }).toPass({timeout:7000});
      await page.locator('#main-content').evaluate(el=>{el.scrollTop=0;});await page.evaluate(()=>scrollTo(0,0));
      const key=`${viewport.width}x${viewport.height}`,current=await geometry(page),capacity=current.pageSize;
      await expect(button(page,Math.max(1,Math.ceil(count/capacity)))).toBeVisible();
      if(!baseline.has(key))baseline.set(key,current.y);
      expect(Math.abs(current.y-baseline.get(key)!),`${screen.route} ${count} at ${key}`).toBeLessThanOrEqual(1);
      if(fullHeight){
        await expect(page.locator('.pagination')).toBeInViewport({ratio:1});
        await expect(page.locator('.data-table tbody tr').last()).toBeInViewport({ratio:1});
      }
      expect(Math.abs(current.centerError)).toBeLessThanOrEqual(1);expect(current.internalVerticalScroll).toBe(false);
      expect(current.lastRowBottom).toBeLessThanOrEqual(current.tableBottom+1);expect(current.gap).toBeGreaterThanOrEqual(0);
      expect(Math.abs(current.footerGap)).toBeLessThanOrEqual(1);expect(current.tableHeight).toBeGreaterThan(0);expect(current.pageOverflowX).toBeLessThanOrEqual(1);
      expect(current.buttonWidth).toBe(32);expect(current.buttonHeight).toBe(32);expect(current.fontSize).toBe(14);
      expect(current.rowBorder).toBe(count ? '1px' : '0px');
      measurements.push({count,viewport,...current});
      // Capture the viewport under test. Full-page capture can resize Chromium's
      // viewport temporarily and reset the responsive pagination being measured.
      if(fullHeight&&(count===25||(viewport.width===1366&&[0,1,9,10].includes(count))))await page.screenshot({path:info.outputPath(`${count}-rows-${key}.png`),fullPage:false});
      if(!fullHeight&&count===25)await page.screenshot({path:info.outputPath(`adaptive-${key}.png`),fullPage:false});
      if(count>capacity){
        await expect(button(page,1)).toHaveAttribute('aria-current','page');
        await expect(cells).toHaveText(ids(screen.prefix,0,capacity));
        await expect(page.locator('.reference-list')).toHaveAttribute('data-page-size',String(capacity));
        const collected=await cells.allTextContents();
        for(let target=2;target<=Math.ceil(count/capacity);target++){
          await button(page,target).click();await expect(button(page,target)).toHaveAttribute('aria-current','page');
          await expect(cells).toHaveText(ids(screen.prefix,(target-1)*capacity,Math.min(target*capacity,count)));
          await expect(page.locator('.reference-list')).toHaveAttribute('data-page-size',String(capacity));
          collected.push(...await cells.allTextContents());expect((await geometry(page)).internalVerticalScroll).toBe(false);
          if(fullHeight)expect(Math.abs((await geometry(page)).y-current.y)).toBeLessThanOrEqual(1);
        }
        expect(collected).toEqual(ids(screen.prefix,0,count));expect(new Set(collected).size).toBe(count);
        await button(page,1).click();await expect(cells).toHaveText(ids(screen.prefix,0,capacity));
      }
    }
  }
  await writeFile(info.outputPath('pagination-metrics.json'),JSON.stringify(measurements,null,2));
});

test('customer search paginates the filtered set and preserves the query across pages',async({page})=>{
  await bootstrapOwner(page);await login(page);await addRows(page,0,25);await page.goto('./#/customers');
  await button(page,3).click();
  const query=page.getByRole('textbox',{name:'Tìm khách hàng theo số điện thoại'}),cells=page.locator('.data-table tbody tr td:first-child');
  await query.fill('093000001');await expect(button(page,1)).toHaveAttribute('aria-current','page');
  await expect(cells).toHaveText(ids('KH',9,18));await expect(button(page,3)).toHaveCount(0);
  await button(page,2).click();await expect(cells).toHaveText(['KH0019']);await expect(query).toHaveValue('093000001');
  await query.fill('0930000001');await expect(cells).toHaveText(['KH0001']);await expect(button(page,2)).toHaveCount(0);
  await query.fill('0999999999');await expect(page.getByText('Không tìm thấy khách hàng',{exact:true})).toBeVisible();await expect(button(page,1)).toHaveAttribute('aria-current','page');
  await page.getByRole('button',{name:'Xóa tìm kiếm'}).click();await expect(cells).toHaveText(ids('KH',0,9));await expect(button(page,3)).toBeVisible();
});

test('bracket condition filter preserves its value while paging and resets a removed page',async({page})=>{
  await bootstrapOwner(page);await login(page);await addRows(page,0,25);
  await page.evaluate(()=>new Promise<void>((resolve,reject)=>{const r=indexedDB.open('CoCoDB');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,tx=db.transaction('khungGiaThuMua','readwrite'),store=tx.objectStore('khungGiaThuMua');for(let i=1;i<=10;i++){const read=store.get(`KG${String(i).padStart(4,'0')}`);read.onsuccess=()=>store.put({...read.result,TinhTrang:3});}tx.oncomplete=()=>{db.close();resolve();};tx.onabort=()=>{db.close();reject(tx.error);};};}));
  await page.goto('./#/price-brackets');await button(page,3).click();
  const filter=page.getByRole('combobox',{name:'Lọc độ mới',exact:true}),cells=page.locator('.data-table tbody tr td:first-child');
  await filter.selectOption('3');await expect(button(page,1)).toHaveAttribute('aria-current','page');await expect(cells).toHaveText(ids('KG',0,9));
  await button(page,2).click();await expect(cells).toHaveText(['KG0010']);await expect(filter).toHaveValue('3');
  await filter.selectOption('1');await expect(page.getByText('Chưa có khung giá thu mua',{exact:true})).toBeVisible();await expect(button(page,2)).toHaveCount(0);
  await filter.selectOption('');await expect(cells).toHaveText(ids('KG',0,9));await expect(button(page,3)).toBeVisible();
});

for(const kind of ['customers','staff'] as const)test(`${kind}: UI add creates page 2; live delete clamps page 2 and keeps it clamped on later add`,async({page,context})=>{
  await bootstrapOwner(page);await login(page);await addRows(page,0,9);await page.goto(`./#/${kind}`);
  const name=kind==='customers'?'Khách mới phân trang':'Nhân viên mới phân trang';
  async function create(username:string){
    await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
    const form=page.getByRole('dialog',{name:kind==='customers'?'Tạo thông tin khách hàng':'Tạo tài khoản nhân viên',exact:true});
    await form.getByLabel('Họ tên',{exact:true}).fill(name);await form.getByLabel('Số điện thoại',{exact:true}).fill(username==='newstaff'?'0999999998':'0999999997');
    if(kind==='staff'){await form.getByLabel('Tên đăng nhập',{exact:true}).fill(username);await form.getByLabel('Mật khẩu',{exact:true}).fill('test-only!');}
    await form.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText(kind==='customers'?'Đã thêm thông tin khách hàng':'Tạo tài khoản mới thành công');
    await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();
  }
  await expect(button(page,2)).toHaveCount(0);await create('newstaff');await button(page,2).click();await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  const href=await page.locator('.data-table tbody a').first().getAttribute('href');
  const other=await context.newPage();await other.goto('./');await login(other);await other.goto(`./${href}`);
  await other.getByRole('button',{name:'Xóa tài khoản',exact:true}).click();await other.getByRole('dialog').getByRole('button',{name:'Xác nhận',exact:true}).click();
  await expect(other.getByRole('alertdialog')).toContainText(kind==='customers'?'Đã xóa thông tin khách hàng':'Xóa tài khoản thành công');
  await expect(button(page,2)).toHaveCount(0);await expect(button(page,1)).toHaveAttribute('aria-current','page');await expect(page.locator('.data-table tbody tr')).toHaveCount(9);
  await create('nextstaff');await expect(button(page,2)).toBeVisible();await expect(button(page,1)).toHaveAttribute('aria-current','page');
});

test('creating a tenth bracket updates the page count using the active filter',async({page})=>{
  await bootstrapOwner(page);await login(page);await addRows(page,0,9);await page.goto('./#/price-brackets');
  await page.getByRole('combobox',{name:'Lọc độ mới',exact:true}).selectOption('2');await expect(button(page,2)).toHaveCount(0);
  await page.getByRole('button',{name:'Tạo khung giá',exact:true}).click();const form=page.getByRole('dialog',{name:'Tạo khung giá thu mua',exact:true});
  await form.getByLabel('Loại hàng',{exact:true}).fill('Áo mới');await form.getByLabel('Thương hiệu',{exact:true}).fill('Nhãn mới');await form.getByLabel('Độ mới',{exact:true}).selectOption('2');
  await form.getByLabel('Giá tối thiểu (Min)',{exact:true}).fill('50000');await form.getByLabel('Giá tối đa (Max)',{exact:true}).fill('100000');await form.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('alertdialog')).toContainText('Tạo khung giá thu mua thành công');await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();
  await expect(button(page,2)).toBeVisible();await button(page,2).click();await expect(page.locator('.data-table tbody tr')).toHaveCount(1);
  await expect(page.getByRole('combobox',{name:'Lọc độ mới',exact:true})).toHaveValue('2');
});

test('many pages use ellipsis and never link to a nonexistent page',async({page})=>{
  await bootstrapOwner(page);await login(page);await addRows(page,0,100);await page.goto('./#/customers');
  await expect(page.locator('.page-ellipsis')).toBeVisible();await expect(button(page,13)).toHaveCount(0);
  await button(page,12).click();await expect(page.locator('.data-table tbody tr td:first-child')).toHaveText(['KH0100']);
  await expect(button(page,12)).toHaveAttribute('aria-current','page');await button(page,11).click();
  await expect(page.locator('.data-table tbody tr td:first-child')).toHaveText(ids('KH',90,99));
});

for(const screen of [
  {route:'customers',prefix:'KH',role:'owner'}, {route:'customers',prefix:'KH',role:'staff'},
  {route:'staff',prefix:'NV',role:'owner'}, {route:'price-brackets',prefix:'KG',role:'owner'},
] as const)test(`${screen.role} ${screen.route}: shrinking preserves filters, reslices without gaps, and expanding restores nine`,async({page},info)=>{
  const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.setViewportSize({width:1440,height:900});await bootstrapOwner(page);if(screen.role==='staff')await addStaffFixture(page);
  await login(page,screen.role,screen.role==='owner'?'only-for-tests!':'staff-test!');await addRows(page,0,25);await page.goto(`./#/${screen.route}`);
  const cells=page.locator('.data-table tbody tr td:first-child'),section=page.locator('.reference-list');
  let expected=ids(screen.prefix,0,25);
  if(screen.route==='customers'){await page.getByRole('textbox',{name:'Tìm khách hàng theo số điện thoại'}).fill('093000001');expected=ids('KH',9,19);}
  if(screen.route==='price-brackets')await page.getByRole('combobox',{name:'Lọc độ mới',exact:true}).selectOption('2');
  await expect(cells).toHaveText(expected.slice(0,9));await button(page,2).click();await expect(button(page,2)).toHaveAttribute('aria-current','page');
  await page.setViewportSize({width:800,height:500});
  await expect(async()=>{
    const capacity=Number(await section.getAttribute('data-page-size'));expect(capacity).toBeLessThan(9);expect(capacity).toBeGreaterThanOrEqual(1);
    await expect(button(page,1)).toHaveAttribute('aria-current','page');await expect(cells).toHaveText(expected.slice(0,capacity));
    await page.locator('#main-content').evaluate(el=>{el.scrollTop=0;});await expect(page.locator('.pagination')).toBeInViewport({ratio:1});
  }).toPass({timeout:7000});
  const capacity=Number(await section.getAttribute('data-page-size')),collected=await cells.allTextContents();
  for(let target=2;target<=Math.ceil(expected.length/capacity);target++){
    await button(page,target).click();await expect(cells).toHaveText(expected.slice((target-1)*capacity,target*capacity));collected.push(...await cells.allTextContents());
    await expect(section).toHaveAttribute('data-page-size',String(capacity));expect((await geometry(page)).internalVerticalScroll).toBe(false);
  }
  expect(collected).toEqual(expected);expect(new Set(collected).size).toBe(expected.length);
  if(screen.route==='customers')await expect(page.getByRole('textbox',{name:'Tìm khách hàng theo số điện thoại'})).toHaveValue('093000001');
  if(screen.route==='price-brackets')await expect(page.getByRole('combobox',{name:'Lọc độ mới',exact:true})).toHaveValue('2');
  await page.setViewportSize({width:1440,height:900});await expect(section).toHaveAttribute('data-page-size','9');await expect(button(page,1)).toHaveAttribute('aria-current','page');await expect(cells).toHaveText(expected.slice(0,9));
  await page.screenshot({path:info.outputPath('expanded.png'),fullPage:true});expect(errors).toEqual([]);
});
