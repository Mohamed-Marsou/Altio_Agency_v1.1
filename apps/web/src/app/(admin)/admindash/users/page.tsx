import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import UserListView from "@/components/admin/UserListView";

export const metadata: Metadata = { title: "Users · Altio admin", robots: ADMIN_ROBOTS };

export default function AdminUsersPage() {
  return (
    <AdminShell>
      <UserListView />
    </AdminShell>
  );
}
