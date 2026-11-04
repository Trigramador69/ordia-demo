"use client";

import Link from "next/link";
import { ArrowRight, BellRing, Building2, Kanban, Users, type LucideIcon } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { nombresRol } from "@/datos/catalogos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import {
  clientePorId,
  clientesVisibles,
  oportunidadesAbiertas,
  oportunidadesVisibles,
  seguimientosPendientes,
} from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearFechaLarga, formatearMonto, pluralizar } from "@/lib/formato";
import { puedeVerRuta } from "@/lib/navegacion";

// Primera versión del inicio: indicadores generales y los seguimientos del
// día. El tablero completo (embudo, vacaciones, planilla, facturación) se arma
// cuando estén esos módulos.
export function VistaInicio() {
  const estado = useEstadoDemo();
  const { rol } = estado;
  const hoy = fechaDeHoy();
  const usuario = usuarioDelRol(estado);

  const clientes = clientesVisibles(estado);
  const activos = clientes.filter((cliente) => cliente.estado === "activo").length;
  const prospectos = clientes.filter((cliente) => cliente.estado === "prospecto").length;
  const abiertas = oportunidadesAbiertas(oportunidadesVisibles(estado));
  const montoAbierto = abiertas.reduce((suma, oportunidad) => suma + oportunidad.monto, 0);
  const pendientes = seguimientosPendientes(estado);
  const deHoy = pendientes.filter((seguimiento) => seguimiento.fecha === hoy);
  const vencidos = pendientes.filter((seguimiento) => seguimiento.fecha < hoy);
  const urgentes = [...vencidos, ...deHoy];
  const verCrm = puedeVerRuta(rol, "/seguimientos");

  return (
    <>
      <EncabezadoPagina
        titulo={`Hola, ${usuario.nombres.split(" ")[0]}`}
        descripcion={`${formatearFechaLarga(hoy)} · Vista de ${nombresRol[rol]}`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {puedeVerRuta(rol, "/personal") && (
          <Indicador titulo="Equipo" valor={estado.personas.length} detalle="personas en planilla" icono={Users} ruta="/personal" />
        )}
        {verCrm && (
          <>
            <Indicador
              titulo={rol === "ventas" ? "Mis clientes" : "Clientes"}
              valor={clientes.length}
              detalle={`${activos} activos · ${pluralizar(prospectos, "prospecto", "prospectos")}`}
              icono={Building2}
              ruta="/clientes"
            />
            <Indicador
              titulo="Oportunidades abiertas"
              valor={abiertas.length}
              detalle={`${formatearMonto(montoAbierto)} en el embudo`}
              icono={Kanban}
              ruta="/embudo"
            />
            <Indicador
              titulo="Seguimientos de hoy"
              valor={deHoy.length}
              detalle={pluralizar(vencidos.length, "vencido", "vencidos")}
              icono={BellRing}
              ruta="/seguimientos"
            />
          </>
        )}
      </div>

      {verCrm && (
        <Card className="max-w-3xl">
          <CardHeader>
            <CardTitle>Seguimientos vencidos y de hoy</CardTitle>
            <CardDescription>
              {urgentes.length === 0 ? "No hay seguimientos pendientes para hoy." : "Llamadas, visitas y envíos que no pueden esperar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col divide-y">
            {urgentes.map((seguimiento) => {
              const cliente = clientePorId(estado, seguimiento.idCliente);
              const vencido = seguimiento.fecha < hoy;
              return (
                <div key={seguimiento.id} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{seguimiento.motivo}</p>
                    <p className="truncate text-xs text-muted-foreground">{cliente?.razonSocial}</p>
                  </div>
                  <Badge className={vencido ? "shrink-0 bg-peligro-suave text-destructive" : "shrink-0 bg-marca-suave text-primary"}>
                    {vencido ? `Vencido el ${formatearFecha(seguimiento.fecha)}` : "Hoy"}
                  </Badge>
                </div>
              );
            })}
          </CardContent>
        </Card>
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
}: {
  titulo: string;
  valor: React.ReactNode;
  detalle: string;
  icono: LucideIcon;
  ruta: string;
}) {
  return (
    <Link href={ruta} className="group min-w-0 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring">
      <Card className="h-full transition-colors group-hover:border-primary/40">
        <CardHeader>
          <CardDescription className="flex items-center justify-between gap-2">
            <span>{titulo}</span>
            <Icono className="size-4" />
          </CardDescription>
          <CardTitle className="font-heading text-3xl font-semibold tabular-nums">{valor}</CardTitle>
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
