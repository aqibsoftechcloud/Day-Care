import type { Metadata } from "next";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "Day Care Surgeries — Admin",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AuthProvider>{children}</AuthProvider>;
}
