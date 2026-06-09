import type { Metadata } from "next";
import type { ReactNode } from "react";

import "./globals.css";

export const metadata: Metadata = {
  title: "RUC Bible Study Department",
  description:
    "Member information form for Redeemer's University Chapel of Power Bible Study Department."
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body className="font-sans">{children}</body>
    </html>
  );
}
