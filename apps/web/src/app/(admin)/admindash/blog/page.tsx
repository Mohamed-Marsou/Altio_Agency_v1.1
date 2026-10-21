import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import BlogListView from "@/components/admin/BlogListView";

export const metadata: Metadata = { title: "Blog · Altio admin", robots: { index: false, follow: false } };

export default function AdminBlogPage() {
  return (
    <AdminShell>
      <BlogListView />
    </AdminShell>
  );
}
