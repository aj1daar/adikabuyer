-- Human-friendly order number ("№1042") next to the UUID id: customers read it on the
-- success screen and admins say it on the phone. Existing orders get numbers on migrate.
CREATE SEQUENCE customer_order_number_seq START WITH 1001;

ALTER TABLE customer_order
    ADD COLUMN number BIGINT NOT NULL DEFAULT nextval('customer_order_number_seq');

ALTER TABLE customer_order
    ADD CONSTRAINT uq_customer_order_number UNIQUE (number);

ALTER SEQUENCE customer_order_number_seq OWNED BY customer_order.number;
