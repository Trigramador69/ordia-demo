"use client";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

// Select de un valor a partir de un mapa { valor: etiqueta }, que es como
// están los catálogos de la demo.
export function SelectorSimple<Valor extends string>({
  opciones,
  valor,
  alCambiar,
  textoVacio = "Seleccione",
  className,
  id,
  invalido,
  deshabilitado,
}: {
  opciones: Record<Valor, string>;
  valor: Valor | "";
  alCambiar: (valor: Valor) => void;
  textoVacio?: string;
  className?: string;
  id?: string;
  invalido?: boolean;
  deshabilitado?: boolean;
}) {
  return (
    <Select
      items={opciones}
      disabled={deshabilitado}
      value={valor === "" ? null : valor}
      onValueChange={(nuevo) => {
        if (nuevo !== null) alCambiar(nuevo as Valor);
      }}
    >
      <SelectTrigger id={id} aria-invalid={invalido || undefined} className={cn("w-full", className)}>
        <SelectValue placeholder={textoVacio} />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(opciones) as [Valor, string][]).map(([clave, etiqueta]) => (
          <SelectItem key={clave} value={clave}>
            {etiqueta}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
