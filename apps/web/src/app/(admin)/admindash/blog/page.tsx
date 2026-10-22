import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import BlogListView from "@/components/admin/BlogListView";

export const metadata: Metadata = { title: "Blog · Altio admin", robots: ADMIN_ROBOTS };

export default function AdminBlogPage() {
  return (
    <AdminShell>
      <BlogListView />
    </AdminShell>
  );
}
