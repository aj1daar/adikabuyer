-- Order lifecycle: NEW -> CONFIRMED -> PURCHASED -> SHIPPED -> DELIVERED, or CANCELLED.
-- Orders placed before this migration start as NEW.
ALTER TABLE customer_order
    ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'NEW',
    ADD COLUMN status_updated_at TIMESTAMPTZ;

ALTER TABLE customer_order
    ADD CONSTRAINT chk_customer_order_status
        CHECK (status IN ('NEW', 'CONFIRMED', 'PURCHASED', 'SHIPPED', 'DELIVERED', 'CANCELLED'));

CREATE INDEX idx_customer_order_status ON customer_order (status);
