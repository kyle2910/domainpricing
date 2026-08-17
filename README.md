# DomainPricing

Static site (Astro + Tailwind CSS + daisyUI) hiển thị bảng giá tên miền theo
registrar, build tự động từ các file CSV trong thư mục `csv/`.

## Cách dùng

1. Đặt các file CSV của bạn vào thư mục `csv/`. Mỗi file phải có 3 cột:

   ```csv
   tld,registration,renewal
   com,9.08,10.18
   net,11.4,11.4
   ```

2. Tên file quyết định URL và tên hiển thị:

   | File trong `csv/`     | URL              | Tên hiển thị |
   |------------------------|------------------|--------------|
   | `average.csv`          | `/` (trang chủ)  | Average      |
   | `cloudflare.com.csv`   | `/cloudflare`    | Cloudflare   |
   | `gandi.net.csv`        | `/gandi.net`     | Gandi        |
   | `name.com.csv`         | `/name`          | Name         |

   Quy tắc: nếu tên file kết thúc bằng `.com`, phần `.com` sẽ bị bỏ khỏi URL
   (`cloudflare.com.csv` → `/cloudflare`). Các đuôi khác (`.net`, v.v.) được
   giữ nguyên trong URL để tránh trùng slug.

   Bắt buộc phải có `average.csv` — đây là dữ liệu cho trang chủ `/`.

3. Cài dependencies và chạy dev server:

   ```bash
   npm install
   npm run dev
   ```

4. Build static site:

   ```bash
   npm run build
   ```

   Output nằm ở `dist/`, có thể deploy lên bất kỳ static host nào
   (Cloudflare Pages, Netlify, Vercel, GitHub Pages, v.v.)

## Tính năng

- **17 trang tự sinh** từ 17 file CSV (không giới hạn số lượng, thêm file là
  tự có thêm trang).
- **Sort + search** trên mỗi bảng giá (bấm header để sort, gõ để lọc theo TLD).
- **Đổi tiền tệ** qua [Frankfurter API](https://frankfurter.dev) — mặc định
  USD, người dùng chọn tiền tệ khác thì tự động fetch tỷ giá và quy đổi tại
  client, cache theo ngày trong `localStorage`.
- **Dark/light tự động** theo `prefers-color-scheme` của hệ thống, dùng 2
  theme có sẵn của daisyUI (`light` / `dark`), không có nút bật/tắt thủ công.
- **CSV database công khai** tại `/database/<tên-file>.csv` cho mỗi registrar
  (endpoint tĩnh, build từ chính file CSV gốc).
- **SEO cho Google/Bing**: mỗi trang có title, meta description, meta
  keywords (`Domain Pricing`, `{Tên registrar} Domain Pricing`,
  `Domain Pricing API`, `Domain Pricing Comparison`), canonical URL, Open
  Graph + Twitter card, JSON-LD (`schema.org/Dataset`), `robots.txt`, và
  `sitemap.xml` tự sinh từ danh sách CSV hiện có. **Nhớ đổi `site:` trong
  `astro.config.mjs` thành domain thật của bạn** trước khi deploy, nếu không
  canonical URL và sitemap sẽ vẫn trỏ về `domainpricing.net`.

## Cấu trúc project

```
csv/                       ← đặt file CSV của bạn vào đây
src/
  lib/registrars.ts        ← đọc & parse toàn bộ CSV lúc build
  scripts/currency.ts       ← logic gọi Frankfurter API, cache, format số
  styles/global.css         ← import Tailwind + cấu hình theme daisyUI
  components/
    SiteHeader.astro        ← header (daisyUI navbar) + chọn currency + nav registrar
    SiteFooter.astro
    PricingTable.astro      ← bảng giá (daisyUI table): sort, search, render giá
    RegistrarPage.astro     ← layout nội dung dùng chung cho mọi trang
  pages/
    index.astro             ← trang chủ (dùng average.csv)
    [registrar].astro       ← route động, 1 trang / 1 file CSV (trừ average)
    database/[file].csv.ts  ← serve raw CSV tại /database/*.csv
```

## UI: Tailwind CSS + daisyUI

Giao diện dùng [daisyUI](https://daisyui.com) với 2 theme mặc định `light`
và `dark`. Theme được chọn tự động theo `prefers-color-scheme` của hệ điều
hành thông qua cấu hình trong `src/styles/global.css`:

```css
@import "tailwindcss";
@plugin "daisyui" {
  themes: light --default, dark --prefersdark;
}
```

Không có toggle chuyển theme thủ công trong UI. Muốn đổi theme, đổi tên theme
trong dòng trên (danh sách theme có sẵn: https://daisyui.com/docs/themes/)
hoặc thêm theme tùy biến theo tài liệu daisyUI.

## Ghi chú kỹ thuật

- Nếu 2 file CSV sau khi strip `.com` cho ra cùng 1 slug (hiếm khi xảy ra vì
  tên miền registrar là duy nhất), Astro sẽ báo lỗi trùng route lúc build —
  đổi tên file để tránh trùng.
- Toàn bộ giá trong CSV được coi là **USD**. Khi người dùng chọn tiền tệ
  khác, giá được nhân với tỷ giá Frankfurter tương ứng ngay trên trình
  duyệt — dữ liệu gốc trong CSV/database không đổi.
