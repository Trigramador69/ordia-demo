"use client";

import { useState } from "react";
import { CalendarPlus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { DialogoSolicitudVacacion } from "@/components/rrhh/dialogo-solicitud-vacacion";
import { InsigniaEstadoSolicitud, formatearRango } from "@/components/rrhh/insignias";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cancelarSolicitud } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { fechaDeHoy, formatearFecha, pluralizar } from "@/lib/formato";
import { resumenVacaciones, saldoDiasLibres } from "@/lib/vacaciones";
import { cn } from "@/lib/utils";

// Lo que ve cada persona del equipo: su saldo y sus solicitudes. Lo que pide
// aquí le llega al gerente en "Vacaciones".
export function MisVacaciones() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const persona = usuarioDelRol(estado);
  const [dialogo, setDialogo] = useState(false);
  const resumen = resumenVacaciones(persona, estado.solicitudesVacacion, hoy);
  const diasLibres = saldoDiasLibres(persona.id, estado.movimientosDiasLibres);
  const solicitudes = estado.solicitudesVacacion
    .filter((solicitud) => solicitud.idPersona === persona.id)
    .sort((a, b) => b.fechaSolicitud.localeCompare(a.fechaSolicitud) || b.desde.localeCompare(a.desde));

  function cancelar(idSolicitud: string) {
    cancelarSolicitud(idSolicitud);
    toast.success("Solicitud retirada.");
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Mis vacaciones"
        descripcion={
          estado.rol === "gerente"
            ? `${persona.nombres.split(" ")[0]}, aquí ve su saldo y pide días. Sus solicitudes también aparecen en Vacaciones.`
            : `${persona.nombres.split(" ")[0]}, aquí ve su saldo y pide días. El gerente recibe la solicitud y la aprueba.`
        }
        acciones={
          <Button onClick={() => setDialogo(true)} disabled={resumen.fechaPrimerDerecho !== null}>
            <CalendarPlus />
            Solicitar vacaciones
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Cifra
          titulo="Días disponibles"
          valor={resumen.fechaPrimerDerecho ? "-" : Math.max(0, resumen.saldo - resumen.pendientesDeAprobar)}
          detalle={
            resumen.fechaPrimerDerecho
              ? `Le corresponden desde el ${formatearFecha(resumen.fechaPrimerDerecho)}`
              : `${resumen.diasGestionActual} días hábiles por gestión`
          }
          destacada
        />
        <Cifra
          titulo="Tomados y programados"
          valor={resumen.tomados + resumen.programados}
          detalle={resumen.pendientesDeAprobar > 0 ? `${pluralizar(resumen.pendientesDeAprobar, "día", "días")} esperando aprobación` : "Nada esperando aprobación"}
        />
        <Cifra titulo="Días libres" valor={diasLibres.saldo} detalle="Ganados por trabajar feriados o fines de semana" />
      </div>

      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle>Mis solicitudes</CardTitle>
          <CardDescription>{solicitudes.length === 0 ? "Todavía no pidió vacaciones." : pluralizar(solicitudes.length, "solicitud", "solicitudes")}</CardDescription>
        </CardHeader>
        {solicitudes.length > 0 && (
          <CardContent>
            <ul className="flex flex-col divide-y">
              {solicitudes.map((solicitud) => (
                <li key={solicitud.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-col gap-1">
                    <span className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium tabular-nums">{formatearRango(solicitud.desde, solicitud.hasta)}</span>
                      <span className="text-muted-foreground">{pluralizar(solicitud.diasHabiles, "día hábil", "días hábiles")}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pedida el {formatearFecha(solicitud.fechaSolicitud)}
                      {solicitud.comentario && ` · ${solicitud.comentario}`}
                      {solicitud.motivoRechazo && ` · Motivo del rechazo: ${solicitud.motivoRechazo}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <InsigniaEstadoSolicitud estado={solicitud.estado} />
                    {solicitud.estado === "pendiente" && (
                      <Button variant="ghost" size="sm" onClick={() => cancelar(solicitud.id)}>
                        <Trash2 />
                        Retirar
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>

      <DialogoSolicitudVacacion idPersonaFija={persona.id} abierto={dialogo} alCambiarAbierto={setDialogo} />
    </>
  );
}

function Cifra({ titulo, valor, detalle, destacada }: { titulo: string; valor: number | string; detalle: string; destacada?: boolean }) {
  return (
    <Card className={cn(destacada && "border-primary/30")}>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className={cn("font-heading text-3xl font-semibold tabular-nums", destacada && "text-primary")}>{valor}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
