-- What each order actually took from stock, so a cancelled order can give back exactly that:
-- the deduction is floored at 0 (and PRE_ORDER variants sit at 0), so "add the ordered
-- quantity back" would invent stock. caused_sold_out marks deductions that flipped an
-- IN_STOCK variant to SOLD_OUT, the only case where a return may flip it back.
CREATE TABLE order_stock_deduction (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(255) NOT NULL,
    variant_id BIGINT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    caused_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    deducted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    restored_at TIMESTAMPTZ
);

CREATE INDEX idx_order_stock_deduction_order_id ON order_stock_deduction (order_id);
