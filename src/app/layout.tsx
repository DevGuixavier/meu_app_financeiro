import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans, JetBrains_Mono } from "next/font/google";
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

// IBM Plex Sans no corpo: troca a Scoutie Sans (rev. anterior). Decidido
// comparando as duas lado a lado num canvas com o dashboard real — Scoutie
// Sans lia como "genérica demais" pro usuário, IBM Plex Sans deu a cara de
// "banco tradicional" que ele queria, sem cair no Inter/Roboto batido.
// Reforça também a família com o mono (mesmo desenhista, IBM), o tipo de
// coerência de sistema que dá ar profissional/deliberado.
const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

// JetBrains Mono nos números: troca o IBM Plex Mono. O numeral gigante do
// hero (.numeral-hero) e os valores tabulares são o elemento mais dominante
// da tela — por isso a diferenciação da nova identidade entrou aqui, não no
// --font-display (Bricolage Grotesque, que nem aparece nessa tela — só no
// título do login e do formulário).
const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
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
      className={`${bricolageGrotesque.variable} ${ibmPlexSans.variable} ${jetbrainsMono.variable} h-full`}
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
