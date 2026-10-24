import type { Metadata } from "next";
import { ADMIN_ROBOTS } from "@/lib/admin/robots";
import AdminShell from "@/components/admin/AdminShell";
import OverviewView from "@/components/admin/OverviewView";

// The admin area must never appear in Google.
export const metadata: Metadata = {
  title: "Overview · Altio admin",
  robots: ADMIN_ROBOTS,
};

export default function AdminDashPage() {
  return (
    <AdminShell>
      <OverviewView />
    </AdminShell>
  );
}
