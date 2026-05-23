import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Get.Go.Gone. Marketing Hub",
  description: "Vehicle marketing hub for small used car dealerships.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
