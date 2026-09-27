# Frontend

React + TypeScript + Vite + Tailwind, in `frontend/`. The site is Russian-only and built for phones first (iOS Safari and Chrome), then desktop.

## Design system

The look is Neo-Y2K:

- **Type:** Unbounded everywhere; Space Grotesk only in the logo.
- **Shapes:** pill-shaped controls, 2px black borders, hard offset shadows instead of blur.
- **Colours:** white, black (`ink`), silver and bubblegum pink.
  - `bubblegum-dark` (#C24775) is the pink for text and hovers. It has 4.7:1 contrast on white and under white text, so it passes WCAG AA.
  - Plain `bubblegum` (#E8799F) is only for decoration or behind black text.
- **Scrollbars:** hidden everywhere (`index.css`). Sideways rows such as sizes, colours and thumbnails use `ScrollFadeRow`, which fades the edge that still has more content.
- **Backdrop:** every storefront page sits on `SiteBackdrop`: a faint grid, a few outline shapes laid out per page, and a `DotField` canvas of slowly drifting dots.
- **Motion:** pop-in animations come from `utils/motion.ts`. With Reduce Motion on, nothing freezes: the dots slow down and lose their trails, and the pop-ins play a smaller version without the bounce. `App.tsx` sets `MotionConfig reducedMotion="never"` and each component picks its gentle variant itself.

Phone rules for every component:
- 16px inputs, so iOS doesn't zoom on focus;
- tap targets of at least 44px;
- `dvh` units for full-height panels;
- safe-area insets;
- scroll locking behind overlays.

## Accessibility

- Overlays are modal dialogs through `hooks/useDialog`:
  - focus moves in when they open, and Tab stays inside;
  - Escape closes the top one;
  - focus goes back to whatever opened it.
- Keyboard focus shows a thick pink ring (`:focus-visible`), which mouse and touch users never see.
- API errors are always shown in Russian. `utils/apiErrorMessage.ts` maps known server messages and falls back by HTTP status.

## Storefront

### Layout

- **Header:** hides while scrolling down.
- **Bottom tab bar (phones):** Главная, Каталог, О нас and Корзина with an item count. It stays in place while scrolling.
- **Hero and About:** each fills one desktop screen, and grows instead of clipping on short screens such as landscape phones.
- **Missing and broken pages:** an unknown URL shows a 404 page in the site style. A crash anywhere shows a matching error page (`ErrorBoundary`) with reload and home buttons, built from plain markup so it still renders if the app itself broke.

### Catalog

- **URL state:** search, filters and page are in the URL (`?q=…&category=…&color=…&size=…&vmin=…&vmax=…&page=2`). Back from a product, a reload or a shared link all show the same results. `router/ScrollToTop` opens new pages at the top but restores the scroll position on back and forward.
- **Paging:** 12 products per page on phones, 24 on desktop.
- **Columns on phones:** 1, 2 or 3 columns, the shopper's choice (remembered in `localStorage`). Compact cards drop the description and tags but keep the name on two lines.
- **Desktop filters:** a pick applies at once, and the button shows the value («Цвет: Чёрный»). The volume range applies on Enter or a click outside.
- **Mobile filters:** a bottom sheet that is only as tall as its content. Choices apply with «Показать товары».
- **While filtering:** the grid shows «Найдено N товаров» and a «Сбросить всё» link.
- **Loading:** the first load shows a skeleton in the grid's shape. A product without a photo shows a «фото скоро» placeholder.

### Product card and product page

- **Card button:** the card adds to the cart directly only when there's nothing left to choose. Otherwise its button says «Выбрать» and opens the product page.
- **Stickers:** «Под заказ» leads the card's stickers when every option the shopper can pick is pre-order.
- **Selected options:** the product page highlights the pre-selected variant's options from the start. Picking a value pins it; the other picks relax to the closest real variant. Values that can't be combined with the current picks are struck through.
- **Photos:** the main photo loads first; thumbnails and swatches load lazily.
- **Structured data:** the page adds JSON-LD Product data, with availability taken from the variants.

### Cart and checkout

- **Saved cart:** the cart is kept in `localStorage` (`adikabuyer-cart`), so a reload doesn't empty it. Prices there are only a preview; checkout re-prices every line on the server.
- **Stock limit:** in-stock items can't go above the stock left (`hooks/useStockLimit`). The cart shows «Больше нет в наличии», and the add button changes to «Всё в корзине».
- **Adding to the cart:** it works the same from a card and from the product page (`utils/notifyAddedToCart`). A toast with an «Открыть» button appears, and the drawer never opens by itself.
- **Checkout form:** visible labels, autofill for name and phone, and Enter to submit (it jumps to the empty field if one is left). A line under the button says what's still missing.
- **Empty cart:** it links to the catalog instead of showing a total.

## Admin panel

`/admin` and `/admin/login` load as a separate chunk, so shoppers never download them.

### Products

- **Phone layout:** on phones the product list is a stack of cards (`ProductCardList`) instead of a table.
- **Search:** the search box matches every word typed against name, description, category, brand, labels, SKUs and attribute values (`utils/filterAdminProducts.ts`).
- **Variant rows:** in the product form they collapse to a one-line summary.
- **Closing with unsaved changes:** the form asks «Закрыть без сохранения?» first, from «Закрыть» or Escape.

### Orders

- **Order cards:** each shows the number, a status sticker, a tap-to-call phone and the total including the weight fee.
- **Actions:** a status filter, a one-tap «→ next step» button, inline editing of the weight fee and note, and confirmation before cancelling or deleting.

## Performance

- **Fonts:** Google Fonts load from `index.html` with preconnect, not through a CSS `@import`.
- **Admin chunk:** the admin panel is split out of the main bundle.
- **Main bundle:** still about 530 KB (170 KB gzipped), almost all React, the router and framer-motion.
- **Images:** there are no resized versions or `srcset`; that needs resizing at upload on the backend.

## SEO

- `index.html` has the meta description, Open Graph tags, a web manifest with home-screen icons and a `theme-color`.
- Each page sets its own title (`usePageTitle`).
- `robots.txt` blocks `/admin`, and `sitemap.xml` is static.
