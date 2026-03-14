import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Promptly",
  description: "Compress LLM prompts to reduce token usage and API costs",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
