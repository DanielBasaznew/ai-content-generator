import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://ai-content-generator-showcase-phi.vercel.app"),
  title: "The Monument That Lives in My Memory — AI Heritage Short Film",
  description: "An AI-assisted heritage short film set in Harar, Ethiopia exploring memory, displacement, and cultural identity. 10 Academy Week 0 Final Challenge.",
  openGraph: {
    title: "The Monument That Lives in My Memory — Heritage Short Film",
    description: "An AI-assisted heritage short film set in Harar, Ethiopia exploring memory, displacement, and cultural identity.",
    url: "https://ai-content-generator-showcase-phi.vercel.app",
    siteName: "The Monument That Lives in My Memory",
    images: [
      {
        url: "/og-image.png",
        width: 1920,
        height: 1080,
        alt: "The Monument That Lives in My Memory — End Card & Showcase Preview",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "The Monument That Lives in My Memory — Heritage Short Film",
    description: "An AI-assisted heritage short film set in Harar, Ethiopia exploring memory, displacement, and cultural identity.",
    images: ["/og-image.png"],
  },
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
