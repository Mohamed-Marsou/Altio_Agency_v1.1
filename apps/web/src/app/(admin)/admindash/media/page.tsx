import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import MediaLibraryView from "@/components/admin/MediaLibraryView";

export const metadata: Metadata = { title: "Media · Altio admin", robots: ADMIN_ROBOTS };

export default function AdminMediaPage() {
  return (
    <AdminShell>
      <MediaLibraryView />
    </AdminShell>
  );
}
