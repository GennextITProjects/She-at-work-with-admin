// app/api/superadmin/analytics/route.ts
// SUPER_ADMIN: system-wide stats in a single request.
//
// This used to fire 16 separate COUNT(*) queries (4 per table) in one
// Promise.all. With neon-http that is 16 HTTP round-trips and 16 scans per
// request — four of them unfiltered COUNT(*) over the whole table.
//
// Each table now needs exactly ONE pass, using conditional aggregates
// (`count(*) FILTER (WHERE ...)`), which Postgres evaluates alongside the
// total in the same scan. Same response shape, 4 queries instead of 16.

import { db } from "@/db";
import {
  ContactSubmissionsTable,
  ContentTable,
  StorySubmissionsTable,
  UsersTable,
} from "@/db/schema";
import { count, sql } from "drizzle-orm";
import { NextResponse } from "next/server";

/** Postgres returns bigint aggregates as strings — normalise to a number. */
const n = (v: unknown): number => Number(v ?? 0);

export async function GET() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [[userStats], [contentStats], [storyStats], [contactStats]] =
      await Promise.all([
        // ── Users: one scan ──────────────────────────────────────────────────
        db
          .select({
            total:  count(),
            active: sql<number>`count(*) filter (where ${UsersTable.isActive} = true)`,
            admins: sql<number>`count(*) filter (where ${UsersTable.role} in ('ADMIN', 'SUPER_ADMIN'))`,
            newThisMonth: sql<number>`count(*) filter (where ${UsersTable.createdAt} >= ${thirtyDaysAgo})`,
          })
          .from(UsersTable),

        // ── Content: one scan ────────────────────────────────────────────────
        db
          .select({
            total:     count(),
            published: sql<number>`count(*) filter (where ${ContentTable.status} = 'PUBLISHED')`,
            pending:   sql<number>`count(*) filter (where ${ContentTable.status} = 'PENDING')`,
            draft:     sql<number>`count(*) filter (where ${ContentTable.status} = 'DRAFT')`,
          })
          .from(ContentTable),

        // ── Story submissions: one scan ──────────────────────────────────────
        db
          .select({
            total:     count(),
            pending:   sql<number>`count(*) filter (where ${StorySubmissionsTable.status} = 'PENDING')`,
            published: sql<number>`count(*) filter (where ${StorySubmissionsTable.status} = 'PUBLISHED')`,
            rejected:  sql<number>`count(*) filter (where ${StorySubmissionsTable.status} = 'REJECTED')`,
          })
          .from(StorySubmissionsTable),

        // ── Contact submissions: one scan ────────────────────────────────────
        db
          .select({
            total:      count(),
            unresolved: sql<number>`count(*) filter (where ${ContactSubmissionsTable.isResolved} = false)`,
            resolved:   sql<number>`count(*) filter (where ${ContactSubmissionsTable.isResolved} = true)`,
            newThisMonth: sql<number>`count(*) filter (where ${ContactSubmissionsTable.submittedAt} >= ${thirtyDaysAgo})`,
          })
          .from(ContactSubmissionsTable),
      ]);

    return NextResponse.json({
      success: true,
      data: {
        users: {
          total:        n(userStats.total),
          active:       n(userStats.active),
          inactive:     n(userStats.total) - n(userStats.active),
          admins:       n(userStats.admins),
          newThisMonth: n(userStats.newThisMonth),
        },
        content: {
          total:     n(contentStats.total),
          published: n(contentStats.published),
          pending:   n(contentStats.pending),
          draft:     n(contentStats.draft),
        },
        stories: {
          total:     n(storyStats.total),
          pending:   n(storyStats.pending),
          published: n(storyStats.published),
          rejected:  n(storyStats.rejected),
        },
        contacts: {
          total:        n(contactStats.total),
          unresolved:   n(contactStats.unresolved),
          resolved:     n(contactStats.resolved),
          newThisMonth: n(contactStats.newThisMonth),
        },
      },
    });
  } catch (err) {
    if (process.env.NODE_ENV === "development") {
      console.error("[GET /api/superadmin/analytics]", err);
    }
    return NextResponse.json(
      { success: false, error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
