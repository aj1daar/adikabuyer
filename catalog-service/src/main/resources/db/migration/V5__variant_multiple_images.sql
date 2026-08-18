ALTER TABLE variant ADD COLUMN image_urls JSONB NOT NULL DEFAULT '[]'::jsonb;
UPDATE variant SET image_urls = jsonb_build_array(image_url) WHERE image_url IS NOT NULL;
ALTER TABLE variant DROP COLUMN image_url;
