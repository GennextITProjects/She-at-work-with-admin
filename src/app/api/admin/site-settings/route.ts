/*eslint-disable  @typescript-eslint/no-explicit-any */
// app/api/admin/site-settings/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { SiteSettingsTable } from "@/db/schema";
import { eq, and, count, ilike, or } from "drizzle-orm";
import { revalidateSiteSettings } from "@/lib/revalidate";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const group = searchParams.get("group") || null;
    const search = searchParams.get("search")?.trim() || null;
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const limit = Math.min(100, parseInt(searchParams.get("limit") ?? "20"));
    const offset = (page - 1) * limit;

    const conditions = [];
    if (group) conditions.push(eq(SiteSettingsTable.group, group));
    if (search) {
      conditions.push(
        or(
          ilike(SiteSettingsTable.key, `%${search}%`),
          ilike(SiteSettingsTable.label, `%${search}%`),
          ilike(SiteSettingsTable.value, `%${search}%`)
        )
      );
    }
    const where = conditions.length ? and(...conditions) : undefined;

    const [rows, [{ total }]] = await Promise.all([
      db
        .select()
        .from(SiteSettingsTable)
        .where(where)
        .orderBy(SiteSettingsTable.group, SiteSettingsTable.key)
        .limit(limit)
        .offset(offset),
      db.select({ total: count() }).from(SiteSettingsTable).where(where),
    ]);

    return NextResponse.json({
      success: true,
      data: rows,
      pagination: { page, limit, total: Number(total), totalPages: Math.ceil(Number(total) / limit) },
    });
  } catch (err) {
    console.error("[GET /admin/site-settings]", err);
    return NextResponse.json({ success: false, error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, label, group = "general", isActive = true } = body;

    if (!key || !value || !label) {
      return NextResponse.json(
        { success: false, error: "key, value, and label are required" },
        { status: 400 }
      );
    }

    // Check if key already exists
    const existing = await db
      .select()
      .from(SiteSettingsTable)
      .where(eq(SiteSettingsTable.key, key))
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: "Setting with this key already exists" },
        { status: 409 }
      );
    }

    const [newSetting] = await db
      .insert(SiteSettingsTable)
      .values({ key, value, label, group, isActive })
      .returning();

    revalidateSiteSettings();

    return NextResponse.json({ success: true, data: newSetting });
  } catch (err) {
    console.error("[POST /admin/site-settings]", err);
    return NextResponse.json({ success: false, error: "Failed to create setting" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, key, value, label, group, isActive } = body;

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    const updateData: any = {};
    if (key !== undefined) updateData.key = key;
    if (value !== undefined) updateData.value = value;
    if (label !== undefined) updateData.label = label;
    if (group !== undefined) updateData.group = group;
    if (isActive !== undefined) updateData.isActive = isActive;

    const [updated] = await db
      .update(SiteSettingsTable)
      .set(updateData)
      .where(eq(SiteSettingsTable.id, id))
      .returning();

    if (!updated) {
      return NextResponse.json(
        { success: false, error: "Setting not found" },
        { status: 404 }
      );
    }

    revalidateSiteSettings();

    return NextResponse.json({ success: true, data: updated });
  } catch (err) {
    console.error("[PATCH /admin/site-settings]", err);
    return NextResponse.json({ success: false, error: "Failed to update setting" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, error: "id is required" },
        { status: 400 }
      );
    }

    const [deleted] = await db
      .delete(SiteSettingsTable)
      .where(eq(SiteSettingsTable.id, id))
      .returning();

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Setting not found" },
        { status: 404 }
      );
    }

    revalidateSiteSettings();

    return NextResponse.json({ success: true, data: deleted });
  } catch (err) {
    console.error("[DELETE /admin/site-settings]", err);
    return NextResponse.json({ success: false, error: "Failed to delete setting" }, { status: 500 });
  }
}