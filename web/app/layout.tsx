import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "The Monument That Lives in My Memory — AI Heritage Short Film",
  description: "An AI-assisted heritage short film set in Harar, Ethiopia exploring memory, displacement, and cultural identity.",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#090d16] text-slate-100 antialiased selection:bg-sky-500/30 selection:text-sky-200">
        {children}
      </body>
    </html>
  );
}
