import type { Metadata, Viewport } from "next";
import { Roboto, Roboto_Mono } from "next/font/google";
import "./globals.css";

// Mesma superfamília na interface e nos valores: os dígitos do mono derivam
// do sans, então rótulo e número não parecem vir de dois projetos diferentes.
const roboto = Roboto({
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
  title: "Caderno",
  description: "Controle financeiro pessoal e fiado.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#FAF6F3",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${roboto.variable} ${robotoMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
