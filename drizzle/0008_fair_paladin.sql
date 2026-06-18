CREATE TABLE "site_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" text NOT NULL,
	"label" text NOT NULL,
	"group" text DEFAULT 'general' NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX "site_settings_key_key" ON "site_settings" USING btree ("key");--> statement-breakpoint
CREATE INDEX "site_settings_group_idx" ON "site_settings" USING btree ("group");--> statement-breakpoint
CREATE INDEX "site_settings_group_active_idx" ON "site_settings" USING btree ("group","is_active");