"use client";

import { useState } from "react";
import Link from "next/link";
import { FilePlus2 } from "lucide-react";
import { DialogoAsientoManual } from "@/components/contabilidad/dialogo-asiento-manual";
import { TablaAsiento } from "@/components/contabilidad/tabla-asiento";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { nombresOrigenAsiento } from "@/datos/catalogos";
import { mesDeFecha } from "@/datos/fechas";
import type { Asiento, OrigenAsiento } from "@/datos/tipos";
import { totalesDeAsiento } from "@/lib/contabilidad";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMes, pluralizar } from "@/lib/formato";
import { useFiltroUrl } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

const todos = "todos";

const clasesOrigen: Record<OrigenAsiento, string> = {
  apertura: "bg-muted text-muted-foreground",
  manual: "bg-muted text-foreground",
  factura: "bg-marca-suave text-primary",
  anulacion_factura: "bg-peligro-suave text-destructive",
  cobro: "bg-exito-suave text-exito",
  planilla: "bg-advertencia-suave text-advertencia",
  depreciacion: "bg-secondary text-secondary-foreground",
};

// Enlace al documento que generó un asiento automático.
function enlaceDeOrigen(asiento: Asiento) {
  if (!asiento.idOrigen) return null;
  if (asiento.origen === "factura" || asiento.origen === "anulacion_factura") return `/facturas/${asiento.idOrigen}`;
  if (asiento.origen === "planilla") return `/planilla?mes=${asiento.idOrigen.replace("pla-", "")}`;
  if (asiento.origen === "depreciacion") return `/depreciacion?mes=${asiento.idOrigen.replace("dep-", "")}`;
  return null;
}

export function LibroDiario() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const meses = [...new Set(estado.asientos.map((asiento) => mesDeFecha(asiento.fecha)))].sort((a, b) => b.localeCompare(a));
  const opcionesMes: Record<string, string> = { [todos]: "Todos los meses", ...Object.fromEntries(meses.map((mes) => [mes, formatearMes(mes)])) };
  const opcionesOrigen: Record<OrigenAsiento | typeof todos, string> = { [todos]: "Todos los orígenes", ...nombresOrigenAsiento };
  const [mes, setMes] = useFiltroUrl<string>("mes", mesDeFecha(hoy), Object.keys(opcionesMes));
  const [origen, setOrigen] = useFiltroUrl<OrigenAsiento | typeof todos>("origen", todos, Object.keys(opcionesOrigen) as (OrigenAsiento | typeof todos)[]);
  const [abiertos, setAbiertos] = useState<Set<string>>(new Set());
  const [dialogo, setDialogo] = useState(false);

  const visibles = estado.asientos
    .filter((asiento) => mes === todos || mesDeFecha(asiento.fecha) === mes)
    .filter((asiento) => origen === todos || asiento.origen === origen)
    .sort((a, b) => b.fecha.localeCompare(a.fecha) || b.numero - a.numero);
  const automaticos = visibles.filter((asiento) => asiento.origen !== "manual" && asiento.origen !== "apertura").length;

  function alternar(id: string) {
    setAbiertos((actuales) => {
      const siguientes = new Set(actuales);
      if (siguientes.has(id)) siguientes.delete(id);
      else siguientes.add(id);
      return siguientes;
    });
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Libro diario"
        descripcion={`${pluralizar(visibles.length, "asiento", "asientos")}, ${automaticos} generados solos por facturas, cobros, planillas y depreciación. Haga clic en uno para ver sus cuentas.`}
        acciones={
          <Button onClick={() => setDialogo(true)}>
            <FilePlus2 />
            Asiento manual
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-xl">
        <SelectorSimple opciones={opcionesMes} valor={mes} alCambiar={setMes} />
        <SelectorSimple opciones={opcionesOrigen} valor={origen} alCambiar={setOrigen} />
      </div>

      <Card className="gap-0 divide-y py-0">
        {visibles.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">No hay asientos con estos filtros.</p>}
        {visibles.map((asiento) => {
          const abierto = abiertos.has(asiento.id);
          const enlace = enlaceDeOrigen(asiento);
          return (
            <div key={asiento.id}>
              <button
                type="button"
                onClick={() => alternar(asiento.id)}
                aria-expanded={abierto}
                className="flex w-full flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 text-left text-sm outline-none hover:bg-muted/40 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
              >
                <span className="w-14 shrink-0 font-mono text-xs text-muted-foreground">N° {asiento.numero}</span>
                <span className="w-24 shrink-0 tabular-nums">{formatearFecha(asiento.fecha)}</span>
                <span className="min-w-0 flex-1">{asiento.glosa}</span>
                <Badge className={cn("shrink-0", clasesOrigen[asiento.origen])}>{nombresOrigenAsiento[asiento.origen]}</Badge>
                <span className="w-28 shrink-0 text-right font-medium tabular-nums">{formatearImporte(totalesDeAsiento(asiento.lineas).debe)}</span>
              </button>
              {abierto && (
                <div className="flex flex-col gap-2 bg-muted/20 px-4 pt-1 pb-4">
                  <TablaAsiento lineas={asiento.lineas} />
                  {enlace && (
                    <Link href={enlace} className="w-fit text-xs text-primary underline-offset-4 hover:underline">
                      Ver el documento que lo generó
                    </Link>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </Card>

      <DialogoAsientoManual abierto={dialogo} alCambiarAbierto={setDialogo} />
    </>
  );
}
