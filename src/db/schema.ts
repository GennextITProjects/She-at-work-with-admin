/* eslint-disable @typescript-eslint/no-explicit-any */
// ===== SheAtWork Platform Database Schema (Corrected) =====
import { InferModel, relations } from "drizzle-orm";
import {
  boolean,
  integer,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

// ===== ENUMS =====
export const UserRole = pgEnum("user_role", ["SUPER_ADMIN", "ADMIN", "AUTHOR", "USER"]);
export const ContentStatus = pgEnum("content_status", [
  "DRAFT",
  "PENDING",
  "PUBLISHED",
  "ARCHIVED",
  "REJECTED"
]);
export const ContentType = pgEnum("content_type", [
  "NEWS",
  "BLOG",
  "ENTRECHAT",
  "SUCCESS_STORY",
  "RESOURCE"
]);
export const EventType = pgEnum("event_type", [
  "WORKSHOP",
  "WEBINAR",
  "NETWORKING",
  "MASTERCLASS",
  "CONFERENCE"
]);
export const EventStatus = pgEnum("event_status", [
  "UPCOMING",
  "ONGOING",
  "COMPLETED",
  "CANCELLED"
]);
export const Priority = pgEnum("priority", ["LOW", "MEDIUM", "HIGH", "FEATURED"]);
export const Language = pgEnum("language", ["ENGLISH", "HINDI"]);
export const AdSize = pgEnum("ad_size", [
  "BANNER_320X50",
  "LARGE_BANNER_320X100",
  "MEDIUM_RECTANGLE_300X250",
  "NATIVE_CARD",
  "STORY_9X16",
  "CUSTOM"
]);
export const NotificationType = pgEnum("notification_type", [
  "CONTENT_PUBLISHED",
  "EVENT_REMINDER",
  "EVENT_REGISTRATION",
  "COMMENT_REPLY",
  "CONTENT_APPROVED",
  "CONTENT_REJECTED",
  "ROLE_CHANGED",
  "SYSTEM"
]);
export const AuditAction = pgEnum("audit_action", [
  "CREATED",
  "UPDATED",
  "DELETED",
  "APPROVED",
  "REJECTED",
  "SUSPENDED",
  "ACTIVATED",
  "ROLE_CHANGED"
]);

// ===== USERS & AUTHENTICATION =====
export const UsersTable = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    emailVerified: timestamp("email_verified", { mode: "date" }),
    password: text("password"),
    mobile: text("mobile"),
    image: text("image"),
    phoneVerified: timestamp("phone_verified", { mode: "date" }),
    role: UserRole("role").default("USER").notNull(),
    
    // Profile details
    bio: text("bio"),
    company: text("company"),
    designation: text("designation"),
    location: text("location"),
    website: text("website"),
    socialLinks: jsonb("social_links"),
    
    // Entrepreneurship profile
    isEntrepreneur: boolean("is_entrepreneur").default(false),
    businessType: text("business_type"),
    industryFocus: jsonb("industry_focus"),
    yearsOfExperience: integer("years_of_experience"),
    
    // Engagement
    isNewsletterSubscribed: boolean("is_newsletter_subscribed").default(false),
    preferences: jsonb("preferences"),
    lastLoginAt: timestamp("last_login_at", { mode: "date" }),
    
    // OAuth
    googleId: text("google_id"),
    provider: text("provider").default("email"),
    
    // Admin management fields
    isActive: boolean("is_active").default(true).notNull(),
    isSuspended: boolean("is_suspended").default(false),
    suspensionReason: text("suspension_reason"),
    suspendedUntil: timestamp("suspended_until", { mode: "date" }),
    
    // Role assignment tracking
    roleAssignedBy: uuid("role_assigned_by")
      .references((): any => UsersTable.id, { onDelete: "set null" }),
    roleAssignedAt: timestamp("role_assigned_at", { mode: "date" }),
    
    // Soft delete
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("users_email_key").on(table.email),
    index("users_role_idx").on(table.role),
    index("users_active_idx").on(table.isActive),
    index("users_suspended_idx").on(table.isSuspended),
    index("users_entrepreneur_idx").on(table.isEntrepreneur),
    index("users_newsletter_idx").on(table.isNewsletterSubscribed),
    index("users_role_assigned_by_idx").on(table.roleAssignedBy),
    index("users_deleted_at_idx").on(table.deletedAt),
  ]
);

export type User = InferModel<typeof UsersTable>;
export type NewUser = InferModel<typeof UsersTable, "insert">;

// Email Verification Tokens
export const EmailVerificationTokenTable = pgTable(
  "email_verification_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("email_verification_tokens_email_token_key").on(table.email, table.token),
    uniqueIndex("email_verification_tokens_token_key").on(table.token),
  ]
);

// Password Reset Tokens
export const PasswordResetTokenTable = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    token: uuid("token").notNull(),
    expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_email_token_key").on(table.email, table.token),
    uniqueIndex("password_reset_tokens_token_key").on(table.token),
  ]
);

// ===== AUTHORS/CONTRIBUTORS =====
export const AuthorsTable = pgTable(
  "authors",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .unique()
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    email: text("email"),
    bio: text("bio").notNull(),
    avatar: text("avatar"),
    expertise: jsonb("expertise"),
    socialLinks: jsonb("social_links"),
    
    // Stats
    articlesCount: integer("articles_count").default(0),
    followersCount: integer("followers_count").default(0),
    totalViews: integer("total_views").default(0),
    
    isVerified: boolean("is_verified").default(false),
    isFeatured: boolean("is_featured").default(false),
    isActive: boolean("is_active").default(true).notNull(),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("authors_slug_key").on(table.slug),
    uniqueIndex("authors_user_id_key").on(table.userId),
    index("authors_user_id_idx").on(table.userId),
    index("authors_featured_idx").on(table.isFeatured),
    index("authors_verified_idx").on(table.isVerified),
  ]
);

export type Author = InferModel<typeof AuthorsTable>;
export type NewAuthor = InferModel<typeof AuthorsTable, "insert">;

// ===== ROLE ASSIGNMENT LOGS =====
export const RoleAssignmentLogsTable = pgTable(
  "role_assignment_logs",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "restrict" }),
    oldRole: UserRole("old_role"),
    newRole: UserRole("new_role").notNull(),
    reason: text("reason"),
    
    assignedAt: timestamp("assigned_at").defaultNow().notNull(),
  },
  (table) => [
    index("role_assignment_logs_user_id_idx").on(table.userId),
    index("role_assignment_logs_assigned_by_idx").on(table.assignedBy),
    index("role_assignment_logs_assigned_at_idx").on(table.assignedAt),
  ]
);

export type RoleAssignmentLog = InferModel<typeof RoleAssignmentLogsTable>;
export type NewRoleAssignmentLog = InferModel<typeof RoleAssignmentLogsTable, "insert">;

// ===== CATEGORIES =====
export const CategoriesTable = pgTable(
  "categories",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    image: text("image"),
    icon: text("icon"),
    color: text("color"),
    parentId: uuid("parent_id")
      .references((): any => CategoriesTable.id, { onDelete: "set null" }),
    sortOrder: integer("sort_order").default(0),
    
    contentTypes: jsonb("content_types"),
    
    isActive: boolean("is_active").default(true).notNull(),
    isFeatured: boolean("is_featured").default(false),
    
    createdBy: uuid("created_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("categories_slug_key").on(table.slug),
    index("categories_parent_id_idx").on(table.parentId),
    index("categories_featured_idx").on(table.isFeatured),
    index("categories_active_idx").on(table.isActive),
    index("categories_created_by_idx").on(table.createdBy),
  ]
);

export type Category = InferModel<typeof CategoriesTable>;
export type NewCategory = InferModel<typeof CategoriesTable, "insert">;

// ===== TAGS =====
export const TagsTable = pgTable(
  "tags",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    description: text("description"),
    color: text("color"),
    usageCount: integer("usage_count").default(0),
    isActive: boolean("is_active").default(true).notNull(),
    createdBy: uuid("created_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("tags_slug_key").on(table.slug),
    index("tags_usage_count_idx").on(table.usageCount),
    index("tags_created_by_idx").on(table.createdBy),
  ]
);

export type Tag = InferModel<typeof TagsTable>;
export type NewTag = InferModel<typeof TagsTable, "insert">;

// ===== CONTENT (News, Blogs, Entrechat, Stories) =====
export const ContentTable = pgTable(
  "content",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    summary: text("summary"),
    content: text("content").notNull(),
    contentType: ContentType("content_type").notNull(),
    
    // Media
    featuredImage: text("featured_image"),
    featuredImageAlt: text("featured_image_alt"),
    imageGallery: jsonb("image_gallery"),
    videoUrl: text("video_url"),
    videoThumbnail: text("video_thumbnail"),
    
    // Publishing
    authorId: uuid("author_id")
      .notNull()
      .references(() => AuthorsTable.id, { onDelete: "restrict" }),
    categoryId: uuid("category_id")
      .references(() => CategoriesTable.id, { onDelete: "set null" }),
    
    status: ContentStatus("status").default("DRAFT").notNull(),
    priority: Priority("priority").default("LOW").notNull(),
    
    publishedAt: timestamp("published_at", { mode: "date" }),
    scheduledPublishAt: timestamp("scheduled_publish_at", { mode: "date" }),
    
    // For Entrechat (Interview format)
    interviewee: jsonb("interviewee"),
    duration: integer("duration"),
    
    // SEO
    metaTitle: text("meta_title"),
    metaDescription: text("meta_description"),
    keywords: jsonb("keywords"),
    
    // Engagement
    viewCount: integer("view_count").default(0),
    likeCount: integer("like_count").default(0),
    shareCount: integer("share_count").default(0),
    commentCount: integer("comment_count").default(0),
    bookmarkCount: integer("bookmark_count").default(0),
    
    readingTime: integer("reading_time"),
    isFeatured: boolean("is_featured").default(false),
    isTrending: boolean("is_trending").default(false),
    
    // Editor/Admin info
    createdBy: uuid("created_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    publishedBy: uuid("published_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    language: Language("language").default("ENGLISH").notNull(),
    
    // Soft delete
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_slug_key").on(table.slug),
    index("content_author_id_idx").on(table.authorId),
    index("content_category_id_idx").on(table.categoryId),
    index("content_type_idx").on(table.contentType),
    index("content_status_idx").on(table.status),
    index("content_published_at_idx").on(table.publishedAt),
    index("content_featured_idx").on(table.isFeatured),
    index("content_trending_idx").on(table.isTrending),
    index("content_type_status_idx").on(table.contentType, table.status),
    index("content_created_by_idx").on(table.createdBy),
    index("content_published_by_idx").on(table.publishedBy),
    index("content_deleted_at_idx").on(table.deletedAt),
  ]
);

export type Content = InferModel<typeof ContentTable>;
export type NewContent = InferModel<typeof ContentTable, "insert">;

// ===== CONTENT TAGS (Many-to-Many) =====
export const ContentTagsTable = pgTable(
  "content_tags",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => ContentTable.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => TagsTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_tags_content_tag_key").on(table.contentId, table.tagId),
    index("content_tags_content_id_idx").on(table.contentId),
    index("content_tags_tag_id_idx").on(table.tagId),
  ]
);

export type ContentTag = InferModel<typeof ContentTagsTable>;
export type NewContentTag = InferModel<typeof ContentTagsTable, "insert">;

// ===== CONTENT REVISIONS =====
export const ContentRevisionsTable = pgTable(
  "content_revisions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => ContentTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    content: text("content").notNull(),
    summary: text("summary"),
    editedBy: uuid("edited_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "restrict" }),
    editNote: text("edit_note"),
    revisionNumber: integer("revision_number").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("content_revisions_content_id_idx").on(table.contentId),
    index("content_revisions_edited_by_idx").on(table.editedBy),
    index("content_revisions_created_at_idx").on(table.createdAt),
  ]
);

export type ContentRevision = InferModel<typeof ContentRevisionsTable>;
export type NewContentRevision = InferModel<typeof ContentRevisionsTable, "insert">;

// ===== EVENTS (Workshops, Webinars, Networking) =====
export const EventsTable = pgTable(
  "events",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull(),
    description: text("description").notNull(),
    eventType: EventType("event_type").notNull(),
    
    // Event details
    coverImage: text("cover_image"),
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    timezone: text("timezone").default("Asia/Kolkata"),
    
    // Location
    isOnline: boolean("is_online").default(true),
    venue: text("venue"),
    venueAddress: text("venue_address"),
    city: text("city"),
    meetingLink: text("meeting_link"),
    
    // Speakers/Hosts
    speakers: jsonb("speakers"),
    hostId: uuid("host_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    
    // Registration
    registrationRequired: boolean("registration_required").default(true),
    maxAttendees: integer("max_attendees"),
    registrationDeadline: timestamp("registration_deadline", { mode: "date" }),
    isFree: boolean("is_free").default(true),
    price: integer("price"),
    
    // Content
    agenda: jsonb("agenda"),
    resources: jsonb("resources"),
    recordingUrl: text("recording_url"),
    
    // Engagement
    registrationCount: integer("registration_count").default(0),
    attendanceCount: integer("attendance_count").default(0),
    
    status: EventStatus("status").default("UPCOMING").notNull(),
    isFeatured: boolean("is_featured").default(false),
    
    // SEO
    metaDescription: text("meta_description"),
    keywords: jsonb("keywords"),
    
    createdBy: uuid("created_by")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "restrict" }),
    
    // Soft delete
    deletedAt: timestamp("deleted_at", { mode: "date" }),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("events_slug_key").on(table.slug),
    index("events_type_idx").on(table.eventType),
    index("events_status_idx").on(table.status),
    index("events_start_date_idx").on(table.startDate),
    index("events_featured_idx").on(table.isFeatured),
    index("events_online_idx").on(table.isOnline),
    index("events_host_id_idx").on(table.hostId),
    index("events_created_by_idx").on(table.createdBy),
    index("events_deleted_at_idx").on(table.deletedAt),
  ]
);

export type Event = InferModel<typeof EventsTable>;
export type NewEvent = InferModel<typeof EventsTable, "insert">;

// ===== EVENT REGISTRATIONS =====
export const EventRegistrationsTable = pgTable(
  "event_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => EventsTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    
    attended: boolean("attended").default(false),
    attendedAt: timestamp("attended_at", { mode: "date" }),
    
    rating: integer("rating"),
    feedback: text("feedback"),
    
    registeredAt: timestamp("registered_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("event_registrations_event_user_key").on(table.eventId, table.userId),
    index("event_registrations_event_id_idx").on(table.eventId),
    index("event_registrations_user_id_idx").on(table.userId),
    index("event_registrations_attended_idx").on(table.attended),
  ]
);

export type EventRegistration = InferModel<typeof EventRegistrationsTable>;
export type NewEventRegistration = InferModel<typeof EventRegistrationsTable, "insert">;

// ===== COMMUNITY MEMBERS =====
export const CommunityMembersTable = pgTable(
  "community_members",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    
    // Profile
    name: text("name").notNull(),
    email: text("email").notNull(),
    image: text("image"),
    designation: text("designation"),
    company: text("company"),
    bio: text("bio").notNull(),
    
    // Business details
    businessName: text("business_name"),
    businessType: text("business_type"),
    industry: text("industry"),
    foundedYear: integer("founded_year"),
    website: text("website"),
    
    // Story
    story: text("story"),
    achievements: jsonb("achievements"),
    
    // Social
    socialLinks: jsonb("social_links"),
    
    isFeatured: boolean("is_featured").default(false),
    isVerified: boolean("is_verified").default(false),
    sortOrder: integer("sort_order").default(0),
    
    // Admin fields
    approvedBy: uuid("approved_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    approvalNotes: text("approval_notes"),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("community_members_user_id_idx").on(table.userId),
    index("community_members_featured_idx").on(table.isFeatured),
    index("community_members_verified_idx").on(table.isVerified),
    index("community_members_approved_by_idx").on(table.approvedBy),
  ]
);

export type CommunityMember = InferModel<typeof CommunityMembersTable>;
export type NewCommunityMember = InferModel<typeof CommunityMembersTable, "insert">;

// ===== NEWSLETTER SUBSCRIBERS =====
export const NewsletterSubscribersTable = pgTable(
  "newsletter_subscribers",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    email: text("email").notNull(),
    name: text("name"),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    
    isActive: boolean("is_active").default(true),
    preferences: jsonb("preferences"),
    
    subscribedAt: timestamp("subscribed_at").defaultNow().notNull(),
    unsubscribedAt: timestamp("unsubscribed_at", { mode: "date" }),
  },
  (table) => [
    uniqueIndex("newsletter_subscribers_email_key").on(table.email),
    index("newsletter_subscribers_active_idx").on(table.isActive),
    index("newsletter_subscribers_user_id_idx").on(table.userId),
  ]
);

export type NewsletterSubscriber = InferModel<typeof NewsletterSubscribersTable>;
export type NewNewsletterSubscriber = InferModel<typeof NewsletterSubscribersTable, "insert">;

// ===== COMMENTS =====
export const CommentsTable = pgTable(
  "comments",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => ContentTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    content: text("content").notNull(),
    
    parentId: uuid("parent_id")
      .references((): any => CommentsTable.id, { onDelete: "cascade" }),
    
    isApproved: boolean("is_approved").default(false),
    isSpam: boolean("is_spam").default(false),
    
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("comments_content_id_idx").on(table.contentId),
    index("comments_user_id_idx").on(table.userId),
    index("comments_parent_id_idx").on(table.parentId),
    index("comments_approved_idx").on(table.isApproved),
  ]
);

export type Comment = InferModel<typeof CommentsTable>;
export type NewComment = InferModel<typeof CommentsTable, "insert">;

// ===== CONTENT LIKES =====
export const ContentLikesTable = pgTable(
  "content_likes",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => ContentTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("content_likes_content_user_key").on(table.contentId, table.userId),
    index("content_likes_content_id_idx").on(table.contentId),
    index("content_likes_user_id_idx").on(table.userId),
  ]
);

export type ContentLike = InferModel<typeof ContentLikesTable>;
export type NewContentLike = InferModel<typeof ContentLikesTable, "insert">;

// ===== BOOKMARKS =====
export const BookmarksTable = pgTable(
  "bookmarks",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    contentId: uuid("content_id")
      .notNull()
      .references(() => ContentTable.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("bookmarks_user_content_key").on(table.userId, table.contentId),
    index("bookmarks_user_id_idx").on(table.userId),
    index("bookmarks_content_id_idx").on(table.contentId),
  ]
);

export type Bookmark = InferModel<typeof BookmarksTable>;
export type NewBookmark = InferModel<typeof BookmarksTable, "insert">;

// ===== CONTENT SHARES =====
export const ContentSharesTable = pgTable(
  "content_shares",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => ContentTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    platform: text("platform").notNull(),
    sharedAt: timestamp("shared_at").defaultNow().notNull(),
  },
  (table) => [
    index("content_shares_content_id_idx").on(table.contentId),
    index("content_shares_platform_idx").on(table.platform),
    index("content_shares_user_id_idx").on(table.userId),
  ]
);

export type ContentShare = InferModel<typeof ContentSharesTable>;
export type NewContentShare = InferModel<typeof ContentSharesTable, "insert">;

// ===== CONTENT VIEWS =====
export const ContentViewsTable = pgTable(
  "content_views",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    contentId: uuid("content_id")
      .notNull()
      .references(() => ContentTable.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    referrer: text("referrer"),
    viewedAt: timestamp("viewed_at").defaultNow().notNull(),
  },
  (table) => [
    index("content_views_content_id_idx").on(table.contentId),
    index("content_views_viewed_at_idx").on(table.viewedAt),
    index("content_views_user_id_idx").on(table.userId),
  ]
);

export type ContentView = InferModel<typeof ContentViewsTable>;
export type NewContentView = InferModel<typeof ContentViewsTable, "insert">;

// ===== ADVERTISEMENTS =====
export const AdvertisementsTable = pgTable(
  "advertisements",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    title: text("title").notNull(),
    description: text("description"),
    advertiserName: text("advertiser_name").notNull(),
    advertiserEmail: text("advertiser_email").notNull(),
    imageUrl: text("image_url").notNull(),
    size: AdSize("size").notNull(),
    clickUrl: text("click_url").notNull(),
    
    placement: text("placement"),
    
    startDate: timestamp("start_date", { mode: "date" }).notNull(),
    endDate: timestamp("end_date", { mode: "date" }).notNull(),
    
    impressions: integer("impressions").default(0),
    clicks: integer("clicks").default(0),
    
    priority: Priority("priority").default("LOW").notNull(),
    isActive: boolean("is_active").default(true).notNull(),
    isApproved: boolean("is_approved").default(false),
    
    approvedBy: uuid("approved_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    approvalNotes: text("approval_notes"),
    
    createdBy: uuid("created_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (table) => [
    index("advertisements_active_idx").on(table.isActive),
    index("advertisements_approved_idx").on(table.isApproved),
    index("advertisements_dates_idx").on(table.startDate, table.endDate),
    index("advertisements_placement_idx").on(table.placement),
    index("advertisements_approved_by_idx").on(table.approvedBy),
    index("advertisements_created_by_idx").on(table.createdBy),
  ]
);

export type Advertisement = InferModel<typeof AdvertisementsTable>;
export type NewAdvertisement = InferModel<typeof AdvertisementsTable, "insert">;

// ===== AD ANALYTICS =====
export const AdAnalyticsTable = pgTable(
  "ad_analytics",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    adId: uuid("ad_id")
      .notNull()
      .references(() => AdvertisementsTable.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("ad_analytics_ad_id_idx").on(table.adId),
    index("ad_analytics_event_type_idx").on(table.eventType),
    index("ad_analytics_created_at_idx").on(table.createdAt),
    index("ad_analytics_user_id_idx").on(table.userId),
  ]
);

export type AdAnalytic = InferModel<typeof AdAnalyticsTable>;
export type NewAdAnalytic = InferModel<typeof AdAnalyticsTable, "insert">;

// ===== STORY SUBMISSIONS =====
export const StorySubmissionsTable = pgTable(
  "story_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    
    title: text("title").notNull(),
    story: text("story").notNull(),
    businessName: text("business_name"),
    industry: text("industry"),
    
    images: jsonb("images"),
    
    status: ContentStatus("status").default("PENDING").notNull(),
    reviewedBy: uuid("reviewed_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    reviewNotes: text("review_notes"),
    
    publishedContentId: uuid("published_content_id")
      .references(() => ContentTable.id, { onDelete: "set null" }),
    
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
    reviewedAt: timestamp("reviewed_at", { mode: "date" }),
  },
  (table) => [
    index("story_submissions_user_id_idx").on(table.userId),
    index("story_submissions_status_idx").on(table.status),
    index("story_submissions_submitted_at_idx").on(table.submittedAt),
    index("story_submissions_reviewed_by_idx").on(table.reviewedBy),
    index("story_submissions_published_content_id_idx").on(table.publishedContentId),
  ]
);

export type StorySubmission = InferModel<typeof StorySubmissionsTable>;
export type NewStorySubmission = InferModel<typeof StorySubmissionsTable, "insert">;

// ===== CONTACT SUBMISSIONS =====
export const ContactSubmissionsTable = pgTable(
  "contact_submissions",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email").notNull(),
    phone: text("phone"),
    subject: text("subject"),
    message: text("message").notNull(),
    
    isResolved: boolean("is_resolved").default(false),
    resolvedBy: uuid("resolved_by")
      .references(() => UsersTable.id, { onDelete: "set null" }),
    resolvedAt: timestamp("resolved_at", { mode: "date" }),
    notes: text("notes"),
    
    submittedAt: timestamp("submitted_at").defaultNow().notNull(),
  },
  (table) => [
    index("contact_submissions_resolved_idx").on(table.isResolved),
    index("contact_submissions_submitted_at_idx").on(table.submittedAt),
    index("contact_submissions_resolved_by_idx").on(table.resolvedBy),
  ]
);

export type ContactSubmission = InferModel<typeof ContactSubmissionsTable>;
export type NewContactSubmission = InferModel<typeof ContactSubmissionsTable, "insert">;

// ===== NOTIFICATIONS =====
export const NotificationsTable = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "cascade" }),
    type: NotificationType("type").notNull(),
    title: text("title").notNull(),
    message: text("message").notNull(),
    link: text("link"),
    metadata: jsonb("metadata"),
    isRead: boolean("is_read").default(false),
    readAt: timestamp("read_at", { mode: "date" }),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("notifications_user_id_idx").on(table.userId),
    index("notifications_is_read_idx").on(table.isRead),
    index("notifications_created_at_idx").on(table.createdAt),
    index("notifications_type_idx").on(table.type),
  ]
);

export type Notification = InferModel<typeof NotificationsTable>;
export type NewNotification = InferModel<typeof NotificationsTable, "insert">;

// ===== AUDIT LOGS =====
export const AuditLogsTable = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey().notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => UsersTable.id, { onDelete: "restrict" }),
    action: AuditAction("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: uuid("entity_id").notNull(),
    metadata: jsonb("metadata"),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("audit_logs_user_id_idx").on(table.userId),
    index("audit_logs_action_idx").on(table.action),
    index("audit_logs_entity_type_idx").on(table.entityType),
    index("audit_logs_entity_id_idx").on(table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ]
);

export type AuditLog = InferModel<typeof AuditLogsTable>;
export type NewAuditLog = InferModel<typeof AuditLogsTable, "insert">;

// ===== RELATIONS =====
export const UsersRelations = relations(UsersTable, ({ one, many }) => ({
  roleAssigner: one(UsersTable, {
    fields: [UsersTable.roleAssignedBy],
    references: [UsersTable.id],
    relationName: "role_assigner"
  }),
  assignedRoles: many(UsersTable, {
    relationName: "role_assigner"
  }),
  author: one(AuthorsTable, {
    fields: [UsersTable.id],
    references: [AuthorsTable.userId],
  }),
  roleAssignmentLogs: many(RoleAssignmentLogsTable, {
    relationName: "user_role_logs"
  }),
  assignedRoleLogs: many(RoleAssignmentLogsTable, {
    relationName: "assigned_by_logs"
  }),
  createdCategories: many(CategoriesTable, {
    relationName: "category_creator"
  }),
  createdTags: many(TagsTable, {
    relationName: "tag_creator"
  }),
  createdContent: many(ContentTable, {
    relationName: "content_creator"
  }),
  publishedContent: many(ContentTable, {
    relationName: "content_publisher"
  }),
  contentRevisions: many(ContentRevisionsTable, {
    relationName: "content_revisions"
  }),
  createdEvents: many(EventsTable, {
    relationName: "event_creator"
  }),
  hostedEvents: many(EventsTable, {
    relationName: "event_host"
  }),
  eventRegistrations: many(EventRegistrationsTable),
  communityMember: one(CommunityMembersTable, {
    fields: [UsersTable.id],
    references: [CommunityMembersTable.userId],
  }),
  approvedCommunityMembers: many(CommunityMembersTable, {
    relationName: "community_member_approver"
  }),
  newsletterSubscriber: one(NewsletterSubscribersTable, {
    fields: [UsersTable.id],
    references: [NewsletterSubscribersTable.userId],
  }),
  comments: many(CommentsTable),
  contentLikes: many(ContentLikesTable),
  bookmarks: many(BookmarksTable),
  contentShares: many(ContentSharesTable),
  contentViews: many(ContentViewsTable),
  approvedAdvertisements: many(AdvertisementsTable, {
    relationName: "advertisement_approver"
  }),
  createdAdvertisements: many(AdvertisementsTable, {
    relationName: "advertisement_creator"
  }),
  adAnalytics: many(AdAnalyticsTable),
  storySubmissions: many(StorySubmissionsTable),
  reviewedStorySubmissions: many(StorySubmissionsTable, {
    relationName: "story_reviewer"
  }),
  resolvedContactSubmissions: many(ContactSubmissionsTable, {
    relationName: "contact_resolver"
  }),
  notifications: many(NotificationsTable),
  auditLogs: many(AuditLogsTable),
}));

export const AuthorsRelations = relations(AuthorsTable, ({ one, many }) => ({
  user: one(UsersTable, {
    fields: [AuthorsTable.userId],
    references: [UsersTable.id],
  }),
  content: many(ContentTable),
}));

export const RoleAssignmentLogsRelations = relations(RoleAssignmentLogsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [RoleAssignmentLogsTable.userId],
    references: [UsersTable.id],
    relationName: "user_role_logs"
  }),
  assigner: one(UsersTable, {
    fields: [RoleAssignmentLogsTable.assignedBy],
    references: [UsersTable.id],
    relationName: "assigned_by_logs"
  }),
}));

export const CategoriesRelations = relations(CategoriesTable, ({ one, many }) => ({
  parent: one(CategoriesTable, {
    fields: [CategoriesTable.parentId],
    references: [CategoriesTable.id],
    relationName: "category_parent"
  }),
  children: many(CategoriesTable, {
    relationName: "category_parent"
  }),
  creator: one(UsersTable, {
    fields: [CategoriesTable.createdBy],
    references: [UsersTable.id],
    relationName: "category_creator"
  }),
  content: many(ContentTable),
}));

export const TagsRelations = relations(TagsTable, ({ one, many }) => ({
  creator: one(UsersTable, {
    fields: [TagsTable.createdBy],
    references: [UsersTable.id],
    relationName: "tag_creator"
  }),
  contentTags: many(ContentTagsTable),
}));

export const ContentRelations = relations(ContentTable, ({ one, many }) => ({
  author: one(AuthorsTable, {
    fields: [ContentTable.authorId],
    references: [AuthorsTable.id],
  }),
  category: one(CategoriesTable, {
    fields: [ContentTable.categoryId],
    references: [CategoriesTable.id],
  }),
  creator: one(UsersTable, {
    fields: [ContentTable.createdBy],
    references: [UsersTable.id],
    relationName: "content_creator"
  }),
  publisher: one(UsersTable, {
    fields: [ContentTable.publishedBy],
    references: [UsersTable.id],
    relationName: "content_publisher"
  }),
  contentTags: many(ContentTagsTable),
  revisions: many(ContentRevisionsTable),
  comments: many(CommentsTable),
  likes: many(ContentLikesTable),
  bookmarks: many(BookmarksTable),
  shares: many(ContentSharesTable),
  views: many(ContentViewsTable),
  storySubmission: one(StorySubmissionsTable, {
    fields: [ContentTable.id],
    references: [StorySubmissionsTable.publishedContentId],
  }),
}));

export const ContentTagsRelations = relations(ContentTagsTable, ({ one }) => ({
  content: one(ContentTable, {
    fields: [ContentTagsTable.contentId],
    references: [ContentTable.id],
  }),
  tag: one(TagsTable, {
    fields: [ContentTagsTable.tagId],
    references: [TagsTable.id],
  }),
}));

export const ContentRevisionsRelations = relations(ContentRevisionsTable, ({ one }) => ({
  content: one(ContentTable, {
    fields: [ContentRevisionsTable.contentId],
    references: [ContentTable.id],
  }),
  editor: one(UsersTable, {
    fields: [ContentRevisionsTable.editedBy],
    references: [UsersTable.id],
    relationName: "content_revisions"
  }),
}));

export const EventsRelations = relations(EventsTable, ({ one, many }) => ({
  host: one(UsersTable, {
    fields: [EventsTable.hostId],
    references: [UsersTable.id],
    relationName: "event_host"
  }),
  creator: one(UsersTable, {
    fields: [EventsTable.createdBy],
    references: [UsersTable.id],
    relationName: "event_creator"
  }),
  registrations: many(EventRegistrationsTable),
}));

export const EventRegistrationsRelations = relations(EventRegistrationsTable, ({ one }) => ({
  event: one(EventsTable, {
    fields: [EventRegistrationsTable.eventId],
    references: [EventsTable.id],
  }),
  user: one(UsersTable, {
    fields: [EventRegistrationsTable.userId],
    references: [UsersTable.id],
  }),
}));

export const CommunityMembersRelations = relations(CommunityMembersTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [CommunityMembersTable.userId],
    references: [UsersTable.id],
  }),
  approver: one(UsersTable, {
    fields: [CommunityMembersTable.approvedBy],
    references: [UsersTable.id],
    relationName: "community_member_approver"
  }),
}));

export const NewsletterSubscribersRelations = relations(NewsletterSubscribersTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [NewsletterSubscribersTable.userId],
    references: [UsersTable.id],
  }),
}));

export const CommentsRelations = relations(CommentsTable, ({ one, many }) => ({
  content: one(ContentTable, {
    fields: [CommentsTable.contentId],
    references: [ContentTable.id],
  }),
  user: one(UsersTable, {
    fields: [CommentsTable.userId],
    references: [UsersTable.id],
  }),
  parent: one(CommentsTable, {
    fields: [CommentsTable.parentId],
    references: [CommentsTable.id],
    relationName: "comment_parent"
  }),
  replies: many(CommentsTable, {
    relationName: "comment_parent"
  }),
}));

export const ContentLikesRelations = relations(ContentLikesTable, ({ one }) => ({
  content: one(ContentTable, {
    fields: [ContentLikesTable.contentId],
    references: [ContentTable.id],
  }),
  user: one(UsersTable, {
    fields: [ContentLikesTable.userId],
    references: [UsersTable.id],
  }),
}));

export const BookmarksRelations = relations(BookmarksTable, ({ one }) => ({
  content: one(ContentTable, {
    fields: [BookmarksTable.contentId],
    references: [ContentTable.id],
  }),
  user: one(UsersTable, {
    fields: [BookmarksTable.userId],
    references: [UsersTable.id],
  }),
}));

export const ContentSharesRelations = relations(ContentSharesTable, ({ one }) => ({
  content: one(ContentTable, {
    fields: [ContentSharesTable.contentId],
    references: [ContentTable.id],
  }),
  user: one(UsersTable, {
    fields: [ContentSharesTable.userId],
    references: [UsersTable.id],
  }),
}));

export const ContentViewsRelations = relations(ContentViewsTable, ({ one }) => ({
  content: one(ContentTable, {
    fields: [ContentViewsTable.contentId],
    references: [ContentTable.id],
  }),
  user: one(UsersTable, {
    fields: [ContentViewsTable.userId],
    references: [UsersTable.id],
  }),
}));

export const AdvertisementsRelations = relations(AdvertisementsTable, ({ one, many }) => ({
  approver: one(UsersTable, {
    fields: [AdvertisementsTable.approvedBy],
    references: [UsersTable.id],
    relationName: "advertisement_approver"
  }),
  creator: one(UsersTable, {
    fields: [AdvertisementsTable.createdBy],
    references: [UsersTable.id],
    relationName: "advertisement_creator"
  }),
  analytics: many(AdAnalyticsTable),
}));

export const AdAnalyticsRelations = relations(AdAnalyticsTable, ({ one }) => ({
  advertisement: one(AdvertisementsTable, {
    fields: [AdAnalyticsTable.adId],
    references: [AdvertisementsTable.id],
  }),
  user: one(UsersTable, {
    fields: [AdAnalyticsTable.userId],
    references: [UsersTable.id],
  }),
}));

export const StorySubmissionsRelations = relations(StorySubmissionsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [StorySubmissionsTable.userId],
    references: [UsersTable.id],
  }),
  reviewer: one(UsersTable, {
    fields: [StorySubmissionsTable.reviewedBy],
    references: [UsersTable.id],
    relationName: "story_reviewer"
  }),
  publishedContent: one(ContentTable, {
    fields: [StorySubmissionsTable.publishedContentId],
    references: [ContentTable.id],
  }),
}));

export const ContactSubmissionsRelations = relations(ContactSubmissionsTable, ({ one }) => ({
  resolver: one(UsersTable, {
    fields: [ContactSubmissionsTable.resolvedBy],
    references: [UsersTable.id],
    relationName: "contact_resolver"
  }),
}));

export const NotificationsRelations = relations(NotificationsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [NotificationsTable.userId],
    references: [UsersTable.id],
  }),
}));

export const AuditLogsRelations = relations(AuditLogsTable, ({ one }) => ({
  user: one(UsersTable, {
    fields: [AuditLogsTable.userId],
    references: [UsersTable.id],
  }),
}));