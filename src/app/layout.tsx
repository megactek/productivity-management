import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppDataProvider } from "@/context/AppDataContext";
import { Toaster } from "@/components/ui/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "TaskFlow - Lightweight Task Management",
  description: "Simple, fast, and effective task and project management",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AppDataProvider>
          <div className="min-h-screen bg-background text-foreground w-4/5 m-auto">{children}</div>
          <Toaster />
        </AppDataProvider>
      </body>
    </html>
  );
}
