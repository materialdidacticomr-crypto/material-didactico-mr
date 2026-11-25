
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "CAMPUS MR 2.0 | Material Didáctico MR",
    template: "%s | CAMPUS MR 2.0",
  },
  description:
    "Plataforma educativa de Material Didáctico MR para docentes, estudiantes y equipos educativos.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} min-h-full antialiased bg-[#111827]`}
    >
      <body className="min-h-screen w-full overflow-x-hidden bg-[#111827] text-slate-100">
        {children}
      </body>
    </html>
  );
}
