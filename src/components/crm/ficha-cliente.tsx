"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowLeft, CalendarPlus, CircleAlert, MessageSquarePlus, Plus } from "lucide-react";
import { DetalleOportunidad } from "@/components/crm/detalle-oportunidad";
import { DialogoAgendarSeguimiento, DialogoNuevaOportunidad, DialogoRegistrarActividad } from "@/components/crm/dialogos";
import { FechaSeguimiento, InsigniaEstadoCliente, InsigniaEtapa, iconoActividad } from "@/components/crm/insignias";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nombresOrigenCliente, nombresTipoActividad } from "@/datos/catalogos";
import type { Cliente, Seguimiento } from "@/datos/tipos";
import { describirAlarma, esAbierta, nombresAlarma } from "@/lib/crm";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { alarmasVisibles, oportunidadPorId, personaPorId, puedeVerCliente } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearFechaRelativa, formatearMonto, nombreCompleto, pluralizar } from "@/lib/formato";
import { cn } from "@/lib/utils";

export function FichaCliente() {
  const { idCliente } = useParams<{ idCliente: string }>();
  const filtrosDeOrigen = useSearchParams().get("filtros");
  const estado = useEstadoDemo();
  const cliente = estado.clientes.find((item) => item.id === idCliente);
  const enlaceVolver = `/clientes${filtrosDeOrigen ? `?${filtrosDeOrigen}` : ""}`;

  if (!cliente || !puedeVerCliente(estado, cliente)) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold">{cliente ? "Este cliente no está en su cartera" : "No encontramos este cliente"}</h1>
        <Button variant="outline" nativeButton={false} render={<Link href="/clientes" />}>
          Volver a los clientes
        </Button>
      </div>
    );
  }
  return <Contenido cliente={cliente} enlaceVolver={enlaceVolver} />;
}

function Contenido({ cliente, enlaceVolver }: { cliente: Cliente; enlaceVolver: string }) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [registro, setRegistro] = useState<{ seguimiento: Seguimiento | null } | null>(null);
  const [agendar, setAgendar] = useState(false);
  const [nuevaOportunidad, setNuevaOportunidad] = useState(false);
  const [oportunidadAbierta, setOportunidadAbierta] = useState<string | null>(null);

  const vendedor = personaPorId(estado, cliente.idVendedor);
  const contactos = estado.contactos.filter((contacto) => contacto.idCliente === cliente.id);
  const oportunidades = estado.oportunidades
    .filter((oportunidad) => oportunidad.idCliente === cliente.id)
    .sort((a, b) => Number(esAbierta(b)) - Number(esAbierta(a)) || (b.fechaCierre ?? b.fechaCreacion).localeCompare(a.fechaCierre ?? a.fechaCreacion));
  const pendientes = estado.seguimientos
    .filter((seguimiento) => seguimiento.idCliente === cliente.id && seguimiento.estado === "pendiente")
    .sort((a, b) => a.fecha.localeCompare(b.fecha));
  const actividades = estado.actividades.filter((actividad) => actividad.idCliente === cliente.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const alarmas = alarmasVisibles(estado, hoy).filter((alarma) => alarma.idCliente === cliente.id);
  const ganado = oportunidades.filter((oportunidad) => oportunidad.etapa === "ganada").reduce((suma, oportunidad) => suma + oportunidad.monto, 0);
  const abierto = oportunidades.filter(esAbierta).reduce((suma, oportunidad) => suma + oportunidad.monto, 0);

  return (
    <>
      <div>
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href={enlaceVolver} />}>
          <ArrowLeft />
          Clientes
        </Button>
      </div>

      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-heading text-2xl font-semibold tracking-tight">{cliente.razonSocial}</h1>
            <InsigniaEstadoCliente estado={cliente.estado} />
          </div>
          <p className="text-sm text-muted-foreground">
            {cliente.rubro} · {cliente.ciudad}
            {vendedor && ` · a cargo de ${nombreCompleto(vendedor)}`}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setAgendar(true)}>
            <CalendarPlus />
            Agendar seguimiento
          </Button>
          <Button onClick={() => setRegistro({ seguimiento: null })}>
            <MessageSquarePlus />
            Registrar actividad
          </Button>
        </div>
      </div>

      {alarmas.map((alarma) => (
        <div key={`${alarma.tipo}-${alarma.idOportunidad}`} className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-peligro-suave px-4 py-3 text-sm">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-destructive" />
          <p>
            <span className="font-medium text-destructive">{nombresAlarma[alarma.tipo]}</span>
            {alarma.idOportunidad && ` · ${oportunidadPorId(estado, alarma.idOportunidad)?.titulo}`}. {describirAlarma(alarma)}
          </p>
        </div>
      ))}

      <div className="grid items-start gap-6 lg:grid-cols-[18rem_1fr]">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Datos</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="flex flex-col gap-3 text-sm">
                <Dato etiqueta="NIT" valor={cliente.nit} />
                <Dato etiqueta="Dirección" valor={cliente.direccion} />
                <Dato etiqueta="Teléfono" valor={cliente.telefono} />
                <Dato etiqueta="Cómo llegó" valor={nombresOrigenCliente[cliente.origen]} />
                <Dato etiqueta="Cliente desde" valor={formatearFecha(cliente.fechaAlta)} />
                <Dato etiqueta="Vendido en total" valor={ganado > 0 ? formatearMonto(ganado) : "Todavía nada"} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Contactos</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {contactos.map((contacto) => (
                <div key={contacto.id} className="flex flex-col gap-0.5 py-3 text-sm first:pt-0 last:pb-0">
                  <span className="font-medium">
                    {contacto.nombre}
                    {contacto.principal && <span className="ml-2 text-xs font-normal text-muted-foreground">principal</span>}
                  </span>
                  <span className="text-xs text-muted-foreground">{contacto.cargo}</span>
                  <span>{contacto.telefono}</span>
                  <span className="break-all text-muted-foreground">{contacto.correo}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Seguimientos pendientes</CardTitle>
              <CardDescription>{pendientes.length === 0 ? "Nada agendado. Conviene dejar el próximo paso." : pluralizar(pendientes.length, "seguimiento", "seguimientos")}</CardDescription>
            </CardHeader>
            {pendientes.length > 0 && (
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {pendientes.map((seguimiento) => (
                    <li key={seguimiento.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 first:pt-0 last:pb-0">
                      <span className="flex flex-col">
                        <span className="text-sm font-medium">{seguimiento.motivo}</span>
                        {seguimiento.idOportunidad && <span className="text-xs text-muted-foreground">{oportunidadPorId(estado, seguimiento.idOportunidad)?.titulo}</span>}
                      </span>
                      <span className="flex items-center gap-2">
                        <FechaSeguimiento fecha={seguimiento.fecha} hoy={hoy} />
                        <Button size="sm" variant="outline" onClick={() => setRegistro({ seguimiento })}>
                          Registrar
                        </Button>
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Oportunidades</CardTitle>
              <CardDescription>
                {oportunidades.length === 0 ? "Todavía no tiene oportunidades." : `${formatearMonto(abierto)} abiertos · ${formatearMonto(ganado)} ganados`}
              </CardDescription>
              <CardAction>
                <Button variant="outline" size="sm" onClick={() => setNuevaOportunidad(true)}>
                  <Plus />
                  Nueva
                </Button>
              </CardAction>
            </CardHeader>
            {oportunidades.length > 0 && (
              <CardContent>
                <ul className="flex flex-col divide-y">
                  {oportunidades.map((oportunidad) => (
                    <li key={oportunidad.id}>
                      <button
                        type="button"
                        onClick={() => setOportunidadAbierta(oportunidad.id)}
                        className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md py-2.5 text-left text-sm outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                      >
                        <span className="flex flex-col">
                          <span className="font-medium">{oportunidad.titulo}</span>
                          <span className="text-xs text-muted-foreground">
                            {oportunidad.fechaCierre ? `Cerrada el ${formatearFecha(oportunidad.fechaCierre)}` : `Cierre estimado ${formatearFecha(oportunidad.fechaCierreEstimada)}`}
                          </span>
                        </span>
                        <span className="flex items-center gap-2">
                          <span className="tabular-nums">{formatearMonto(oportunidad.monto)}</span>
                          <InsigniaEtapa etapa={oportunidad.etapa} />
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Historial de actividad</CardTitle>
              <CardDescription>{pluralizar(actividades.length, "registro", "registros")} de llamadas, reuniones, correos y notas.</CardDescription>
            </CardHeader>
            <CardContent>
              <ol className="relative flex flex-col gap-4 border-l pl-6">
                {actividades.map((actividad) => {
                  const Icono = iconoActividad[actividad.tipo];
                  const autor = personaPorId(estado, actividad.idAutor);
                  const oportunidad = actividad.idOportunidad ? oportunidadPorId(estado, actividad.idOportunidad) : undefined;
                  return (
                    <li key={actividad.id} className="relative text-sm">
                      <span className="absolute top-0 -left-[35px] flex size-6 items-center justify-center rounded-full bg-card ring-1 ring-border">
                        <Icono className="size-3.5 text-muted-foreground" />
                      </span>
                      <p className="text-xs text-muted-foreground">
                        {nombresTipoActividad[actividad.tipo]} · {formatearFecha(actividad.fecha)} ({formatearFechaRelativa(actividad.fecha, hoy)})
                        {autor && ` · ${autor.nombres.split(" ")[0]}`}
                      </p>
                      <p className={cn(oportunidad && "mb-0.5")}>{actividad.descripcion}</p>
                      {oportunidad && <p className="text-xs text-muted-foreground">{oportunidad.titulo}</p>}
                    </li>
                  );
                })}
              </ol>
            </CardContent>
          </Card>
        </div>
      </div>

      {registro && (
        <DialogoRegistrarActividad
          key={registro.seguimiento?.id ?? "nueva"}
          idCliente={cliente.id}
          seguimiento={registro.seguimiento}
          abierto
          alCambiarAbierto={(abierto) => !abierto && setRegistro(null)}
        />
      )}
      <DialogoAgendarSeguimiento idCliente={cliente.id} abierto={agendar} alCambiarAbierto={setAgendar} />
      <DialogoNuevaOportunidad idClienteFijo={cliente.id} abierto={nuevaOportunidad} alCambiarAbierto={setNuevaOportunidad} />
      <DetalleOportunidad idOportunidad={oportunidadAbierta} alCerrar={() => setOportunidadAbierta(null)} />
    </>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className="wrap-break-word">{valor}</dd>
    </div>
  );
}
