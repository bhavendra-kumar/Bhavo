import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import { DialogProvider } from "@/components/ui/DialogProvider";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800"],
  variable: "--font-outfit",
});

export const metadata: Metadata = {
  title: "Bhavo",
  description: "Bhavo combines AI-powered ride booking with commute automation to deliver seamless, predictable, and premium daily travel experiences.",
  icons: {
    icon: "/trimmed-logo.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${outfit.className} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <DialogProvider>{children}</DialogProvider>
      </body>
    </html>
  );
}
