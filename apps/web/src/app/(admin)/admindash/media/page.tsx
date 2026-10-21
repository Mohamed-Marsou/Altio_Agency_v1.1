import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import MediaLibraryView from "@/components/admin/MediaLibraryView";

export const metadata: Metadata = { title: "Media · Altio admin", robots: { index: false, follow: false } };

export default function AdminMediaPage() {
  return (
    <AdminShell>
      <MediaLibraryView />
    </AdminShell>
  );
}
