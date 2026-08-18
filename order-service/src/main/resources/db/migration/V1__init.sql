CREATE TABLE customer_order (
    id VARCHAR(36) PRIMARY KEY,
    customer_name VARCHAR(200) NOT NULL,
    customer_phone VARCHAR(30) NOT NULL,
    region VARCHAR(100) NOT NULL,
    items_total NUMERIC(12, 2) NOT NULL,
    delivery_fee NUMERIC(12, 2) NOT NULL,
    grand_total NUMERIC(12, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE order_item (
    id BIGSERIAL PRIMARY KEY,
    order_id VARCHAR(36) NOT NULL REFERENCES customer_order(id) ON DELETE CASCADE,
    variant_id BIGINT NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    sku VARCHAR(100) NOT NULL,
    attributes JSONB NOT NULL DEFAULT '{}'::jsonb,
    unit_price NUMERIC(12, 2) NOT NULL,
    quantity INTEGER NOT NULL
);

CREATE INDEX idx_order_item_order_id ON order_item(order_id);

CREATE TABLE telegram_admin (
    chat_id BIGINT PRIMARY KEY,
    username VARCHAR(200),
    registered_at TIMESTAMPTZ NOT NULL
);
