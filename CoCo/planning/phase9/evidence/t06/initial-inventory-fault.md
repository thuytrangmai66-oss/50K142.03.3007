# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: inventory.spec.ts >> G7 T01 empty inventory and native read failure use source error notices without writes
- Location: tests\e2e\inventory.spec.ts:112:1

# Error details

```
Test timeout of 30000ms exceeded.
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