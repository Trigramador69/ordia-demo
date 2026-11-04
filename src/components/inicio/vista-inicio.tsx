"use client";

import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CircleCheck,
  FileText,
  Kanban,
  ListChecks,
  TrendingUp,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { FechaSeguimiento } from "@/components/crm/insignias";
import { BarrasHorizontales } from "@/components/graficos/barras";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { InsigniaAusencia } from "@/components/rrhh/insignias";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nombresEtapa, nombresRol } from "@/datos/catalogos";
import { diasDeCredito } from "@/datos/facturacion-inicial";
import { diferenciaEnDias, mesDeFecha } from "@/datos/fechas";
import { montoPorEtapa } from "@/lib/ciclo-ventas";
import { esAbierta, nombresAlarma } from "@/lib/crm";
import { useEstadoDemo } from "@/lib/demo/almacen";
import {
  alarmasVisibles,
  ausenciaEnFecha,
  clientePorId,
  facturaDeOportunidad,
  facturasConSituacion,
  oportunidadesVisibles,
  planillaDelMes,
  seguimientosPendientes,
  ultimoMesDepreciado,
} from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFechaLarga, formatearMes, formatearMonto, nombreCompleto, pluralizar } from "@/lib/formato";
import { puedeVerRuta } from "@/lib/navegacion";
import { cn } from "@/lib/utils";

function montoCorto(monto: number) {
  if (monto >= 1_000_000) return `Bs ${(monto / 1_000_000).toLocaleString("es-BO", { maximumFractionDigits: 1 })} M`;
  if (monto >= 1000) return `Bs ${Math.round(monto / 1000).toLocaleString("es-BO")} mil`;
  return formatearMonto(monto);
}

export function VistaInicio() {
  const estado = useEstadoDemo();
  const { rol } = estado;
  const hoy = fechaDeHoy();
  const mes = mesDeFecha(hoy);
  const usuario = usuarioDelRol(estado);
  const verCrm = puedeVerRuta(rol, "/seguimientos");
  const verRrhh = puedeVerRuta(rol, "/vacaciones");
  const verFacturas = puedeVerRuta(rol, "/facturas") && estado.modulos.facturacion;

  // CRM
  const pendientes = seguimientosPendientes(estado);
  const urgentes = pendientes.filter((seguimiento) => seguimiento.fecha <= hoy);
  const alarmas = alarmasVisibles(estado, hoy);
  const oportunidades = oportunidadesVisibles(estado);
  const abiertas = oportunidades.filter(esAbierta);
  const ganadasMes = oportunidades.filter((oportunidad) => oportunidad.etapa === "ganada" && oportunidad.fechaCierre?.startsWith(mes));

  // Recursos humanos
  const fueraHoy = estado.personas.flatMap((persona) => {
    const ausencia = ausenciaEnFecha(estado, persona.id, hoy);
    return ausencia ? [{ persona, ausencia }] : [];
  });
  const solicitudesPendientes = estado.solicitudesVacacion.filter((solicitud) => solicitud.estado === "pendiente");
  const planilla = planillaDelMes(estado, mes);

  // Facturación y contabilidad
  const facturas = facturasConSituacion(estado);
  const porCobrar = facturas.reduce((suma, fila) => suma + fila.saldo, 0);
  const vencidas = facturas.filter((fila) => fila.saldo > 0 && diferenciaEnDias(fila.factura.fecha, hoy) > diasDeCredito);
  const facturadoMes = facturas.filter((fila) => fila.factura.estado === "vigente" && fila.factura.fecha.startsWith(mes)).reduce((suma, fila) => suma + fila.factura.total, 0);
  const ganadasSinFacturar = estado.oportunidades.filter(
    (oportunidad) => oportunidad.etapa === "ganada" && oportunidad.fechaCierre && diferenciaEnDias(oportunidad.fechaCierre, hoy) <= 60 && !facturaDeOportunidad(estado, oportunidad.id),
  );
  const depreciacionPendiente = ultimoMesDepreciado(estado) < mes;

  // Pendientes de administración del mes, con su enlace.
  const tareas = [
    ...(solicitudesPendientes.length > 0 && verRrhh
      ? [{ texto: `${pluralizar(solicitudesPendientes.length, "solicitud de vacaciones", "solicitudes de vacaciones")} por aprobar`, ruta: "/vacaciones", urgente: rol === "gerente" }]
      : []),
    ...(planilla.cerrada === null && puedeVerRuta(rol, "/planilla") ? [{ texto: `Cerrar la planilla de ${formatearMes(mes).toLowerCase()}`, ruta: "/planilla", urgente: false }] : []),
    ...(depreciacionPendiente && puedeVerRuta(rol, "/depreciacion") ? [{ texto: `Registrar la depreciación de ${formatearMes(mes).toLowerCase()}`, ruta: "/depreciacion", urgente: false }] : []),
    ...(verFacturas && vencidas.length > 0 ? [{ texto: `Cobrar ${pluralizar(vencidas.length, "factura vencida", "facturas vencidas")}`, ruta: "/cobros", urgente: true }] : []),
    ...(verFacturas && ganadasSinFacturar.length > 0
      ? [{ texto: `Facturar ${pluralizar(ganadasSinFacturar.length, "venta ganada", "ventas ganadas")}`, ruta: "/facturas", urgente: false }]
      : []),
  ];

  return (
    <>
      <EncabezadoPagina titulo={`Hola, ${usuario.nombres.split(" ")[0]}`} descripcion={`${formatearFechaLarga(hoy)} · Vista de ${nombresRol[rol]}`} />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {verCrm && (
          <Indicador
            titulo="Seguimientos para hoy"
            valor={String(pendientes.filter((seguimiento) => seguimiento.fecha === hoy).length)}
            detalle={`${pluralizar(urgentes.length - pendientes.filter((seguimiento) => seguimiento.fecha === hoy).length, "vencido", "vencidos")} · ${pluralizar(alarmas.length, "alarma", "alarmas")}`}
            icono={BellRing}
            ruta="/seguimientos"
            alerta={urgentes.length + alarmas.length > 0}
          />
        )}
        {verCrm && (
          <Indicador
            titulo={rol === "ventas" ? "Mis ventas del mes" : "Ventas del mes"}
            valor={formatearMonto(ganadasMes.reduce((suma, oportunidad) => suma + oportunidad.monto, 0))}
            detalle={pluralizar(ganadasMes.length, "oportunidad ganada", "oportunidades ganadas")}
            icono={TrendingUp}
            ruta={puedeVerRuta(rol, "/ciclo-ventas") ? "/ciclo-ventas" : "/embudo"}
          />
        )}
        {verCrm && (
          <Indicador
            titulo={rol === "ventas" ? "Mi embudo" : "En el embudo"}
            valor={montoCorto(abiertas.reduce((suma, oportunidad) => suma + oportunidad.monto, 0))}
            detalle={pluralizar(abiertas.length, "oportunidad abierta", "oportunidades abiertas")}
            icono={Kanban}
            ruta="/embudo"
          />
        )}
        {verRrhh && (
          <Indicador
            titulo="Fuera hoy"
            valor={String(fueraHoy.length)}
            detalle={solicitudesPendientes.length > 0 ? pluralizar(solicitudesPendientes.length, "solicitud por aprobar", "solicitudes por aprobar") : "Sin solicitudes pendientes"}
            icono={CalendarDays}
            ruta="/vacaciones"
          />
        )}
        {verRrhh && (
          <Indicador
            titulo={`Planilla de ${formatearMes(mes).toLowerCase()}`}
            valor={formatearMonto(Math.round(planilla.totales.liquidoPagable))}
            detalle={planilla.cerrada ? "Cerrada" : "Por cerrar · líquido pagable"}
            icono={Wallet}
            ruta="/planilla"
          />
        )}
        {verFacturas && (
          <Indicador
            titulo="Facturado este mes"
            valor={formatearMonto(facturadoMes)}
            detalle={`Por cobrar ${formatearMonto(porCobrar)}${vencidas.length ? ` · ${pluralizar(vencidas.length, "vencida", "vencidas")}` : ""}`}
            icono={FileText}
            ruta="/facturas"
            alerta={vencidas.length > 0}
          />
        )}
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        {verCrm && (
          <Card>
            <CardHeader>
              <CardTitle>Para hoy y vencido</CardTitle>
              <CardDescription>
                {urgentes.length === 0 ? "No hay seguimientos para hoy." : "Seguimientos agendados que no pueden esperar."}
                {alarmas.length > 0 && ` Además, ${pluralizar(alarmas.length, "alarma automática", "alarmas automáticas")}.`}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {urgentes.slice(0, 6).map((seguimiento) => (
                <Link key={seguimiento.id} href={`/clientes/${seguimiento.idCliente}`} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 hover:underline-offset-4">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{seguimiento.motivo}</span>
                    <span className="block truncate text-xs text-muted-foreground">{clientePorId(estado, seguimiento.idCliente)?.razonSocial}</span>
                  </span>
                  <FechaSeguimiento fecha={seguimiento.fecha} hoy={hoy} className="shrink-0" />
                </Link>
              ))}
              {alarmas.slice(0, 3).map((alarma) => (
                <Link key={`${alarma.tipo}-${alarma.idOportunidad ?? alarma.idCliente}`} href={`/clientes/${alarma.idCliente}`} className="flex items-center justify-between gap-4 py-2.5 last:pb-0">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{nombresAlarma[alarma.tipo]}</span>
                    <span className="block truncate text-xs text-muted-foreground">{clientePorId(estado, alarma.idCliente)?.razonSocial}</span>
                  </span>
                  <Badge className="shrink-0 bg-peligro-suave text-destructive">{alarma.dias} días</Badge>
                </Link>
              ))}
              <Link href="/seguimientos" className="flex items-center gap-1 pt-3 text-sm text-primary">
                Ver todos los seguimientos <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}

        {verCrm && (
          <Card>
            <CardHeader>
              <CardTitle>{rol === "ventas" ? "Mi embudo" : "Embudo de ventas"}</CardTitle>
              <CardDescription>Monto abierto en cada etapa.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <BarrasHorizontales
                descripcion="Monto abierto por etapa"
                filas={montoPorEtapa(abiertas).map((item) => ({
                  clave: item.etapa,
                  etiqueta: nombresEtapa[item.etapa],
                  valor: item.monto,
                  textoValor: `${montoCorto(item.monto)} · ${item.cantidad}`,
                  detalle: pluralizar(item.cantidad, "oportunidad", "oportunidades"),
                }))}
              />
              <Link href="/embudo" className="flex items-center gap-1 text-sm text-primary">
                Ir al embudo <ArrowRight className="size-3.5" />
              </Link>
            </CardContent>
          </Card>
        )}

        {verRrhh && (
          <Card>
            <CardHeader>
              <CardTitle>Quién está fuera hoy</CardTitle>
              <CardDescription>{fueraHoy.length === 0 ? "Todo el equipo está en la oficina." : "Vacaciones, permisos y días libres."}</CardDescription>
            </CardHeader>
            {fueraHoy.length > 0 && (
              <CardContent className="flex flex-col divide-y">
                {fueraHoy.map(({ persona, ausencia }) => (
                  <Link key={persona.id} href={`/personal/${persona.id}`} className="flex items-center justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{nombreCompleto(persona)}</span>
                      <span className="block truncate text-xs text-muted-foreground">{ausencia.detalle}</span>
                    </span>
                    <InsigniaAusencia tipo={ausencia.tipo} className="shrink-0" />
                  </Link>
                ))}
              </CardContent>
            )}
          </Card>
        )}

        {tareas.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ListChecks className="size-4 text-muted-foreground" />
                Pendientes del mes
              </CardTitle>
              <CardDescription>Lo que falta en recursos humanos, contabilidad y facturación.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col divide-y">
              {tareas.map((tarea) => (
                <Link key={tarea.texto} href={tarea.ruta} className="group flex items-center justify-between gap-4 py-2.5 text-sm first:pt-0 last:pb-0">
                  <span className="flex items-center gap-2">
                    <span className={cn("size-2 rounded-full", tarea.urgente ? "bg-destructive" : "bg-advertencia")} />
                    {tarea.texto}
                  </span>
                  <ArrowRight className="size-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                </Link>
              ))}
            </CardContent>
          </Card>
        )}

        {tareas.length === 0 && !verCrm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CircleCheck className="size-4 text-exito" />
                Todo al día
              </CardTitle>
              <CardDescription>No hay pendientes de administración este mes.</CardDescription>
            </CardHeader>
          </Card>
        )}
      </div>

      {rol === "ventas" && (
        <p className="text-sm text-muted-foreground">
          Sus vacaciones y días libres están en{" "}
          <Link href="/mis-vacaciones" className="text-primary underline-offset-4 hover:underline">
            Mis vacaciones
          </Link>
          .
        </p>
      )}
    </>
  );
}

function Indicador({
  titulo,
  valor,
  detalle,
  icono: Icono,
  ruta,
  alerta,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  icono: LucideIcon;
  ruta: string;
  alerta?: boolean;
}) {
  return (
    <Link href={ruta} className="group min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className={cn("h-full transition-colors group-hover:border-primary/40", alerta && "border-destructive/30")}>
        <CardHeader>
          <CardDescription className="flex items-center justify-between gap-2">
            <span>{titulo}</span>
            <Icono className="size-4" />
          </CardDescription>
          <CardTitle className="font-heading text-2xl font-semibold tabular-nums">{valor}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="flex items-center gap-1 text-xs text-muted-foreground">
            {detalle}
            <ArrowRight className="size-3 opacity-0 transition-opacity group-hover:opacity-100" />
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
