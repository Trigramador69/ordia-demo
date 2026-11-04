"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarPlus, CircleCheck, CircleX, FileCheck2, FilePlus2, MessageSquarePlus } from "lucide-react";
import { toast } from "sonner";
import { DialogoAgendarSeguimiento, DialogoPerdida, DialogoRegistrarActividad } from "@/components/crm/dialogos";
import { DialogoEmitirFactura } from "@/components/facturacion/dialogos";
import { InsigniaEtapa, iconoActividad } from "@/components/crm/insignias";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { etapasAbiertas, nombreServicio, nombresEtapa } from "@/datos/catalogos";
import type { Oportunidad } from "@/datos/tipos";
import { esAbierta, montoPonderado } from "@/lib/crm";
import { moverOportunidad } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { clientePorId, facturaDeOportunidad, oportunidadPorId, personaPorId } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearFechaRelativa, formatearMonto, nombreCompleto } from "@/lib/formato";
import { puedeVerRuta } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

export function DetalleOportunidad({ idOportunidad, alCerrar }: { idOportunidad: string | null; alCerrar: () => void }) {
  const estado = useEstadoDemo();
  const oportunidad = idOportunidad ? oportunidadPorId(estado, idOportunidad) : undefined;
  return (
    <Sheet open={oportunidad !== undefined} onOpenChange={(abierto) => !abierto && alCerrar()}>
      <SheetContent className="w-full overflow-y-auto sm:max-w-lg">{oportunidad && <Contenido oportunidad={oportunidad} />}</SheetContent>
    </Sheet>
  );
}

function Contenido({ oportunidad }: { oportunidad: Oportunidad }) {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [dialogoActividad, setDialogoActividad] = useState(false);
  const [dialogoSeguimiento, setDialogoSeguimiento] = useState(false);
  const [perdiendo, setPerdiendo] = useState<Oportunidad | null>(null);
  const cliente = clientePorId(estado, oportunidad.idCliente);
  const vendedor = personaPorId(estado, oportunidad.idVendedor);
  const abierta = esAbierta(oportunidad);
  const actividades = estado.actividades.filter((actividad) => actividad.idOportunidad === oportunidad.id).sort((a, b) => b.fecha.localeCompare(a.fecha));
  const pendientes = estado.seguimientos.filter((seguimiento) => seguimiento.idOportunidad === oportunidad.id && seguimiento.estado === "pendiente");

  function mover(etapa: (typeof etapasAbiertas)[number] | "ganada") {
    const deshacer = moverOportunidad(oportunidad.id, etapa, usuarioDelRol(estado).id);
    toast.success(etapa === "ganada" ? "Oportunidad ganada." : `Movida a ${nombresEtapa[etapa]}.`, {
      description: etapa === "ganada" && estado.modulos.facturacion ? "Ya se puede emitir su factura desde aquí." : undefined,
      action: { label: "Deshacer", onClick: deshacer },
    });
  }

  return (
    <>
      <SheetHeader>
        <div className="flex flex-wrap items-center gap-2">
          <InsigniaEtapa etapa={oportunidad.etapa} />
          {abierta && <span className="text-xs text-muted-foreground">{oportunidad.probabilidad}% de probabilidad</span>}
        </div>
        <SheetTitle className="text-lg">{oportunidad.titulo}</SheetTitle>
        <SheetDescription>
          {cliente && (
            <Link href={`/clientes/${cliente.id}`} className="font-medium text-foreground hover:underline">
              {cliente.razonSocial}
            </Link>
          )}
          {vendedor && ` · ${nombreCompleto(vendedor)}`}
        </SheetDescription>
      </SheetHeader>

      <div className="flex flex-col gap-6 px-4 pb-6">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <Dato etiqueta="Monto" valor={formatearMonto(oportunidad.monto)} destacado />
          <Dato etiqueta={abierta ? "Ponderado" : "Servicio"} valor={abierta ? formatearMonto(montoPonderado(oportunidad)) : nombreServicio(oportunidad.idServicio)} />
          <Dato etiqueta="Creada" valor={formatearFecha(oportunidad.fechaCreacion)} />
          {oportunidad.fechaCierre ? (
            <Dato etiqueta="Cerrada" valor={formatearFecha(oportunidad.fechaCierre)} />
          ) : (
            <Dato
              etiqueta="Cierre estimado"
              valor={`${formatearFecha(oportunidad.fechaCierreEstimada)}${oportunidad.fechaCierreEstimada < hoy ? " (pasó)" : ""}`}
            />
          )}
          {oportunidad.motivoPerdida && <Dato etiqueta="Motivo de la pérdida" valor={oportunidad.motivoPerdida} ancho />}
        </dl>

        {oportunidad.etapa === "ganada" && <SeccionFactura oportunidad={oportunidad} />}

        {abierta && (
          <section className="flex flex-col gap-2">
            <h3 className="text-sm font-medium">Mover a</h3>
            <div className="flex flex-wrap gap-2">
              {etapasAbiertas
                .filter((etapa) => etapa !== oportunidad.etapa)
                .map((etapa) => (
                  <Button key={etapa} variant="outline" size="sm" onClick={() => mover(etapa)}>
                    {nombresEtapa[etapa]}
                  </Button>
                ))}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button size="sm" className="bg-exito text-white hover:bg-exito/90" onClick={() => mover("ganada")}>
                <CircleCheck />
                Ganada
              </Button>
              <Button size="sm" variant="outline" className="text-destructive" onClick={() => setPerdiendo(oportunidad)}>
                <CircleX />
                Perdida
              </Button>
            </div>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-medium">Actividad</h3>
            <div className="flex gap-1">
              <Button size="sm" variant="ghost" onClick={() => setDialogoSeguimiento(true)}>
                <CalendarPlus />
                Agendar
              </Button>
              <Button size="sm" variant="outline" onClick={() => setDialogoActividad(true)}>
                <MessageSquarePlus />
                Registrar
              </Button>
            </div>
          </div>
          {pendientes.map((seguimiento) => (
            <p key={seguimiento.id} className={cn("rounded-md px-3 py-2 text-xs", seguimiento.fecha < hoy ? "bg-peligro-suave text-destructive" : "bg-marca-suave text-primary")}>
              Seguimiento {formatearFechaRelativa(seguimiento.fecha, hoy)}: {seguimiento.motivo}
            </p>
          ))}
          <ol className="relative flex flex-col gap-4 border-l pl-5">
            {actividades.map((actividad) => {
              const Icono = iconoActividad[actividad.tipo];
              return (
                <li key={actividad.id} className="relative text-sm">
                  <span className="absolute top-0 -left-[31px] flex size-5 items-center justify-center rounded-full bg-card ring-1 ring-border">
                    <Icono className="size-3 text-muted-foreground" />
                  </span>
                  <p className="text-xs text-muted-foreground">
                    {formatearFecha(actividad.fecha)} · {formatearFechaRelativa(actividad.fecha, hoy)}
                  </p>
                  <p>{actividad.descripcion}</p>
                </li>
              );
            })}
          </ol>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className="text-sm font-medium">Etapas</h3>
          <ol className="flex flex-wrap gap-x-2 gap-y-1 text-xs text-muted-foreground">
            {oportunidad.historialEtapas.map((cambio, indice) => (
              <li key={`${cambio.etapa}-${indice}`}>
                {nombresEtapa[cambio.etapa]} {formatearFecha(cambio.fecha)}
                {indice < oportunidad.historialEtapas.length - 1 && " →"}
              </li>
            ))}
          </ol>
        </section>
      </div>

      <DialogoRegistrarActividad
        idCliente={oportunidad.idCliente}
        idOportunidad={oportunidad.id}
        abierto={dialogoActividad}
        alCambiarAbierto={setDialogoActividad}
      />
      <DialogoAgendarSeguimiento
        idCliente={oportunidad.idCliente}
        idOportunidad={oportunidad.id}
        abierto={dialogoSeguimiento}
        alCambiarAbierto={setDialogoSeguimiento}
      />
      <DialogoPerdida oportunidad={perdiendo} alCerrar={() => setPerdiendo(null)} />
    </>
  );
}

// Qué pasa con la factura de una venta ganada, según el módulo de facturación.
function SeccionFactura({ oportunidad }: { oportunidad: Oportunidad }) {
  const estado = useEstadoDemo();
  const [emitiendo, setEmitiendo] = useState(false);
  const factura = facturaDeOportunidad(estado, oportunidad.id);

  if (!estado.modulos.facturacion) {
    return (
      <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
        Sin el módulo de facturación: la factura se emite en el sistema que ya usan y el ingreso se registra con un asiento manual en el
        libro diario.
      </p>
    );
  }
  if (factura) {
    return (
      <p className="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-exito-suave px-3 py-2 text-sm text-exito">
        <span className="flex items-center gap-2">
          <FileCheck2 className="size-4" />
          Facturada: N° {factura.numero} del {formatearFecha(factura.fecha)}
        </span>
        {puedeVerRuta(estado.rol, "/facturas") && (
          <Link href={`/facturas/${factura.id}`} className="font-medium underline-offset-4 hover:underline">
            Ver factura
          </Link>
        )}
      </p>
    );
  }
  if (!puedeVerRuta(estado.rol, "/facturas")) {
    return <p className="rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">Ganada y sin facturar: la factura la emite Administración.</p>;
  }
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-primary/30 bg-marca-suave px-3 py-2 text-sm">
      <span className="text-primary">Ganada y todavía sin facturar.</span>
      <Button size="sm" onClick={() => setEmitiendo(true)}>
        <FilePlus2 />
        Emitir factura
      </Button>
      <DialogoEmitirFactura idCliente={oportunidad.idCliente} idOportunidad={oportunidad.id} abierto={emitiendo} alCambiarAbierto={setEmitiendo} />
    </div>
  );
}

function Dato({ etiqueta, valor, destacado, ancho }: { etiqueta: string; valor: string; destacado?: boolean; ancho?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-0.5", ancho && "col-span-2")}>
      <dt className="text-xs text-muted-foreground">{etiqueta}</dt>
      <dd className={cn(destacado && "font-heading text-lg font-semibold")}>{valor}</dd>
    </div>
  );
}
