import type { Metadata } from "next";

import { DashboardWrapper } from "@/components/layout/DashboardWrapper";

export const metadata: Metadata = {
  title: "High Ticket USA - Admin Panel",
  description: "High Ticket English Platform",
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <DashboardWrapper>{children}</DashboardWrapper>;
}
