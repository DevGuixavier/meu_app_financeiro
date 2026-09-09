import type { Metadata, Viewport } from "next";
import { Public_Sans, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Public Sans (derivada da Libre Franklin) na interface. Ela não tem uma mono
// irmã, então os valores usam Roboto Mono — mono neutra, sem personalidade
// que brigue com o esqueleto gótico da Public Sans.
const publicSans = Public_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  // 600 incluído porque a UI usa font-semibold e o .rotulo-hud pede 600 —
  // sem declarar, o navegador sintetiza o negrito e o traço fica sujo.
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const robotoMono = Roboto_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Saldo",
  description: "Controle de gastos e cobranças.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF6F3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${publicSans.variable} ${robotoMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
