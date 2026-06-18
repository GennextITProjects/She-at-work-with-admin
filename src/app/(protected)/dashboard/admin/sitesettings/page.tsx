// app/dashboard/admin/site-settings/page.tsx
import AdminSiteSettings from "@/components/dashboard/admin/sitesettings/page";
import { Metadata } from "next";


export const metadata: Metadata = {
  title: "Site Settings | Admin Dashboard",
  description: "Manage site settings and configuration",
};

export default function AdminSiteSettingsPage() {
  return <AdminSiteSettings />;
}