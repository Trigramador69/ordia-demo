"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarCheck2, CalendarMinus, CalendarPlus } from "lucide-react";
import { DialogoDiaLibre, DialogoPermiso } from "@/components/rrhh/dialogos-dias-libres-permisos";
import { DialogoSolicitudVacacion } from "@/components/rrhh/dialogo-solicitud-vacacion";
import { InsigniaAusencia, InsigniaEstadoSolicitud, formatearRango } from "@/components/rrhh/insignias";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nombresArea, nombresTipoContrato, nombresTipoPermiso } from "@/datos/catalogos";
import { diferenciaEnDias, mesDeFecha } from "@/datos/fechas";
import type { Persona } from "@/datos/tipos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { ausenciaEnFecha } from "@/lib/demo/consultas";
import {
  calcularEdad,
  fechaDeHoy,
  formatearAntiguedad,
  formatearFecha,
  formatearMonto,
  iniciales,
  nombreCompleto,
  pluralizar,
} from "@/lib/formato";
import { calcularFilaPlanilla } from "@/lib/planilla";
import { resumenPermisos, resumenVacaciones, saldoDiasLibres } from "@/lib/vacaciones";
import { cn } from "@/lib/utils";

// Un contrato a plazo fijo que vence en menos de este tiempo se resalta.
const diasAvisoFinContrato = 120;

export function FichaPersona() {
  const { idPersona } = useParams<{ idPersona: string }>();
  const filtrosDeOrigen = useSearchParams().get("filtros");
  const estado = useEstadoDemo();
  const persona = estado.personas.find((item) => item.id === idPersona);
  const enlaceVolver = `/personal${filtrosDeOrigen ? `?${filtrosDeOrigen}` : ""}`;

  if (!persona) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold">No encontramos a esta persona</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/personal" />}>
          Volver al personal
        </Button>
      </div>
    );
  }

  return <ContenidoFicha persona={persona} enlaceVolver={enlaceVolver} />;
}

function ContenidoFicha({ persona, enlaceVolver }: { persona: Persona; enlaceVolver: string }) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [dialogoVacacion, setDialogoVacacion] = useState(false);
  const [dialogoDiaLibre, setDialogoDiaLibre] = useState(false);
  const [dialogoPermiso, setDialogoPermiso] = useState(false);

  const ausenciaHoy = ausenciaEnFecha(estado, persona.id, hoy);
  const vacaciones = resumenVacaciones(persona, estado.solicitudesVacacion, hoy);
  const diasLibres = saldoDiasLibres(persona.id, estado.movimientosDiasLibres);
  const permisosDelAnio = resumenPermisos(persona.id, estado.permisos, hoy);
  const sueldoDelMes = calcularFilaPlanilla(persona, mesDeFecha(hoy), 0);
  const solicitudes = estado.solicitudesVacacion
    .filter((solicitud) => solicitud.idPersona === persona.id)
    .sort((a, b) => b.desde.localeCompare(a.desde));
  const movimientos = estado.movimientosDiasLibres
    .filter((movimiento) => movimiento.idPersona === persona.id)
    .sort((a, b) => b.fecha.localeCompare(a.fecha));
  const permisos = estado.permisos.filter((permiso) => permiso.idPersona === persona.id).sort((a, b) => b.desde.localeCompare(a.desde));
  const diasParaFinContrato = persona.fechaFinContrato ? diferenciaEnDias(hoy, persona.fechaFinContrato) : null;

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href={enlaceVolver} />}>
          <ArrowLeft />
          Personal
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <Avatar className="size-14">
          <AvatarFallback className="bg-marca-suave text-lg font-medium text-primary">{iniciales(persona)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-2xl font-semibold tracking-tight">{nombreCompleto(persona)}</h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
            <span>
              {persona.cargo} · {nombresArea[persona.area]}
            </span>
            {ausenciaHoy && <InsigniaAusencia tipo={ausenciaHoy.tipo} />}
            {diasParaFinContrato !== null && diasParaFinContrato <= diasAvisoFinContrato && (
              <Badge className="bg-advertencia-suave text-advertencia">
                Contrato vence el {formatearFecha(persona.fechaFinContrato!)}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Contrato</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <Dato etiqueta="Fecha de ingreso" valor={formatearFecha(persona.fechaIngreso)} />
                <Dato etiqueta="Antigüedad" valor={formatearAntiguedad(persona.fechaIngreso)} />
                <Dato
                  etiqueta="Tipo de contrato"
                  valor={
                    persona.fechaFinContrato
                      ? `${nombresTipoContrato[persona.tipoContrato]}, hasta el ${formatearFecha(persona.fechaFinContrato)}`
                      : nombresTipoContrato[persona.tipoContrato]
                  }
                />
                <Dato etiqueta="Haber básico" valor={formatearMonto(persona.sueldoBasico)} />
                <Dato
                  etiqueta="Bono de antigüedad"
                  valor={
                    sueldoDelMes.porcentajeBono === 0
                      ? "Sin bono (menos de 2 años)"
                      : `${formatearMonto(sueldoDelMes.bonoAntiguedad)} (${sueldoDelMes.porcentajeBono}% por ${pluralizar(sueldoDelMes.aniosServicio, "año", "años")})`
                  }
                />
                <Dato etiqueta="Cuenta para el depósito" valor={persona.cuentaBancaria} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Datos personales</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <Dato etiqueta="Carnet de identidad" valor={persona.carnetIdentidad} />
                <Dato etiqueta="Edad" valor={`${calcularEdad(persona.fechaNacimiento)} años`} />
                <Dato etiqueta="Celular" valor={persona.telefono} />
                <Dato etiqueta="Correo laboral" valor={persona.correoLaboral} />
                <Dato etiqueta="Correo personal" valor={persona.correoPersonal} />
                <Dato etiqueta="Dirección" valor={persona.direccion} />
                <Dato etiqueta="Contacto de emergencia" valor={persona.contactoEmergencia} />
              </dl>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Vacaciones</CardTitle>
              <CardDescription>
                {vacaciones.fechaPrimerDerecho
                  ? `Todavía no le corresponden: cumple un año el ${formatearFecha(vacaciones.fechaPrimerDerecho)}.`
                  : `Le corresponden ${vacaciones.diasGestionActual} días hábiles por gestión por ${pluralizar(vacaciones.anios, "año", "años")} de antigüedad.`}
              </CardDescription>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setDialogoVacacion(true)}>
                  <CalendarPlus />
                  Solicitar
                </Button>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {!vacaciones.fechaPrimerDerecho && (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Cifra etiqueta="Saldo" valor={vacaciones.saldo} destacada />
                  <Cifra etiqueta="Derecho" valor={vacaciones.derecho} />
                  <Cifra etiqueta="Tomados" valor={vacaciones.tomados} />
                  <Cifra etiqueta={vacaciones.pendientesDeAprobar ? "Por aprobar" : "Programados"} valor={vacaciones.pendientesDeAprobar || vacaciones.programados} />
                </div>
              )}
              {vacaciones.gestionesVigentes.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {vacaciones.gestionesVigentes
                    .map((gestion) => `Gestión ${formatearFecha(gestion.desde)} al ${formatearFecha(gestion.hasta)}: ${gestion.dias} días`)
                    .join(" · ")}
                  {vacaciones.proximoTramo && ` · Desde el ${formatearFecha(vacaciones.proximoTramo.fecha)} le corresponden ${vacaciones.proximoTramo.dias} días por gestión.`}
                </p>
              )}
              {solicitudes.length > 0 && (
                <ul className="flex flex-col divide-y border-t">
                  {solicitudes.map((solicitud) => (
                    <li key={solicitud.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2.5 text-sm last:pb-0">
                      <InsigniaEstadoSolicitud estado={solicitud.estado} />
                      <span className="tabular-nums">{formatearRango(solicitud.desde, solicitud.hasta)}</span>
                      <span className="text-muted-foreground">
                        {pluralizar(solicitud.diasHabiles, "día", "días")}
                        {solicitud.comentario && ` · ${solicitud.comentario}`}
                        {solicitud.motivoRechazo && ` · Rechazada: ${solicitud.motivoRechazo}`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Días libres</CardTitle>
                <CardDescription>
                  Saldo: {pluralizar(diasLibres.saldo, "día", "días")} ({diasLibres.ganados} ganados, {diasLibres.usados} usados)
                </CardDescription>
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => setDialogoDiaLibre(true)}>
                    <CalendarCheck2 />
                    Registrar
                  </Button>
                </CardAction>
              </CardHeader>
              {movimientos.length > 0 && (
                <CardContent>
                  <ul className="flex flex-col divide-y">
                    {movimientos.map((movimiento) => (
                      <li key={movimiento.id} className="flex flex-col gap-0.5 py-2 text-sm first:pt-0 last:pb-0">
                        <span className="flex items-center gap-2">
                          <span className={cn("font-medium", movimiento.tipo === "ganado" ? "text-exito" : "text-advertencia")}>
                            {movimiento.tipo === "ganado" ? "+1" : "-1"}
                          </span>
                          <span className="tabular-nums">{formatearFecha(movimiento.fecha)}</span>
                        </span>
                        <span className="text-xs text-muted-foreground">{movimiento.motivo}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Permisos</CardTitle>
                <CardDescription>
                  Con goce este año: {permisosDelAnio.conGoce} de {permisosDelAnio.cupoConGoce} · sin goce: {permisosDelAnio.sinGoce}
                </CardDescription>
                <CardAction>
                  <Button variant="outline" size="sm" onClick={() => setDialogoPermiso(true)}>
                    <CalendarMinus />
                    Registrar
                  </Button>
                </CardAction>
              </CardHeader>
              {permisos.length > 0 && (
                <CardContent>
                  <ul className="flex flex-col divide-y">
                    {permisos.map((permiso) => (
                      <li key={permiso.id} className="flex flex-col gap-0.5 py-2 text-sm first:pt-0 last:pb-0">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="tabular-nums">{formatearRango(permiso.desde, permiso.hasta)}</span>
                          <Badge className={permiso.tipo === "con_goce" ? "bg-marca-suave text-primary" : "bg-peligro-suave text-destructive"}>
                            {nombresTipoPermiso[permiso.tipo]}
                          </Badge>
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {pluralizar(permiso.diasHabiles, "día", "días")} · {permiso.motivo}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              )}
            </Card>
          </div>
        </div>
      </div>

      <DialogoSolicitudVacacion idPersonaFija={persona.id} abierto={dialogoVacacion} alCambiarAbierto={setDialogoVacacion} />
      <DialogoDiaLibre idPersonaFija={persona.id} abierto={dialogoDiaLibre} alCambiarAbierto={setDialogoDiaLibre} />
      <DialogoPermiso idPersonaFija={persona.id} abierto={dialogoPermiso} alCambiarAbierto={setDialogoPermiso} />
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="break-words">{valor}</dd>
    </div>
  );
}

function Cifra({ etiqueta, valor, destacada }: { etiqueta: string; valor: number; destacada?: boolean }) {
  return (
    <div className={cn("rounded-lg border px-3 py-2", destacada && "border-primary/30 bg-marca-suave")}>
      <p className="text-xs text-muted-foreground">{etiqueta}</p>
      <p className={cn("font-heading text-2xl font-semibold tabular-nums", destacada && "text-primary")}>{valor}</p>
    </div>
  );
}
