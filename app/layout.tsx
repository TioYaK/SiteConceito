import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Studio Bruna Meireles • Estética Facial, Cílios & Gestão",
  description: "Studio Bruna Meireles - Extensão de Cílios, Design de Sobrancelhas, Micropigmentação e Recepção Inteligente 24h via WhatsApp.",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" }
    ],
    shortcut: ["/icon.svg"],
    apple: [
      { url: "/icon.svg", sizes: "180x180", type: "image/svg+xml" }
    ]
  },
  openGraph: {
    title: "Studio Bruna Meireles • Estética & Cílios",
    description: "Agendamentos e Catálogo Oficial - Extensão de Cílios, Sobrancelhas e Estética Facial.",
    url: "https://studiobrunameireles.com.br",
    siteName: "Studio Bruna Meireles",
    images: [
      {
        url: "https://studiobrunameireles.com.br/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "Studio Bruna Meireles - Estética & Cílios"
      }
    ],
    locale: "pt_BR",
    type: "website",
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Studio Bruna Meireles",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: "#059669",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="apple-touch-icon" href="/icon.svg" />
      </head>
      <body className="min-h-screen bg-slate-50 flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
