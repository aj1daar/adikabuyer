-- The parcel-weight surcharge is agreed with the customer at confirmation, so it is recorded
-- here once known (NULL until then); the final amount is grand_total + weight_fee.
-- admin_note keeps whatever the call settled (colour swap, pickup time, prepayment…).
ALTER TABLE customer_order
    ADD COLUMN weight_fee NUMERIC(12, 2),
    ADD COLUMN admin_note VARCHAR(1000);

ALTER TABLE customer_order
    ADD CONSTRAINT chk_customer_order_weight_fee CHECK (weight_fee IS NULL OR weight_fee >= 0);
