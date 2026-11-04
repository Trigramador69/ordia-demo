"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { clasesCeldaAusencia, nombresAusenciaDelDia } from "@/components/rrhh/insignias";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { diaDeLaSemana, diasDelMes, esFinDeSemana, mesDeFecha, sumarMesesAMes } from "@/datos/fechas";
import { feriadoDeFecha } from "@/datos/feriados";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { ausenciaEnFecha, type TipoAusenciaDelDia } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearMes, nombreCompleto } from "@/lib/formato";
import { cn } from "@/lib/utils";

const inicialDia = ["D", "L", "M", "M", "J", "V", "S"];

// Quién está fuera y cuándo, mes por mes: vacaciones, permisos y días libres.
export function CalendarioEquipo() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [mes, setMes] = useState(mesDeFecha(hoy));
  const dias = diasDelMes(mes);
  const personas = [...estado.personas].sort((a, b) => nombreCompleto(a).localeCompare(nombreCompleto(b), "es"));
  const feriados = dias.map((dia) => feriadoDeFecha(dia)).filter((feriado) => feriado !== undefined);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Calendario del equipo</CardTitle>
        <CardDescription>
          {formatearMes(mes)}
          {feriados.length > 0 && ` · Feriados: ${feriados.map((feriado) => `${Number(feriado.fecha.slice(8))} (${feriado.nombre})`).join(", ")}`}
        </CardDescription>
        <CardAction className="flex items-center gap-1">
          <Button variant="outline" size="icon-sm" aria-label="Mes anterior" onClick={() => setMes(sumarMesesAMes(mes, -1))}>
            <ChevronLeft />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setMes(mesDeFecha(hoy))} disabled={mes === mesDeFecha(hoy)}>
            Hoy
          </Button>
          <Button variant="outline" size="icon-sm" aria-label="Mes siguiente" onClick={() => setMes(sumarMesesAMes(mes, 1))}>
            <ChevronRight />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0.5 text-xs">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 min-w-40 bg-card pr-2 text-left font-medium text-muted-foreground">Persona</th>
                {dias.map((dia) => (
                  <th
                    key={dia}
                    className={cn(
                      "min-w-6 text-center font-normal tabular-nums",
                      (esFinDeSemana(dia) || feriadoDeFecha(dia)) && "text-muted-foreground/60",
                      dia === hoy && "font-semibold text-primary",
                    )}
                  >
                    <span className="block">{inicialDia[diaDeLaSemana(dia)]}</span>
                    <span className="block">{Number(dia.slice(8))}</span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {personas.map((persona) => (
                <tr key={persona.id}>
                  <td className="sticky left-0 z-10 bg-card pr-2">
                    <Link href={`/personal/${persona.id}`} className="block truncate py-0.5 hover:underline">
                      {nombreCompleto(persona)}
                    </Link>
                  </td>
                  {dias.map((dia) => {
                    const noHabil = esFinDeSemana(dia) || feriadoDeFecha(dia);
                    const ausencia = noHabil ? null : ausenciaEnFecha(estado, persona.id, dia);
                    return (
                      <td
                        key={dia}
                        title={ausencia ? `${nombresAusenciaDelDia[ausencia.tipo]}: ${ausencia.detalle}` : undefined}
                        className={cn(
                          "h-6 rounded-sm",
                          noHabil ? "bg-muted" : "bg-muted/30",
                          ausencia && clasesCeldaAusencia[ausencia.tipo],
                          dia === hoy && "ring-1 ring-primary ring-inset",
                        )}
                      />
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {(Object.keys(nombresAusenciaDelDia) as TipoAusenciaDelDia[]).map((tipo) => (
            <li key={tipo} className="flex items-center gap-1.5">
              <span className={cn("size-3 rounded-sm", clasesCeldaAusencia[tipo])} />
              {nombresAusenciaDelDia[tipo]}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span className="size-3 rounded-sm bg-muted" />
            Fin de semana o feriado
          </li>
        </ul>
      </CardContent>
    </Card>
  );
}
