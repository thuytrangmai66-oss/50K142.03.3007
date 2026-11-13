import { expect, test, type Page } from '@playwright/test';
import { bootstrapOwner, login } from './auth-helpers';
const STAFF={name:'Nhân viên demo',phone:'0900000002',username:'staff',password:'staff-demo!'};
async function openStaff(page:Page){await page.getByRole('link',{name:'Nhân viên',exact:true}).click();}
async function createStaff(page:Page,profile=STAFF){
  await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  const form=page.getByRole('dialog',{name:'Tạo tài khoản nhân viên',exact:true});
  await form.getByLabel('Họ tên',{exact:true}).fill(profile.name);await form.getByLabel('Số điện thoại',{exact:true}).fill(profile.phone);
  await form.getByLabel('Tên đăng nhập',{exact:true}).fill(profile.username);await form.getByLabel('Mật khẩu',{exact:true}).fill(profile.password);
  await form.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('alertdialog')).toContainText('Tạo tài khoản mới thành công');
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();
  await expect(page.getByRole('link',{name:profile.name,exact:true})).toBeVisible();
}

test('staff management UI validates all fields, cancels, creates, reads safe details and checks duplicates',async({page},info)=>{
  await bootstrapOwner(page);await login(page);await openStaff(page);
  await expect(page.getByText('Chưa có tài khoản nhân viên',{exact:true})).toBeVisible();
  await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  const form=page.getByRole('dialog',{name:'Tạo tài khoản nhân viên',exact:true});
  await form.getByRole('button',{name:'Lưu',exact:true}).click();
  for(const message of ['Họ tên không được để trống','Số điện thoại không được để trống','Tên đăng nhập không được để trống','Mật khẩu không được để trống'])await expect(form.getByText(message,{exact:true})).toBeVisible();
  await form.getByLabel('Số điện thoại',{exact:true}).fill('123');await form.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(form.getByText('Số điện thoại không hợp lệ',{exact:true})).toBeVisible();
  await form.getByRole('button',{name:'Hủy',exact:true}).click();
  await expect(page.getByText('Chưa có tài khoản nhân viên',{exact:true})).toBeVisible();
  await createStaff(page);await page.screenshot({path:info.outputPath('owner-staff-list.png'),fullPage:true});
  await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  for(const [label,value]of [['Họ tên',STAFF.name],['Số điện thoại',STAFF.phone],['Tên đăng nhập',STAFF.username],['Mật khẩu',STAFF.password]])await form.getByLabel(label,{exact:true}).fill(value);
  await expect(form.getByLabel('Mật khẩu',{exact:true})).toHaveAttribute('type','password');
  await form.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(form.getByText('Số điện thoại đã tồn tại',{exact:true})).toBeVisible();
  await expect(form.getByText('Tên đăng nhập đã tồn tại',{exact:true})).toBeVisible();
  await form.getByRole('button',{name:'Hủy',exact:true}).click();
  await page.getByRole('link',{name:STAFF.name,exact:true}).click();
  await expect(page.getByLabel('Tên đăng nhập',{exact:true})).toHaveValue('staff');
  await expect(page.getByLabel('Mật khẩu',{exact:true})).toHaveCount(0);
  await page.getByRole('button',{name:'Sửa thông tin',exact:true}).click();
  const edit=page.getByRole('dialog',{name:'Sửa tài khoản nhân viên',exact:true});
  await edit.getByLabel('Họ tên',{exact:true}).fill('Không lưu');await edit.getByRole('button',{name:'Hủy',exact:true}).click();
  await expect(page.getByLabel('Họ tên',{exact:true})).toHaveValue(STAFF.name);
  await page.getByRole('button',{name:'Xóa tài khoản',exact:true}).click();
  await page.getByRole('dialog',{name:'Bạn có chắc chắn muốn xóa tài khoản này không?',exact:true}).getByRole('button',{name:'Hủy',exact:true}).click();
  await expect(page.getByLabel('Tên đăng nhập',{exact:true})).toHaveValue('staff');
  await page.screenshot({path:info.outputPath('owner-staff-detail.png'),fullPage:true});
});

test('two real UI-created roles retain independent sessions; rename and delete revoke staff live',async({page,context},info)=>{
  await bootstrapOwner(page);await login(page);await openStaff(page);await createStaff(page);
  const ownerToken=await page.evaluate(()=>sessionStorage.getItem('coco:session'));
  const staff=await context.newPage();await staff.goto('./');await login(staff,STAFF.username,STAFF.password);
  expect(await staff.evaluate(()=>sessionStorage.getItem('coco:session'))).not.toBe(ownerToken);
  await expect(staff.getByRole('link',{name:'Nhân viên',exact:true})).toHaveCount(0);
  await staff.goto('./#/staff');await expect(staff.getByRole('heading',{name:'Không có quyền truy cập',exact:true})).toBeVisible();
  await staff.getByRole('link',{name:'Về trang chủ',exact:true}).click();
  await page.getByRole('link',{name:STAFF.name,exact:true}).click();
  const employeeId=await page.getByLabel('Mã nhân viên',{exact:true}).inputValue();
  await page.getByRole('button',{name:'Sửa thông tin',exact:true}).click();
  const edit=page.getByRole('dialog',{name:'Sửa tài khoản nhân viên',exact:true});
  await edit.getByLabel('Họ tên',{exact:true}).fill('Tên nhân viên mới');await edit.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('alertdialog')).toContainText('Cập nhật thông tin thành công');await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();
  await expect(staff.locator('.account-name')).toContainText('Tên nhân viên mới');
  await expect(staff.getByRole('heading',{name:'Trang chủ',exact:true})).toBeVisible();
  await staff.screenshot({path:info.outputPath('staff-created-ui-session.png'),fullPage:true});
  await page.getByRole('button',{name:'Sửa thông tin',exact:true}).click();await edit.getByLabel('Tên đăng nhập',{exact:true}).fill('renamed');
  await edit.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText('Cập nhật thông tin thành công');
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();
  await expect(staff.getByRole('heading',{name:'Đăng nhập',exact:true})).toBeVisible();
  await expect(page.getByLabel('Mã nhân viên',{exact:true})).toHaveValue(employeeId);
  await expect(page.getByLabel('Tên đăng nhập',{exact:true})).toHaveValue('renamed');
  await staff.getByLabel('Tên đăng nhập:',{exact:true}).fill('staff');await staff.getByLabel('Mật khẩu:',{exact:true}).fill(STAFF.password);await staff.getByRole('button',{name:'Đăng nhập',exact:true}).click();
  await expect(staff.getByRole('alert')).toHaveText('Tên đăng nhập hoặc mật khẩu không đúng');await login(staff,'renamed',STAFF.password);
  await page.getByRole('button',{name:'Xóa tài khoản',exact:true}).click();await page.getByRole('dialog',{name:'Bạn có chắc chắn muốn xóa tài khoản này không?',exact:true}).getByRole('button',{name:'Xác nhận',exact:true}).click();
  await expect(page.getByRole('alertdialog')).toContainText('Xóa tài khoản thành công');
  await expect(staff.getByRole('heading',{name:'Đăng nhập',exact:true})).toBeVisible();
  expect(await page.evaluate(()=>sessionStorage.getItem('coco:session'))).toBe(ownerToken);
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();await expect(page.getByText('Chưa có tài khoản nhân viên',{exact:true})).toBeVisible();
});

test('two owner forms cannot overwrite a staff profile with a stale version',async({page,context})=>{
  await bootstrapOwner(page);await login(page);await openStaff(page);await createStaff(page);await page.getByRole('link',{name:STAFF.name,exact:true}).click();
  const url=page.url(),other=await context.newPage();await other.goto('./');await login(other);await other.goto(url);
  for(const tab of [page,other])await tab.getByRole('button',{name:'Sửa thông tin',exact:true}).click();
  const form=page.getByRole('dialog',{name:'Sửa tài khoản nhân viên',exact:true}),stale=other.getByRole('dialog',{name:'Sửa tài khoản nhân viên',exact:true});
  await form.getByLabel('Họ tên',{exact:true}).fill('Tên thắng');await form.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(page.getByRole('alertdialog')).toContainText('Cập nhật thông tin thành công');
  await stale.getByLabel('Họ tên',{exact:true}).fill('Ghi đè');await stale.getByRole('button',{name:'Lưu',exact:true}).click();
  await expect(other.getByRole('alertdialog')).toContainText('Dữ liệu đã thay đổi ở tab khác');
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();await expect(page.getByLabel('Họ tên',{exact:true})).toHaveValue('Tên thắng');
});

test('account create storage failure keeps form, rolls back and allows UI retry',async({page})=>{
  await bootstrapOwner(page);await login(page);await openStaff(page);
  await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();const form=page.getByRole('dialog',{name:'Tạo tài khoản nhân viên',exact:true});
  for(const[label,value]of [['Họ tên',STAFF.name],['Số điện thoại',STAFF.phone],['Tên đăng nhập',STAFF.username],['Mật khẩu',STAFF.password]])await form.getByLabel(label,{exact:true}).fill(value);
  await page.evaluate(()=>{const original=IDBObjectStore.prototype.put;IDBObjectStore.prototype.put=function(...args){if(this.name==='accountSecurity'){IDBObjectStore.prototype.put=original;throw new DOMException('test failure','QuotaExceededError');}return original.apply(this,args);};});
  await form.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText('Lỗi trong quá trình lưu. Vui lòng thử lại');
  await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();await expect(form.getByLabel('Họ tên',{exact:true})).toHaveValue(STAFF.name);
  await form.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText('Tạo tài khoản mới thành công');
});

for(const viewport of [{width:1366,height:650},{width:1280,height:720}])test(`desktop details land on loaded content at ${viewport.width}x${viewport.height}`,async({page},info)=>{
  await page.setViewportSize(viewport);await bootstrapOwner(page);await login(page);await openStaff(page);await createStaff(page);
  await page.getByRole('link',{name:STAFF.name,exact:true}).click();await expect(page.getByRole('heading',{name:'Thông tin tài khoản nhân viên',exact:true})).toBeInViewport();
  await expect(page.getByLabel('Tên đăng nhập',{exact:true})).toBeInViewport();
  await expect(page.getByRole('button',{name:'Sửa thông tin',exact:true})).toBeInViewport({ratio:1});
  await page.screenshot({path:info.outputPath('desktop-staff-detail.png'),fullPage:false});
  await page.getByRole('link',{name:'Khách hàng',exact:true}).click();await page.getByRole('button',{name:'Tạo tài khoản',exact:true}).click();
  const form=page.getByRole('dialog',{name:'Tạo thông tin khách hàng',exact:true});await form.getByLabel('Họ tên',{exact:true}).fill('Khách xem chi tiết');await form.getByLabel('Số điện thoại',{exact:true}).fill('0123456789');
  await form.getByRole('button',{name:'Lưu',exact:true}).click();await expect(page.getByRole('alertdialog')).toContainText('Đã thêm thông tin khách hàng');await page.getByRole('button',{name:'Đóng thông báo',exact:true}).click();
  await page.getByRole('link',{name:'Khách xem chi tiết',exact:true}).click();await expect(page.getByRole('heading',{name:'Thông tin khách hàng',exact:true})).toBeInViewport();
  await expect(page.getByLabel('Số điện thoại',{exact:true})).toBeInViewport();
  await expect(page.getByRole('button',{name:'Sửa thông tin',exact:true})).toBeInViewport({ratio:1});
  await expect(page.getByRole('button',{name:'Xóa tài khoản',exact:true})).toBeInViewport({ratio:1});
  const landing=await page.locator('.record-card').evaluate(card=>{const main=document.getElementById('main-content')!;const offset=card.getBoundingClientRect().top-main.getBoundingClientRect().top+main.scrollTop;return{actual:main.scrollTop,expected:Math.min(offset-20,main.scrollHeight-main.clientHeight)};});
  expect(Math.abs(landing.actual-Math.max(0,landing.expected))).toBeLessThanOrEqual(3);
  await expect(page.locator('.page-header')).toBeInViewport();await expect(page.getByRole('link',{name:'CoCo — Trang chủ',exact:true})).toBeInViewport();
  await page.screenshot({path:info.outputPath('desktop-customer-detail.png'),fullPage:false});
  await page.getByRole('link',{name:'Lịch sử mua',exact:true}).click();await expect(page.getByText('Không tìm thấy lịch sử mua',{exact:true})).toBeInViewport();
});
