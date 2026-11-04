"use client";

import { useState } from "react";
import Link from "next/link";
import { BellRing, CalendarPlus, MessageSquarePlus, Siren } from "lucide-react";
import { DetalleOportunidad } from "@/components/crm/detalle-oportunidad";
import { DialogoAgendarSeguimiento, DialogoRegistrarActividad } from "@/components/crm/dialogos";
import { FechaSeguimiento } from "@/components/crm/insignias";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { umbralesAlarmas } from "@/datos/catalogos";
import type { Seguimiento } from "@/datos/tipos";
import {
  describirAlarma,
  grupoDeSeguimiento,
  nombresAlarma,
  nombresGrupoSeguimiento,
  type AlarmaAutomatica,
  type GrupoSeguimiento,
} from "@/lib/crm";
import { useEstadoDemo } from "@/lib/demo/almacen";
import {
  alarmasVisibles,
  clientePorId,
  idVendedorDelRol,
  oportunidadPorId,
  personaPorId,
  seguimientosPendientes,
} from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFechaLarga, nombreCompleto, pluralizar } from "@/lib/formato";
import { cn } from "@/lib/utils";

const grupos: GrupoSeguimiento[] = ["vencido", "hoy", "semana", "proximo"];

type Registro = { idCliente: string; idOportunidad: string | null; seguimiento: Seguimiento | null };

export function VistaSeguimientos() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const esVentas = idVendedorDelRol(estado) !== null;
  const pendientes = seguimientosPendientes(estado);
  const alarmas = alarmasVisibles(estado, hoy);
  const porGrupo = Object.fromEntries(grupos.map((grupo) => [grupo, pendientes.filter((item) => grupoDeSeguimiento(item, hoy) === grupo)])) as Record<
    GrupoSeguimiento,
    Seguimiento[]
  >;
  const [registro, setRegistro] = useState<Registro | null>(null);
  const [agenda, setAgenda] = useState<{ idCliente: string; idOportunidad: string | null } | null>(null);
  const [verMasAdelante, setVerMasAdelante] = useState(false);
  const [oportunidadAbierta, setOportunidadAbierta] = useState<string | null>(null);

  return (
    <>
      <EncabezadoPagina
        titulo="Seguimientos y alarmas"
        descripcion={`${formatearFechaLarga(hoy)} · ${esVentas ? "sus clientes" : "todo el equipo comercial"}. Registre lo que hizo y agende el próximo paso desde cada aviso.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra titulo="Vencidos" valor={porGrupo.vencido.length} detalle="Seguimientos que ya pasaron de fecha" tono="peligro" />
        <Cifra titulo="Para hoy" valor={porGrupo.hoy.length} detalle="Agendados para hoy" tono="marca" />
        <Cifra titulo="Próximos 7 días" valor={porGrupo.semana.length} detalle={`${porGrupo.proximo.length} más adelante`} />
        <Cifra titulo="Alarmas automáticas" valor={alarmas.length} detalle="Oportunidades quietas y clientes sin contacto" tono={alarmas.length ? "peligro" : undefined} />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BellRing className="size-4 text-muted-foreground" />
              Seguimientos agendados
            </CardTitle>
            <CardDescription>Los que cada vendedor programó, del más urgente al más lejano.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            {pendientes.length === 0 && <p className="text-sm text-muted-foreground">No hay seguimientos pendientes.</p>}
            {grupos.map((grupo) => {
              const lista = porGrupo[grupo];
              if (lista.length === 0) return null;
              const oculto = grupo === "proximo" && !verMasAdelante;
              return (
                <section key={grupo} className="flex flex-col gap-2">
                  <h3 className={cn("text-xs font-semibold uppercase", grupo === "vencido" ? "text-destructive" : "text-muted-foreground")}>
                    {nombresGrupoSeguimiento[grupo]} ({lista.length})
                  </h3>
                  {oculto ? (
                    <Button variant="ghost" size="sm" className="w-fit" onClick={() => setVerMasAdelante(true)}>
                      Mostrar {pluralizar(lista.length, "seguimiento", "seguimientos")}
                    </Button>
                  ) : (
                    <ul className="flex flex-col divide-y rounded-lg border">
                      {lista.map((seguimiento) => {
                        const cliente = clientePorId(estado, seguimiento.idCliente);
                        const oportunidad = seguimiento.idOportunidad ? oportunidadPorId(estado, seguimiento.idOportunidad) : undefined;
                        const responsable = personaPorId(estado, seguimiento.idResponsable);
                        return (
                          <li
                            key={seguimiento.id}
                            className={cn("flex flex-col gap-2 px-3 py-2.5 sm:flex-row sm:items-center sm:justify-between", grupo === "vencido" && "bg-peligro-suave/40")}
                          >
                            <div className="min-w-0">
                              <p className="text-sm font-medium">{seguimiento.motivo}</p>
                              <p className="truncate text-xs text-muted-foreground">
                                <Link href={`/clientes/${seguimiento.idCliente}`} className="hover:underline">
                                  {cliente?.razonSocial}
                                </Link>
                                {oportunidad && (
                                  <>
                                    {" · "}
                                    <button type="button" className="hover:underline" onClick={() => setOportunidadAbierta(oportunidad.id)}>
                                      {oportunidad.titulo}
                                    </button>
                                  </>
                                )}
                                {!esVentas && responsable && ` · ${nombreCompleto(responsable)}`}
                              </p>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                              <FechaSeguimiento fecha={seguimiento.fecha} hoy={hoy} />
                              <Button
                                size="sm"
                                variant={grupo === "vencido" || grupo === "hoy" ? "default" : "outline"}
                                onClick={() => setRegistro({ idCliente: seguimiento.idCliente, idOportunidad: seguimiento.idOportunidad, seguimiento })}
                              >
                                <MessageSquarePlus />
                                Registrar
                              </Button>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Siren className="size-4 text-muted-foreground" />
              Alarmas automáticas
            </CardTitle>
            <CardDescription>
              El sistema las calcula solo: oportunidades sin actividad en {umbralesAlarmas.diasOportunidadSinActividad} días, propuestas sin
              respuesta en {umbralesAlarmas.diasPropuestaSinRespuesta} y clientes activos sin contacto en {umbralesAlarmas.diasClienteActivoSinContacto}.
              Se apagan al registrar una actividad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {alarmas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin alarmas: todo tiene movimiento reciente.</p>
            ) : (
              <ul className="flex flex-col divide-y rounded-lg border">
                {alarmas.map((alarma) => (
                  <FilaAlarma
                    key={`${alarma.tipo}-${alarma.idOportunidad ?? alarma.idCliente}`}
                    alarma={alarma}
                    mostrarResponsable={!esVentas}
                    alAbrirOportunidad={setOportunidadAbierta}
                    alRegistrar={() => setRegistro({ idCliente: alarma.idCliente, idOportunidad: alarma.idOportunidad, seguimiento: null })}
                    alAgendar={() => setAgenda({ idCliente: alarma.idCliente, idOportunidad: alarma.idOportunidad })}
                  />
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {registro && (
        <DialogoRegistrarActividad
          key={registro.seguimiento?.id ?? `${registro.idCliente}-${registro.idOportunidad}`}
          idCliente={registro.idCliente}
          idOportunidad={registro.idOportunidad}
          seguimiento={registro.seguimiento}
          abierto
          alCambiarAbierto={(abierto) => !abierto && setRegistro(null)}
        />
      )}
      {agenda && (
        <DialogoAgendarSeguimiento
          idCliente={agenda.idCliente}
          idOportunidad={agenda.idOportunidad}
          abierto
          alCambiarAbierto={(abierto) => !abierto && setAgenda(null)}
        />
      )}
      <DetalleOportunidad idOportunidad={oportunidadAbierta} alCerrar={() => setOportunidadAbierta(null)} />
    </>
  );
}

function FilaAlarma({
  alarma,
  mostrarResponsable,
  alAbrirOportunidad,
  alRegistrar,
  alAgendar,
}: {
  alarma: AlarmaAutomatica;
  mostrarResponsable: boolean;
  alAbrirOportunidad: (id: string) => void;
  alRegistrar: () => void;
  alAgendar: () => void;
}) {
  const estado = useEstadoDemo();
  const cliente = clientePorId(estado, alarma.idCliente);
  const oportunidad = alarma.idOportunidad ? oportunidadPorId(estado, alarma.idOportunidad) : undefined;
  const responsable = personaPorId(estado, alarma.idResponsable);
  return (
    <li className="flex flex-col gap-2 px-3 py-2.5">
      <div className="flex flex-wrap items-center gap-2">
        <Badge className="bg-peligro-suave text-destructive">{nombresAlarma[alarma.tipo]}</Badge>
        {mostrarResponsable && responsable && <span className="text-xs text-muted-foreground">{nombreCompleto(responsable)}</span>}
      </div>
      <p className="text-sm">
        <Link href={`/clientes/${alarma.idCliente}`} className="font-medium hover:underline">
          {cliente?.razonSocial}
        </Link>
        {oportunidad && (
          <>
            {" · "}
            <button type="button" className="hover:underline" onClick={() => alAbrirOportunidad(oportunidad.id)}>
              {oportunidad.titulo}
            </button>
          </>
        )}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-muted-foreground">{describirAlarma(alarma)}</p>
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={alAgendar}>
            <CalendarPlus />
            Agendar
          </Button>
          <Button size="sm" variant="outline" onClick={alRegistrar}>
            <MessageSquarePlus />
            Registrar
          </Button>
        </div>
      </div>
    </li>
  );
}

function Cifra({ titulo, valor, detalle, tono }: { titulo: string; valor: number; detalle: string; tono?: "peligro" | "marca" }) {
  return (
    <Card className={cn(tono === "peligro" && valor > 0 && "border-destructive/30", tono === "marca" && valor > 0 && "border-primary/30")}>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle
          className={cn(
            "font-heading text-3xl font-semibold tabular-nums",
            tono === "peligro" && valor > 0 && "text-destructive",
            tono === "marca" && valor > 0 && "text-primary",
          )}
        >
          {valor}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
