import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Blood Cell Morphology Marker",
  description: "Alat penapisan visual untuk morfologi sel darah merah",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
