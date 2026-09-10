import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Pill (rounded-full) nos botões de ação de verdade, não em tudo que usa
  // <Button> — os ícones de navegação (setas de mês, fechar) já são
  // rounded-full por conta própria via classes inline, fora daqui.
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4 shrink-0 [&_svg]:shrink-0 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] aria-invalid:ring-destructive/20 aria-invalid:border-destructive",
  {
    variants: {
      variant: {
        // A borda existe por acessibilidade, não por estética: o verde neon
        // sobre fundo branco fica em 1.39:1 de luminância, então a silhueta
        // do botão sumiria pra quem enxerga pouco (o texto preto em cima é
        // legível, mas o contorno do controle não). Esse verde escurecido
        // (55% do primary sobre preto) dá 3.91:1 contra o fundo claro, acima
        // do piso de 3:1 pra elemento de interface — WCAG 1.4.11.
        default:
          "border border-[color-mix(in_srgb,var(--primary)_55%,#0a0a0a)] bg-primary text-primary-foreground shadow-sm shadow-primary/25 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/35 active:translate-y-0 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-destructive/90 hover:-translate-y-0.5 focus-visible:ring-destructive/20",
        outline:
          "border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80 hover:-translate-y-0.5",
        ghost: "rounded-lg hover:bg-accent hover:text-accent-foreground",
        link: "rounded-none text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 gap-1.5 px-3 has-[>svg]:px-2.5",
        lg: "h-11 px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
