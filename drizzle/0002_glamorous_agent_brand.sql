DROP INDEX "categories_slug_key";--> statement-breakpoint
DROP INDEX "content_wp_id_key";--> statement-breakpoint
CREATE UNIQUE INDEX "content_wp_id_key" ON "content" USING btree ("wp_id") WHERE "content"."wp_id" IS NOT NULL;