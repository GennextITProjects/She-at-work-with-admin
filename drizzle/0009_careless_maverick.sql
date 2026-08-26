CREATE INDEX "content_updated_at_idx" ON "content" USING btree ("updated_at");--> statement-breakpoint
CREATE INDEX "resources_location_label_title_idx" ON "resources" USING btree ("location_label","title");--> statement-breakpoint
CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");--> statement-breakpoint
--
-- Search indexes (hand-written; not represented in schema.ts).
--
-- drizzle-kit diffs schema.ts against its own snapshot, not the live database,
-- so indexes it has never seen are invisible to it and will not be dropped by
-- a future `generate`. Keeping them here rather than in schema.ts avoids
-- fighting the snapshot over expression/GIN index representations.
--
CREATE EXTENSION IF NOT EXISTS pg_trgm;--> statement-breakpoint

-- GET /api/content?suggestions=1&q=... and /api/content/search both run
--   title ILIKE '%q%' OR author_name ILIKE '%q%'
-- A leading wildcard cannot use a btree index, so every keystroke was a
-- sequential scan over all published rows of that content type.
CREATE INDEX IF NOT EXISTS "content_title_trgm_idx"
  ON "content" USING gin ("title" gin_trgm_ops);--> statement-breakpoint

CREATE INDEX IF NOT EXISTS "content_author_name_trgm_idx"
  ON "content" USING gin ("author_name" gin_trgm_ops);--> statement-breakpoint

-- GET /api/content?search=... filters with
--   to_tsvector('english', title) @@ plainto_tsquery('english', $1)
-- Without a matching expression index, to_tsvector() is recomputed for every
-- row on every search. The expression below must stay character-for-character
-- in sync with the one in src/app/api/content/route.ts for the planner to use it.
CREATE INDEX IF NOT EXISTS "content_title_fts_idx"
  ON "content" USING gin (to_tsvector('english', "title"));
