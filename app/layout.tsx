import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Dashboard Poker - Carlos Sbrissa",
  description: "Sistema de análise de performance em poker",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body style={{ margin: 0, padding: 0 }}>
        {children}
      </body>
    </html>
  );
}