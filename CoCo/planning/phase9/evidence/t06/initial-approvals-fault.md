# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: purchase-approvals.spec.ts >> T03 real requests paginate and list read error recovers through navigation
- Location: tests\e2e\purchase-approvals.spec.ts:197:1

# Error details

```
Test timeout of 90000ms exceeded.
```

```
Error: locator.click: Test timeout of 90000ms exceeded.
Call log:
  - waiting for getByRole('link', { name: 'Phê duyệt', exact: true })
    - locator resolved to <a class="" href="#/approvals">…</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" role="alertdialog" class="result-dialog result-error" aria-label="Lỗi hệ thống, vui lòng thử lại sau">…</dialog> from <div class="workspace">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <dialog open="" role="alertdialog" class="result-dialog result-error" aria-label="Lỗi hệ thống, vui lòng thử lại sau">…</dialog> from <div class="workspace">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    160 × waiting for element to be visible, enabled and stable
        - element is visible, enabled and stable
        - scrolling into view if needed
        - done scrolling
        - <dialog open="" role="alertdialog" class="result-dialog result-error" aria-label="Lỗi hệ thống, vui lòng thử lại sau">…</dialog> from <div class="workspace">…</div> subtree intercepts pointer events
      - retrying click action
        - waiting 500ms
    - waiting for element to be visible, enabled and stable

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - link "Đến nội dung chính" [ref=e4] [cursor=pointer]:
    - /url: "#main-content"
  - complementary [ref=e5]:
    - link "CoCo — Trang chủ" [ref=e6] [cursor=pointer]:
      - /url: "#/"
      - img "CoCo — Kho ký gửi" [ref=e7]
    - navigation "Điều hướng chính" [ref=e9]:
      - link "Trang chủ" [ref=e10] [cursor=pointer]:
        - /url: "#/"
      - link "Thu mua" [ref=e14] [cursor=pointer]:
        - /url: "#/purchases"
      - link "Bán hàng" [ref=e18] [cursor=pointer]:
        - /url: "#/sales"
      - link "Hàng hóa" [ref=e24] [cursor=pointer]:
        - /url: "#/inventory"
      - link "Khách hàng" [ref=e29] [cursor=pointer]:
        - /url: "#/customers"
      - link "Báo cáo" [ref=e34] [cursor=pointer]:
        - /url: "#/reports"
      - link "Phê duyệt" [ref=e37] [cursor=pointer]:
        - /url: "#/approvals"
      - link "Nhân viên" [ref=e40] [cursor=pointer]:
        - /url: "#/staff"
      - link "Khung giá thu mua" [ref=e44] [cursor=pointer]:
        - /url: "#/price-brackets"
    - generic [ref=e46]:
      - paragraph [ref=e47]: Chủ cửa hàng
      - button "Đăng xuất" [ref=e49] [cursor=pointer]
  - generic [ref=e53]:
    - banner [ref=e54]:
      - generic [ref=e55]: Trang Chủ
      - generic [ref=e56]: Chủ kiểm thử
    - main [ref=e61]:
      - region "Trang chủ CoCo" [ref=e62]:
        - heading "Trang chủ" [level=1] [ref=e63]
        - button "Thử lại" [ref=e64] [cursor=pointer]
        - alertdialog "Lỗi hệ thống, vui lòng thử lại sau" [ref=e65]:
          - button "Đóng thông báo" [active] [ref=e66] [cursor=pointer]
          - heading "Lỗi hệ thống, vui lòng thử lại sau" [level=2] [ref=e73]
        - region "Truy cập nhanh" [ref=e74]:
          - link "Truy cập nhanh Thu mua" [ref=e75] [cursor=pointer]:
            - /url: "#/purchases"
            - strong [ref=e79]: Thu mua
          - link "Truy cập nhanh Bán hàng" [ref=e80] [cursor=pointer]:
            - /url: "#/sales"
            - strong [ref=e86]: Bán hàng
```

# Test source

```ts
  119 |   await expect(page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toBeVisible();
  120 |   expect(await snapshot(page)).toEqual(before);
  121 |   await page.evaluate(() => {
  122 |     const original = BroadcastChannel.prototype.postMessage;
  123 |     BroadcastChannel.prototype.postMessage = function (message) {
  124 |       if (this.name === 'coco:purchase-approvals') { BroadcastChannel.prototype.postMessage = original; throw new Error('T03 delivery failure'); }
  125 |       return original.call(this, message);
  126 |     };
  127 |   });
  128 |   await submit.click();
  129 |   await closeNotice(page, 'Kết quả phê duyệt chưa được gửi đi');
  130 |   await expect(page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toBeVisible();
  131 |   const saved = await snapshot(page);
  132 |   expect(saved.purchaseApprovals[0].decision).toMatchObject({ status: action === 'approve' ? 'approved' : 'rejected' });
  133 |   expect(saved.purchaseNotices).toHaveLength(1);
  134 |   await page.keyboard.press('Escape'); await page.locator('.approval-id-link').click();
  135 |   await expect(page.locator('.approval-decision')).toContainText(action === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối');
  136 |   expect(await snapshot(page)).toEqual(saved);
  137 | });
  138 |
  139 | for (const action of ['remove', 'cancel'] as const) test(`T03 refuses a request after employee ${action}`, async ({ page, context }) => {
  140 |   const staff = await setup(page, context);
  141 |   if (action === 'remove') await staff.getByRole('button', { name: 'Xóa Áo CoCo', exact: true }).click();
  142 |   else await staff.getByRole('button', { name: 'Hủy', exact: true }).click();
  143 |   await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  144 |   await closeNotice(page, 'Yêu cầu không còn đủ điều kiện phê duyệt');
  145 |   expect((await snapshot(page)).purchaseNotices).toHaveLength(0);
  146 | });
  147 |
  148 | test('T03 two owner tabs racing preserve a single decision and notice', async ({ page, context }) => {
  149 |   await setup(page, context);
  150 |   const second = await context.newPage(); await second.goto('./'); await login(second); await second.goto(page.url());
  151 |   await expect(second.getByRole('button', { name: 'Phê duyệt', exact: true })).toBeVisible();
  152 |   await Promise.all([page, second].map(tab => tab.getByRole('button', { name: 'Phê duyệt', exact: true }).evaluate(button => (button as HTMLButtonElement).click())));
  153 |   const messages = await Promise.all([page, second].map(async tab => { await expect(tab.getByRole('alertdialog')).toBeVisible(); return tab.getByRole('alertdialog').innerText(); }));
  154 |   expect(messages.filter(message => message.includes('Phê duyệt giá thu mua thành công'))).toHaveLength(1);
  155 |   expect(messages.filter(message => message.includes('Yêu cầu không còn đủ điều kiện phê duyệt'))).toHaveLength(1);
  156 |   expect((await snapshot(page)).purchaseNotices).toHaveLength(1);
  157 | });
  158 |
  159 | for (const action of ['approve', 'reject'] as const) test(`T03 ${action}: dismiss success with Escape, preserve filters and open another request without overlay`, async ({ page, context }, info) => {
  160 |   const staff = await setup(page, context);
  161 |   await page.keyboard.press('Escape');
  162 |   await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('Nhân viên T03');
  163 |   const sentOn = await page.evaluate(() => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date()));
  164 |   await page.getByLabel('Ngày gửi', { exact: true }).fill(sentOn);
  165 |   await addProduct(staff);
  166 |   await expect(page.locator('.approval-id-link')).toHaveCount(2);
  167 |   const requestId = await page.locator('.approval-id-link').first().innerText();
  168 |   await page.locator('.approval-id-link').first().click();
  169 |   if (action === 'approve') await page.getByRole('button', { name: 'Phê duyệt', exact: true }).click();
  170 |   else {
  171 |     await page.getByRole('button', { name: 'Từ chối', exact: true }).click();
  172 |     const reason = page.getByRole('dialog', { name: 'Lý do từ chối', exact: true });
  173 |     await reason.getByLabel('Lý do từ chối', { exact: true }).fill('Giá cao');
  174 |     await reason.getByRole('button', { name: 'Xác nhận', exact: true }).click();
  175 |   }
  176 |   await expect(page.getByRole('alertdialog')).toContainText(action === 'approve' ? 'Phê duyệt giá thu mua thành công' : 'Đã từ chối yêu cầu phê duyệt');
  177 |   const decided = await snapshot(page);
  178 |   await page.keyboard.press('Escape');
  179 |   await expectApprovalList(page);
  180 |   await expect(page.getByLabel('Tìm theo tên nhân viên', { exact: true })).toHaveValue('Nhân viên T03');
  181 |   await expect(page.getByLabel('Ngày gửi', { exact: true })).toHaveValue(sentOn);
  182 |   await expect(page.locator('.approval-list tbody tr').filter({ hasText: requestId })).toContainText(action === 'approve' ? 'Đã phê duyệt' : 'Đã từ chối');
  183 |   expect(await snapshot(page)).toEqual(decided);
  184 |   await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('missing');
  185 |   await expect(page.locator('.approval-id-link')).toHaveCount(0);
  186 |   await page.getByLabel('Tìm theo tên nhân viên', { exact: true }).fill('Nhân viên T03');
  187 |   await page.locator('.approval-list tbody tr').filter({ hasText: 'Chờ phê duyệt' }).getByRole('button').click();
  188 |   await expect(page.getByRole('dialog', { name: 'Yêu cầu thu mua', exact: true })).toBeVisible();
  189 |   await expect(page.getByRole('button', { name: 'Phê duyệt', exact: true })).toBeEnabled();
  190 |   await page.keyboard.press('Escape');
  191 |   await expectApprovalList(page);
  192 |   await page.locator('.page-header').click();
  193 |   await page.screenshot({ path: info.outputPath(`${action}-closed-to-list.png`) });
  194 |   expect(await snapshot(page)).toEqual(decided);
  195 | });
  196 |
  197 | test('T03 real requests paginate and list read error recovers through navigation', async ({ page, context }, info) => {
  198 |   test.setTimeout(90_000);
  199 |   await page.setViewportSize({ width: 1366, height: 768 });
  200 |   const staff = await setup(page, context);
  201 |   await page.keyboard.press('Escape');
  202 |   for (let index = 1; index < 12; index++) await addProduct(staff);
  203 |   const total = (await snapshot(page)).purchaseApprovals.length;
  204 |   expect(total).toBe(12);
  205 |   const pageSize = Number(await page.locator('.approval-list').getAttribute('data-page-size'));
  206 |   await expect(page.locator('.approval-id-link')).toHaveCount(Math.min(pageSize, total));
  207 |   await page.getByRole('button', { name: 'Trang 2', exact: true }).click();
  208 |   await expect(page.locator('.approval-id-link')).toHaveCount(total - pageSize);
  209 |   await page.screenshot({ path: info.outputPath('owner-list-page-2.png') });
  210 |   await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  211 |   await page.evaluate(() => {
  212 |     const original = IDBObjectStore.prototype.getAll;
  213 |     IDBObjectStore.prototype.getAll = function (...args) {
  214 |       if (this.name === 'purchaseApprovals') throw new DOMException('T03 list failure', 'UnknownError');
  215 |       return original.apply(this, args);
  216 |     };
  217 |     window.addEventListener('t03:restore-read', () => { IDBObjectStore.prototype.getAll = original; }, { once: true });
  218 |   });
> 219 |   await page.getByRole('link', { name: 'Phê duyệt', exact: true }).click();
      |                                                                    ^ Error: locator.click: Test timeout of 90000ms exceeded.
  220 |   await closeNotice(page, 'Lỗi! Không thể truy cập');
  221 |   await page.evaluate(() => window.dispatchEvent(new Event('t03:restore-read')));
  222 |   await page.getByRole('link', { name: 'Trang chủ', exact: true }).click();
  223 |   await page.getByRole('link', { name: 'Phê duyệt', exact: true }).click();
  224 |   await expect(page.locator('.approval-id-link')).toHaveCount(Math.min(pageSize, total));
  225 | });
  226 |
  227 |
```