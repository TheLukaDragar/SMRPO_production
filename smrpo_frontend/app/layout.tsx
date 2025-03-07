import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/toaster";
import { ProjectProvider } from "@/lib/contexts/project-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SMRPO Project",
  description: "SMRPO Project Management Application",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ProjectProvider>
          {children}
          <Toaster />
        </ProjectProvider>
      </body>
    </html>
  );
}
