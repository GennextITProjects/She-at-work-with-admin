CREATE TABLE "contact_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"subject" text,
	"message" text NOT NULL,
	"is_resolved" boolean DEFAULT false NOT NULL,
	"resolved_by" uuid,
	"resolved_at" timestamp,
	"notes" text,
	"submitted_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "story_submissions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"phone" text,
	"title" text NOT NULL,
	"story" text NOT NULL,
	"business_name" text,
	"industry" text,
	"images" jsonb,
	"status" "content_status" DEFAULT 'PENDING' NOT NULL,
	"reviewed_by" uuid,
	"review_notes" text,
	"published_content_id" uuid,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"reviewed_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_submissions" ADD CONSTRAINT "story_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_submissions" ADD CONSTRAINT "story_submissions_published_content_id_content_id_fk" FOREIGN KEY ("published_content_id") REFERENCES "public"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "contact_submissions_resolved_idx" ON "contact_submissions" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "contact_submissions_submitted_at_idx" ON "contact_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "contact_submissions_resolved_by_idx" ON "contact_submissions" USING btree ("resolved_by");--> statement-breakpoint
CREATE INDEX "story_submissions_status_idx" ON "story_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "story_submissions_submitted_at_idx" ON "story_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "story_submissions_reviewed_by_idx" ON "story_submissions" USING btree ("reviewed_by");