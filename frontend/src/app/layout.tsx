import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { WorkspacesProvider } from "@/lib/WorkspacesProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI Meeting Workspace",
  description: "Developer-facing meeting workspace powered by Recall.ai",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <WorkspacesProvider>
          <DashboardShell>{children}</DashboardShell>
        </WorkspacesProvider>
      </body>
    </html>
  );
}
