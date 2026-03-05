DROP INDEX "categories_name_content_type_key";--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_content_type_key" ON "categories" USING btree ("slug","content_type");