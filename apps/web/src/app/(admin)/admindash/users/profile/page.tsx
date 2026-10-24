import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import UserProfileView from "@/components/admin/UserProfileView";

export const metadata: Metadata = { title: "Admin page · Altio admin", robots: ADMIN_ROBOTS };

export default function AdminUserProfilePage() {
  return (
    <AdminShell>
      <UserProfileView />
    </AdminShell>
  );
}
