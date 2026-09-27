# Catalog model

How products are stored and what the admin can set. The storefront side is in [FRONTEND.md](FRONTEND.md).

## Products

A product has a name, description, optional category, optional brand, and up to 8 free-text labels (40 characters each), such as `Limited` or `С принтом`. The backend also returns an `isNew` flag, which is true for two weeks after the product is created and isn't stored anywhere (`util/ProductFlags`). The storefront shows it as a «Новинка» sticker.

On `PUT`, leaving `labels` or `colorSwatches` out of the request keeps the current values. Only an explicit empty list or map clears them.

## Variants

Every product has at least one variant. A variant has its own price, stock, photos, attributes and one of three states:

| State | Meaning |
| --- | --- |
| `IN_STOCK` | Sold from stock; the quantity can't go above the stock |
| `PRE_ORDER` | Ordered from the supplier. Stock is forced to 0 and there is no quantity limit |
| `SOLD_OUT` | Stock is forced to 0 and the variant is hidden from the storefront |

`VariantReconciler` and the inventory listener apply these rules, so they hold however a variant is saved.

A product whose variants are all `SOLD_OUT` is archived:
- it drops out of the product list and the category list;
- its product page returns 404.

The admin panel still lists archived products with an «В архиве» badge. Switching one variant back from `SOLD_OUT` restores the product.

### SKU

The SKU is optional. If it's left blank, the backend builds one from the attributes in the order colour → size → volume → others (for example `ЧЁРНЫЙ-M-591`), adding `-2`, `-3` and so on if it's taken. A variant with no attributes gets a `DEFAULT-…` placeholder, and the storefront never shows that placeholder to customers.

## Attributes

- **Colour and size** come from fixed lists in `frontend/src/utils/attributeOptions.ts`. The admin form and the storefront filters use the same lists, so anything the admin picks can be filtered. Size is chosen from a dropdown. Colour is free text with the list offered as suggestions, so a colour typed by hand won't match a filter.
- **Volume** is a number in millilitres, filtered as a from/to range.
- **Custom attributes** (any key and value) are shown on the product but can't be filtered.

A variant can have at most five attributes, and no key twice; two volumes belong in two variants.

## Photos and swatches

- **Photos:** each variant has its own photo list (`variant.imageUrls`). A variant without photos borrows them from the most similar variant that has some, so one photo on a black variant covers every black size.
- **Swatches:** each colour can also have one round swatch, stored per product in `product.color_swatches` as `{colour: url}`. The admin crops it from any photo in a circular cropper (`components/admin/CircleCropper.tsx`), and swatches for colours no longer used are dropped on save.

## Orders

Orders get a sequential number starting at 1001. Each one records the agreed weight fee and an admin note, and its final total is the item total plus delivery plus the weight fee.

An order records exactly how much stock it took. Cancelling an order, or deleting one that's still open, returns that stock. A variant goes back from `SOLD_OUT` to `IN_STOCK` only if that same order sold it out. The status flow and the RabbitMQ events are described in [ARCHITECTURE.md](ARCHITECTURE.md#order-flow).
