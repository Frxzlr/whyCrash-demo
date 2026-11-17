import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "CrashLab — understand every crash",
  description: "A focused Node.js debugging workspace powered by whycrash.",
  applicationName: "CrashLab",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
