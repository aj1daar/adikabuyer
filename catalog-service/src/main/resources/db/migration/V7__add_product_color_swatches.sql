ALTER TABLE product ADD COLUMN color_swatches JSONB NOT NULL DEFAULT '{}'::jsonb;
