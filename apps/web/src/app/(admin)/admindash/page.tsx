import type { Metadata } from "next";
import AdminShell from "@/components/admin/AdminShell";
import OverviewView from "@/components/admin/OverviewView";

// The admin area must never appear in Google.
export const metadata: Metadata = {
  title: "Overview · Altio admin",
  robots: { index: false, follow: false },
};

export default function AdminDashPage() {
  return (
    <AdminShell>
      <OverviewView />
    </AdminShell>
  );
}
