CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'USER');--> statement-breakpoint
CREATE TYPE "public"."content_status" AS ENUM('DRAFT', 'PUBLISHED', 'PENDING', 'REJECTED');--> statement-breakpoint
CREATE TYPE "public"."content_type" AS ENUM('BLOG', 'NEWS', 'ENTRECHAT', 'EVENT', 'PRESS', 'SUCCESS_STORY', 'RESOURCE');--> statement-breakpoint
CREATE TYPE "public"."resource_scope" AS ENUM('INDIA_STATE', 'GLOBAL');--> statement-breakpoint
CREATE TABLE "categories" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"content_type" "content_type" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
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
CREATE TABLE "content" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"wp_id" text,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"summary" text,
	"content" text NOT NULL,
	"content_type" "content_type" DEFAULT 'BLOG' NOT NULL,
	"category_id" uuid,
	"created_by" uuid,
	"author_name" text,
	"featured_image" text,
	"external_url" text,
	"content_images" jsonb,
	"reading_time" integer,
	"status" "content_status" DEFAULT 'PUBLISHED' NOT NULL,
	"published_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "content_tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_id" uuid NOT NULL,
	"tag_id" uuid NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "email_verification_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"token" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"scope" "resource_scope" NOT NULL,
	"location_key" text NOT NULL,
	"location_label" text NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"link" text,
	"source_id" integer,
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "tags" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"usage_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" timestamp,
	"is_active" boolean DEFAULT true NOT NULL,
	"password" text,
	"mobile" text,
	"image" text,
	"phone_verified" timestamp,
	"role" "user_role" DEFAULT 'USER' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "contact_submissions" ADD CONSTRAINT "contact_submissions_resolved_by_users_id_fk" FOREIGN KEY ("resolved_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_category_id_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."categories"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content" ADD CONSTRAINT "content_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_content_id_content_id_fk" FOREIGN KEY ("content_id") REFERENCES "public"."content"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "content_tags" ADD CONSTRAINT "content_tags_tag_id_tags_id_fk" FOREIGN KEY ("tag_id") REFERENCES "public"."tags"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_submissions" ADD CONSTRAINT "story_submissions_reviewed_by_users_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."users"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "story_submissions" ADD CONSTRAINT "story_submissions_published_content_id_content_id_fk" FOREIGN KEY ("published_content_id") REFERENCES "public"."content"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "categories_name_content_type_key" ON "categories" USING btree ("name","content_type");--> statement-breakpoint
CREATE UNIQUE INDEX "categories_slug_key" ON "categories" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "categories_active_idx" ON "categories" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "categories_content_type_idx" ON "categories" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "contact_submissions_resolved_idx" ON "contact_submissions" USING btree ("is_resolved");--> statement-breakpoint
CREATE INDEX "contact_submissions_submitted_at_idx" ON "contact_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "contact_submissions_resolved_by_idx" ON "contact_submissions" USING btree ("resolved_by");--> statement-breakpoint
CREATE UNIQUE INDEX "content_wp_id_key" ON "content" USING btree ("wp_id");--> statement-breakpoint
CREATE UNIQUE INDEX "content_slug_key" ON "content" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "content_type_idx" ON "content" USING btree ("content_type");--> statement-breakpoint
CREATE INDEX "content_status_idx" ON "content" USING btree ("status");--> statement-breakpoint
CREATE INDEX "content_published_at_idx" ON "content" USING btree ("published_at");--> statement-breakpoint
CREATE INDEX "content_category_id_idx" ON "content" USING btree ("category_id");--> statement-breakpoint
CREATE INDEX "content_created_by_idx" ON "content" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "content_type_status_idx" ON "content" USING btree ("content_type","status");--> statement-breakpoint
CREATE UNIQUE INDEX "content_tags_content_tag_key" ON "content_tags" USING btree ("content_id","tag_id");--> statement-breakpoint
CREATE INDEX "content_tags_content_id_idx" ON "content_tags" USING btree ("content_id");--> statement-breakpoint
CREATE INDEX "content_tags_tag_id_idx" ON "content_tags" USING btree ("tag_id");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_tokens_email_token_key" ON "email_verification_tokens" USING btree ("email","token");--> statement-breakpoint
CREATE UNIQUE INDEX "email_verification_tokens_token_key" ON "email_verification_tokens" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_email_token_key" ON "password_reset_tokens" USING btree ("email","token");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_token_key" ON "password_reset_tokens" USING btree ("token");--> statement-breakpoint
CREATE INDEX "resources_scope_idx" ON "resources" USING btree ("scope");--> statement-breakpoint
CREATE INDEX "resources_location_key_idx" ON "resources" USING btree ("location_key");--> statement-breakpoint
CREATE INDEX "resources_scope_location_idx" ON "resources" USING btree ("scope","location_key");--> statement-breakpoint
CREATE INDEX "story_submissions_status_idx" ON "story_submissions" USING btree ("status");--> statement-breakpoint
CREATE INDEX "story_submissions_submitted_at_idx" ON "story_submissions" USING btree ("submitted_at");--> statement-breakpoint
CREATE INDEX "story_submissions_reviewed_by_idx" ON "story_submissions" USING btree ("reviewed_by");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_name_key" ON "tags" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tags_slug_key" ON "tags" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "tags_usage_count_idx" ON "tags" USING btree ("usage_count");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_key" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_role_idx" ON "users" USING btree ("role");--> statement-breakpoint
CREATE INDEX "users_active_idx" ON "users" USING btree ("is_active");