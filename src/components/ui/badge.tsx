import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  // Pill translúcida (bg em 15% de opacidade + texto na cor cheia), não
  // preenchimento sólido. O texto usa os tokens --brand/--chart-2/--chart-3,
  // não --primary/--destructive/--success crus: esses últimos são afinados
  // pra fundo sólido + texto de contraste em cima, e reprovam quando usados
  // como texto corrido contra o card (--destructive 3.09:1 no escuro,
  // --primary/verde-núcleo 2.34:1 no claro — abaixo de 4.5:1). --brand e os
  // tokens de chart já resolvem isso, com variante própria por tema.
  "inline-flex items-center justify-center rounded-full border border-transparent px-2.5 py-0.5 text-xs font-semibold tracking-wide w-fit whitespace-nowrap shrink-0 [&>svg]:size-3 gap-1 [&>svg]:pointer-events-none transition-[color,box-shadow] overflow-hidden",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-brand",
        secondary: "bg-secondary text-secondary-foreground",
        destructive: "bg-destructive/15 text-[var(--chart-2)]",
        outline: "border-border text-foreground",
        success: "bg-success/15 text-[var(--chart-3)]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span";
  return (
    <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
