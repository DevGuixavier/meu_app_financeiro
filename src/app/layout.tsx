import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Mono } from "next/font/google";
import localFont from "next/font/local";
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

// Bricolage Grotesque nos títulos: geométrica, bem arredondada, peso
// pesado — a mesma família de sensação da referência que o usuário mandou
// (estilo Clash Display, que é da Fontshare e não está no Google Fonts;
// essa é a alternativa mais próxima disponível via next/font/google, sem
// precisar hospedar arquivo de fonte externo). Trocou a Playfair Display
// (serifada), que não agradou. O numeral gigante do hero continua em
// monoespaçada (--font-mono), não nesta — ver .numeral-hero em globals.css.
const bricolageGrotesque = Bricolage_Grotesque({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Scoutie Sans no corpo: pedida pelo usuário ("Scout Sans" — o nome exato no
// Google Fonts é Scoutie Sans, da Help Scout). O próprio brief da fonte é
// "legibilidade compacta de UI" — por isso foi pro corpo (--font-body), não
// nos títulos, que continuam em Bricolage Grotesque.
//
// Hospedada localmente (next/font/local), não via next/font/google: essa
// fonte entrou no catálogo do Google Fonts em jul/2026 e a versão do
// Next.js deste projeto ainda não reconhece ("Unknown font" no build) —
// o manifesto de fontes vem embutido no próprio Next, não é live. Arquivo
// baixado do próprio repo oficial (github.com/google/fonts/ofl/scoutiesans),
// licença OFL em src/fonts/ScoutieSans-OFL.txt. É fonte variável (200–800),
// um arquivo só cobre a faixa de peso inteira.
const scoutieSans = localFont({
  src: "../fonts/ScoutieSans-Variable.ttf",
  variable: "--font-body",
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
    { media: "(prefers-color-scheme: light)", color: "#F7F7F7" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${bricolageGrotesque.variable} ${scoutieSans.variable} ${plexMono.variable} h-full`}
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
