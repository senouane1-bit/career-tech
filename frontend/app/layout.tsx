import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "CareerTech — Your next chapter",
  description:
    "A thoughtful workspace for your job search. Track opportunities, improve your CV, and move forward with clarity.",
};
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
