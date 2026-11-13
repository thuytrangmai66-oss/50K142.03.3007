import { expect, test, type Page } from '@playwright/test';
import { bootstrapOwner, login, addStaffFixture } from './auth-helpers';

async function snapshot(page:Page){
  return page.evaluate(()=>new Promise<string>((resolve,reject)=>{const r=indexedDB.open('CoCoDB');r.onerror=()=>reject(r.error);r.onsuccess=()=>{const db=r.result,names=Array.from(db.objectStoreNames),tx=db.transaction(names,'readonly'),data:Record<string,unknown[]>={};for(const name of names){const q=tx.objectStore(name).getAll();q.onsuccess=()=>{data[name]=q.result;};}tx.oncomplete=()=>{db.close();resolve(JSON.stringify(data));};tx.onabort=()=>{db.close();reject(tx.error);};};}));
}
async function create(page:Page,kind:'customers'|'staff',name:string,username:string,phone:string){
  await page.getByRole('link',{name:kind==='customers'?'Khách hàng':'Nhân viên',exact:true}).click();
  await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  const form=page.getByRole('dialog',{name:kind==='customers'?'Tạo thông tin khách hàng':'Tạo tài khoản nhân viên',exact:true});
  await form.getByLabel('Họ tên',{exact:true}).fill(name);await form.getByLabel('Số điện thoại',{exact:true}).fill(phone);
  if(kind==='staff'){await form.getByLabel('Tên đăng nhập',{exact:true}).fill(username);await form.getByLabel('Mật khẩu',{exact:true}).fill('test-confirm!');}
  await form.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText(kind==='customers'?'Đã thêm thông tin khách hàng':'Tạo tài khoản mới thành công');
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();await page.getByRole('link',{name,exact:true}).click();
  return page.url().split('/').at(-1)!;
}
async function prepare(page:Page,kind:'customers'|'staff'='customers',role:'owner'|'staff'='owner'){
  const errors:string[]=[];page.on('pageerror',error=>errors.push(error.message));page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});
  await bootstrapOwner(page);if(role==='staff')await addStaffFixture(page);await login(page,role,role==='owner'?'only-for-tests!':'staff-test!');
  const keeper=await create(page,kind,'Bản ghi giữ lại','keeper','0987654301');
  const target=await create(page,kind,'Bản ghi cần xóa','target','0987654302');
  return{keeper,target,errors};
}
const open=async(page:Page)=>{await page.getByRole('button',{name:'Xóa tài khoản',exact:true}).click();await expect(page.locator('.confirm-dialog')).toBeVisible();return page.locator('.confirm-dialog');};

for(const setting of [{kind:'customers',role:'owner'},{kind:'customers',role:'staff'},{kind:'staff',role:'owner'}] as const)test(`${setting.role} ${setting.kind}: compact centered confirmation, cancel/X/Escape preserve data, confirm targets only selected record`,async({page},info)=>{
  const {target,keeper,errors}=await prepare(page,setting.kind,setting.role),before=await snapshot(page);
  for(const viewport of [{width:1366,height:768},{width:1440,height:900},{width:1920,height:1080},{width:390,height:844},{width:320,height:640}]){
    await page.setViewportSize(viewport);const dialog=await open(page);const b=(await dialog.boundingBox())!;
    expect(Math.abs(b.x+b.width/2-viewport.width/2)).toBeLessThanOrEqual(1);expect(Math.abs(b.y+b.height/2-viewport.height/2)).toBeLessThanOrEqual(1);
    expect(b.width).toBe(Math.min(480,viewport.width-32));expect(b.height).toBeLessThanOrEqual(viewport.width>=512?335:250);expect(b.height).toBeGreaterThan(viewport.width>=512?280:185);
    await expect(dialog).toBeInViewport({ratio:1});await expect(dialog.locator('header')).toHaveCount(0);
    await expect(dialog.getByRole('heading')).toHaveCSS('font-weight','700');await expect(dialog.getByRole('button',{name:'Xác nhận',exact:true})).toHaveCSS('background-color','rgb(231, 231, 231)');
    await expect(dialog.getByRole('button',{name:'Hủy',exact:true})).toHaveCSS('background-color','rgb(232, 221, 206)');
    const order=await dialog.evaluate(el=>{const icon=el.querySelector('.confirmation-icon')!.getBoundingClientRect(),text=el.querySelector('h2')!.getBoundingClientRect(),buttons=el.querySelector('.confirmation-actions')!.getBoundingClientRect(),close=el.querySelector('.confirm-close')!.getBoundingClientRect(),r=el.getBoundingClientRect();return{iconBottom:icon.bottom,textTop:text.top,textBottom:text.bottom,buttonsTop:buttons.top,buttonCenter:buttons.left+buttons.width/2,center:r.left+r.width/2,closeRight:close.right,closeTop:close.top,right:r.right,top:r.top};});
    expect(order.iconBottom).toBeLessThan(order.textTop);expect(order.textBottom).toBeLessThan(order.buttonsTop);expect(Math.abs(order.buttonCenter-order.center)).toBeLessThanOrEqual(1);expect(order.closeRight).toBeLessThan(order.right);expect(order.closeTop).toBeGreaterThan(order.top);
    await page.screenshot({path:info.outputPath(`${viewport.width}x${viewport.height}.png`),fullPage:false});await dialog.screenshot({path:info.outputPath(`popup-${viewport.width}x${viewport.height}.png`)});
    await dialog.getByRole('button',{name:'Hủy',exact:true}).click();await expect(dialog).toHaveCount(0);expect(await snapshot(page)).toBe(before);
  }
  let dialog=await open(page);await dialog.getByRole('button',{name:'Đóng xác nhận',exact:true}).click();expect(await snapshot(page)).toBe(before);
  dialog=await open(page);await page.keyboard.press('Escape');await expect(dialog).toHaveCount(0);expect(await snapshot(page)).toBe(before);
  await open(page);await page.evaluate(hash=>{location.hash=hash;},`#/${setting.kind}/${keeper}`);await expect(page.locator('.confirm-dialog')).toHaveCount(0);expect(await snapshot(page)).toBe(before);
  await page.goto(`./#/${setting.kind}/${target}`);dialog=await open(page);await dialog.getByRole('button',{name:'Xác nhận',exact:true}).click();
  await expect(page.getByRole('alertdialog')).toContainText(setting.kind==='customers'?'Đã xóa thông tin khách hàng':'Xóa tài khoản thành công');
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();await expect(page.getByRole('link',{name:'Bản ghi cần xóa',exact:true})).toHaveCount(0);await expect(page.getByRole('link',{name:'Bản ghi giữ lại',exact:true})).toBeVisible();
  const data=JSON.parse(await snapshot(page));
  if(setting.kind==='customers'){expect(data.khachHang.map((x:{MaKH:string})=>x.MaKH)).toEqual([keeper]);}
  else{expect(data.accountSecurity.find((x:{TenDangNhap:string})=>x.TenDangNhap==='target').active).toBe(false);expect(data.accountSecurity.find((x:{TenDangNhap:string})=>x.TenDangNhap==='keeper').active).toBe(true);}
  expect(errors).toEqual([]);
});

test('delete failure rolls back data, shows an error, and allows a real retry',async({page})=>{
  const{target,keeper,errors}=await prepare(page),before=await snapshot(page);
  await page.evaluate(()=>{const original=IDBObjectStore.prototype.delete;IDBObjectStore.prototype.delete=function(key){if(this.name==='khachHang'){IDBObjectStore.prototype.delete=original;throw new DOMException('test failure','QuotaExceededError');}return original.call(this,key);};});
  const dialog=await open(page);await dialog.getByRole('button',{name:'Xác nhận',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText('Xóa không thành công');expect(await snapshot(page)).toBe(before);
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();await expect(page.getByLabel('Họ tên',{exact:true})).toHaveValue('Bản ghi cần xóa');
  await open(page);await page.getByRole('button',{name:'Xác nhận',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText('Đã xóa thông tin khách hàng');
  const data=JSON.parse(await snapshot(page));expect(data.khachHang.some((x:{MaKH:string})=>x.MaKH===target)).toBe(false);expect(data.khachHang.some((x:{MaKH:string})=>x.MaKH===keeper)).toBe(true);expect(errors).toEqual([]);
});

test('busy confirmation blocks repeat clicks, X, cancel and Escape until one transaction finishes',async({page})=>{
  const{target,errors}=await prepare(page),before=JSON.parse(await snapshot(page));await open(page);
  await page.evaluate(id=>new Promise<void>((resolve,reject)=>{const request=indexedDB.open('CoCoDB');request.onerror=()=>reject(request.error);request.onsuccess=()=>{const db=request.result,tx=db.transaction('khachHang','readwrite'),store=tx.objectStore('khachHang');let locked=true;(window as unknown as {releaseConfirm:()=>void}).releaseConfirm=()=>{locked=false;};const pump=()=>{const r=store.get(id);r.onsuccess=()=>{if(locked)pump();};};pump();tx.oncomplete=()=>db.close();resolve();};}),target);
  await page.getByRole('button',{name:'Xác nhận',exact:true}).click();const dialog=page.locator('.confirm-dialog');await expect(dialog.getByRole('button',{name:'Đang xóa…',exact:true})).toBeDisabled();await expect(dialog.getByRole('button',{name:'Hủy',exact:true})).toBeDisabled();await expect(dialog.getByRole('button',{name:'Đóng xác nhận',exact:true})).toBeDisabled();
  await dialog.locator('.confirmation-accept').evaluate(button=>{(button as HTMLButtonElement).click();(button as HTMLButtonElement).click();});await page.keyboard.press('Escape');await expect(dialog).toBeVisible();
  await page.evaluate(()=>(window as unknown as {releaseConfirm:()=>void}).releaseConfirm());await expect(page.getByRole('alertdialog')).toContainText('Đã xóa thông tin khách hàng');
  const after=JSON.parse(await snapshot(page));expect(after.operations.length-before.operations.length).toBe(1);expect(after.auditEntries.length-before.auditEntries.length).toBe(1);expect(after.auditEntries.filter((x:{changed:string[]})=>x.changed.includes(JSON.stringify(['khachHang',target])))).toHaveLength(2);expect(errors).toEqual([]);
});

test('a changed customer cannot be deleted using an old open confirmation snapshot',async({page,context})=>{
  const{target,errors}=await prepare(page);await open(page);
  const other=await context.newPage();await other.goto('./');await login(other);await other.goto(`./#/customers/${target}`);await other.getByRole('button',{name:'Sửa thông tin',exact:true}).click();const form=other.getByRole('dialog',{name:'Sửa thông tin khách hàng',exact:true});await form.getByLabel('Họ tên',{exact:true}).fill('Tên đã cập nhật');await form.getByRole('button',{name:'Lưu',exact:true}).click();await expect(other.getByRole('alertdialog')).toContainText('Cập nhật thông tin khách hàng thành công');
  await page.getByRole('button',{name:'Xác nhận',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText('Dữ liệu đã thay đổi ở tab khác');
  const data=JSON.parse(await snapshot(page));expect(data.khachHang.find((x:{MaKH:string})=>x.MaKH===target).TenKH).toBe('Tên đã cập nhật');expect(errors).toEqual([]);
});
