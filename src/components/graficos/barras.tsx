"use client";

import { cn } from "@/lib/utils";

// Gráficos de una sola serie, en el color principal de la marca: no llevan
// leyenda porque el título dice qué se mide. Barras finas con la punta
// redondeada, el valor en la punta, cuadrícula de líneas finas y detalle al
// pasar el cursor o con el teclado. Cada gráfico ofrece su tabla.

export interface FilaBarra {
  clave: string;
  etiqueta: string;
  valor: number;
  // Texto en la punta de la barra (por ejemplo, "Bs 349 mil · 10").
  textoValor: string;
  // Detalle adicional del tooltip.
  detalle?: string;
}

export function BarrasHorizontales({ filas, descripcion }: { filas: FilaBarra[]; descripcion: string }) {
  const maximo = Math.max(1, ...filas.map((fila) => fila.valor));
  return (
    <figure aria-label={descripcion} className="flex flex-col gap-2.5">
      {filas.map((fila) => (
        <div key={fila.clave} className="grid grid-cols-[minmax(6rem,14rem)_1fr] items-center gap-3 text-sm">
          <span className="truncate text-muted-foreground" title={fila.etiqueta}>
            {fila.etiqueta}
          </span>
          <div
            tabIndex={0}
            aria-label={`${fila.etiqueta}: ${fila.textoValor}${fila.detalle ? `. ${fila.detalle}` : ""}`}
            className="group relative flex min-w-0 items-center gap-2 rounded-sm py-1.5 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <span
              className="h-3 shrink-0 rounded-r-[4px] bg-primary transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
              style={{ width: `max(${fila.valor > 0 ? "2px" : "0px"}, calc((100% - 7rem) * ${fila.valor / maximo}))` }}
            />
            <span className="shrink-0 text-xs text-muted-foreground tabular-nums">{fila.textoValor}</span>
            {fila.detalle && <Tooltip titulo={fila.textoValor} detalle={`${fila.etiqueta} · ${fila.detalle}`} />}
          </div>
        </div>
      ))}
    </figure>
  );
}

export interface ColumnaMes {
  clave: string;
  etiqueta: string;
  valor: number;
  textoValor: string;
  detalle: string;
}

// Columnas por periodo con ejes de líneas finas. Se rotula solo la última
// columna y la más alta; el resto, con el eje y el tooltip.
export function ColumnasPorPeriodo({
  columnas,
  descripcion,
  formatoEje,
}: {
  columnas: ColumnaMes[];
  descripcion: string;
  formatoEje: (valor: number) => string;
}) {
  const maximoDatos = Math.max(1, ...columnas.map((columna) => columna.valor));
  // Tope del eje redondeado a un número limpio.
  const paso = 10 ** Math.floor(Math.log10(maximoDatos));
  const tope = Math.ceil(maximoDatos / paso) * paso;
  const marcas = [0, tope / 2, tope];
  const indiceMaximo = columnas.findIndex((columna) => columna.valor === maximoDatos);
  const altura = 160;

  return (
    <figure aria-label={descripcion} className="flex flex-col gap-2">
      <div className="relative ml-14" style={{ height: altura }}>
        {marcas.map((marca) => (
          <div key={marca} className="absolute inset-x-0 border-t border-border" style={{ bottom: (marca / tope) * altura }}>
            <span className="absolute -top-2 -left-14 w-12 text-right text-[11px] text-muted-foreground tabular-nums">{formatoEje(marca)}</span>
          </div>
        ))}
        <div className="absolute inset-0 flex items-end justify-around">
          {columnas.map((columna, indice) => {
            const rotulada = indice === columnas.length - 1 || indice === indiceMaximo;
            return (
              <div
                key={columna.clave}
                tabIndex={0}
                aria-label={`${columna.etiqueta}: ${columna.textoValor}. ${columna.detalle}`}
                className="group relative flex h-full w-12 flex-col items-center justify-end rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {rotulada && columna.valor > 0 && <span className="mb-1 text-[11px] whitespace-nowrap text-muted-foreground tabular-nums">{columna.textoValor}</span>}
                <span
                  className="w-6 rounded-t-[4px] bg-primary transition-opacity group-hover:opacity-80 group-focus-visible:opacity-80"
                  style={{ height: Math.max(columna.valor > 0 ? 2 : 0, (columna.valor / tope) * altura) }}
                />
                <Tooltip titulo={columna.textoValor} detalle={`${columna.etiqueta} · ${columna.detalle}`} arriba />
              </div>
            );
          })}
        </div>
      </div>
      <div className="ml-14 flex justify-around">
        {columnas.map((columna) => (
          <span key={columna.clave} className="w-12 text-center text-[11px] text-muted-foreground">
            {columna.etiqueta}
          </span>
        ))}
      </div>
    </figure>
  );
}

// El valor va primero y destacado; la etiqueta, después.
function Tooltip({ titulo, detalle, arriba }: { titulo: string; detalle: string; arriba?: boolean }) {
  return (
    <span
      role="presentation"
      className={cn(
        "pointer-events-none absolute z-10 hidden w-max max-w-56 flex-col rounded-md border bg-popover px-2.5 py-1.5 text-xs shadow-md group-hover:flex group-focus-visible:flex",
        arriba ? "bottom-full left-1/2 mb-1 -translate-x-1/2" : "top-full left-0 mt-1",
      )}
    >
      <span className="font-semibold text-popover-foreground tabular-nums">{titulo}</span>
      <span className="text-muted-foreground">{detalle}</span>
    </span>
  );
}

// Tabla equivalente a un gráfico, para leer los valores sin depender del color.
export function TablaDelGrafico({ encabezados, filas }: { encabezados: string[]; filas: (string | number)[][] }) {
  return (
    <details className="text-sm">
      <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">Ver como tabla</summary>
      <table className="mt-2 w-full text-xs">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            {encabezados.map((encabezado, indice) => (
              <th key={encabezado} className={cn("py-1 font-medium", indice > 0 && "text-right")}>
                {encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filas.map((fila) => (
            <tr key={String(fila[0])} className="border-b last:border-0">
              {fila.map((celda, indice) => (
                <td key={indice} className={cn("py-1", indice > 0 && "text-right tabular-nums")}>
                  {celda}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </details>
  );
}
