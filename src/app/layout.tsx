import type { Metadata, Viewport } from "next";
import { Playfair_Display, Source_Sans_3, IBM_Plex_Mono } from "next/font/google";
import Script from "next/script";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Resolve o tema (salvo ou do sistema) e grava em <html data-theme> antes da
// primeira pintura — beforeInteractive garante isso. Sem ele, a página
// pintaria clara e só corrigiria pra escura depois que o React montasse.
const SCRIPT_TEMA = `
(function () {
  try {
    var salvo = localStorage.getItem("tema");
    var tema = salvo === "light" || salvo === "dark"
      ? salvo
      : (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    document.documentElement.setAttribute("data-theme", tema);
  } catch (e) {}
})();
`;

// Playfair Display nos títulos — serifada, elegante, é o par tipográfico do
// design system que estamos seguindo (doc "Antaris Modern"). O numeral
// gigante do hero NÃO usa essa fonte: o doc especifica valor monetário em
// monoespaçada bold (Fira Code/JetBrains Mono), não na fonte de título — e
// Playfair nem tem peso 300, que o numeral usava antes. Ver .numeral-hero
// em globals.css, que já usa --font-mono por causa disso.
const playfairDisplay = Playfair_Display({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const sourceSans = Source_Sans_3({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Antaris",
  description: "Controle de gastos e cobranças.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FAFAFC" },
    { media: "(prefers-color-scheme: dark)", color: "#0A0711" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${playfairDisplay.variable} ${sourceSans.variable} ${plexMono.variable} h-full`}
      // O script beforeInteractive muda data-theme neste elemento antes do
      // React hidratar — mismatch esperado e inofensivo, não um bug real.
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-body antialiased">
        <Script id="tema-inicial" strategy="beforeInteractive">
          {SCRIPT_TEMA}
        </Script>
        {children}
        <Toaster />
      </body>
    </html>
  );
}
