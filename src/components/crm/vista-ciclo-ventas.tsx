"use client";

import { useState } from "react";
import Link from "next/link";
import { DetalleOportunidad } from "@/components/crm/detalle-oportunidad";
import { BarrasHorizontales, ColumnasPorPeriodo, TablaDelGrafico } from "@/components/graficos/barras";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nombresEtapa } from "@/datos/catalogos";
import { idsVendedores } from "@/datos/equipo";
import { nombresMeses } from "@/datos/meses";
import {
  conversionEntreEtapas,
  diasPorEtapa,
  inicioDelPeriodo,
  montoPorEtapa,
  motivosDePerdida,
  resultadosDelPeriodo,
  resultadosPorVendedor,
  ventasPorMes,
} from "@/lib/ciclo-ventas";
import { alarmasAutomaticas, esAbierta, nombresAlarma } from "@/lib/crm";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { clientePorId, oportunidadPorId, personaPorId } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearMonto, nombreCompleto, pluralizar } from "@/lib/formato";
import { useFiltroUrl } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

const periodos = { "3": "Últimos 3 meses", "6": "Últimos 6 meses", "12": "Últimos 12 meses" } as const;
type Periodo = keyof typeof periodos;

function montoCorto(monto: number) {
  if (monto >= 1_000_000) return `Bs ${(monto / 1_000_000).toLocaleString("es-BO", { maximumFractionDigits: 1 })} M`;
  if (monto >= 1000) return `Bs ${Math.round(monto / 1000).toLocaleString("es-BO")} mil`;
  return formatearMonto(monto);
}

const porcentaje = (valor: number | null) => (valor === null ? "-" : `${Math.round(valor)}%`);
const dias = (valor: number | null) => (valor === null ? "-" : `${Math.round(valor)} días`);

export function VistaCicloVentas() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [periodo, setPeriodo] = useFiltroUrl<Periodo>("periodo", "6", Object.keys(periodos) as Periodo[]);
  const [oportunidadAbierta, setOportunidadAbierta] = useState<string | null>(null);
  const meses = Number(periodo);
  const desde = inicioDelPeriodo(hoy, meses);

  const abiertas = estado.oportunidades.filter(esAbierta);
  const porEtapa = montoPorEtapa(abiertas);
  const conversion = conversionEntreEtapas(estado.oportunidades, desde);
  const duracion = diasPorEtapa(estado.oportunidades, desde);
  const resultados = resultadosDelPeriodo(estado.oportunidades, desde);
  const porMes = ventasPorMes(estado.oportunidades, hoy, meses);
  const motivos = motivosDePerdida(estado.oportunidades, desde);
  const vendedores = resultadosPorVendedor(estado, idsVendedores, desde, hoy);
  const estancadas = alarmasAutomaticas(estado, hoy).filter((alarma) => alarma.idOportunidad !== null);
  const etiquetaMes = (mes: string) => `${nombresMeses[Number(mes.slice(5)) - 1].slice(0, 3)} ${mes.slice(2, 4)}`;

  return (
    <>
      <EncabezadoPagina
        titulo="Control del ciclo de ventas"
        descripcion={`Del ${formatearFecha(desde)} a hoy: cómo avanzan las oportunidades por el embudo, cuánto tardan en cerrarse y cómo le va a cada vendedor.`}
        acciones={<SelectorSimple opciones={periodos} valor={periodo} alCambiar={setPeriodo} className="w-48" />}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra titulo="Ganado en el periodo" valor={formatearMonto(resultados.montoGanado)} detalle={pluralizar(resultados.ganadas, "venta", "ventas")} />
        <Cifra titulo="Tasa de cierre" valor={porcentaje(resultados.tasaDeCierre)} detalle={`${resultados.ganadas} ganadas de ${resultados.ganadas + resultados.perdidas} cerradas`} />
        <Cifra titulo="Ciclo promedio" valor={dias(resultados.cicloPromedio)} detalle="De crear la oportunidad a ganarla" />
        <Cifra titulo="Venta promedio" valor={resultados.ticketPromedio === null ? "-" : formatearMonto(Math.round(resultados.ticketPromedio))} detalle="Monto medio de lo ganado" />
      </div>

      <div className="grid items-start gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monto en cada etapa, hoy</CardTitle>
            <CardDescription>
              {formatearMonto(porEtapa.reduce((suma, item) => suma + item.monto, 0))} abiertos; ponderado por probabilidad,{" "}
              {formatearMonto(Math.round(porEtapa.reduce((suma, item) => suma + item.ponderado, 0)))}.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <BarrasHorizontales
              descripcion="Monto abierto por etapa del embudo"
              filas={porEtapa.map((item) => ({
                clave: item.etapa,
                etiqueta: nombresEtapa[item.etapa],
                valor: item.monto,
                textoValor: `${montoCorto(item.monto)} · ${item.cantidad}`,
                detalle: `${pluralizar(item.cantidad, "oportunidad", "oportunidades")}, ponderado ${formatearMonto(Math.round(item.ponderado))}`,
              }))}
            />
            <TablaDelGrafico
              encabezados={["Etapa", "Oportunidades", "Monto (Bs)", "Ponderado (Bs)"]}
              filas={porEtapa.map((item) => [nombresEtapa[item.etapa], item.cantidad, item.monto.toLocaleString("es-BO"), Math.round(item.ponderado).toLocaleString("es-BO")])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Conversión entre etapas</CardTitle>
            <CardDescription>De las {conversion[0].cantidad} oportunidades creadas en el periodo, cuántas llegaron a cada etapa.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <BarrasHorizontales
              descripcion="Oportunidades que llegaron a cada etapa"
              filas={conversion.map((item, indice) => ({
                clave: item.etapa,
                etiqueta: nombresEtapa[item.etapa],
                valor: item.cantidad,
                textoValor: indice === 0 ? String(item.cantidad) : `${item.cantidad} · ${porcentaje(item.desdeAnterior)}`,
                detalle:
                  indice === 0
                    ? "creadas en el periodo"
                    : `${porcentaje(item.desdeAnterior)} de las que estaban en ${nombresEtapa[conversion[indice - 1].etapa].toLowerCase()}`,
              }))}
            />
            <dl className="grid grid-cols-2 gap-x-6 gap-y-1 border-t pt-3 text-xs sm:grid-cols-4">
              {duracion.map((item) => (
                <div key={item.etapa} className="flex flex-col">
                  <dt className="text-muted-foreground">En {nombresEtapa[item.etapa].toLowerCase()}</dt>
                  <dd className="font-medium tabular-nums">{dias(item.dias)}</dd>
                </div>
              ))}
            </dl>
            <TablaDelGrafico
              encabezados={["Etapa", "Llegaron", "Del anterior", "Días en la etapa"]}
              filas={conversion.map((item) => [
                nombresEtapa[item.etapa],
                item.cantidad,
                porcentaje(item.desdeAnterior),
                dias(duracion.find((fila) => fila.etapa === item.etapa)?.dias ?? null),
              ])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Ventas ganadas por mes</CardTitle>
            <CardDescription>Monto de las oportunidades ganadas, por mes de cierre.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ColumnasPorPeriodo
              descripcion="Monto ganado por mes"
              formatoEje={(valor) => (valor === 0 ? "0" : montoCorto(valor).replace("Bs ", ""))}
              columnas={porMes.map((item) => ({
                clave: item.mes,
                etiqueta: etiquetaMes(item.mes),
                valor: item.monto,
                textoValor: montoCorto(item.monto),
                detalle: pluralizar(item.cantidad, "venta", "ventas"),
              }))}
            />
            <TablaDelGrafico
              encabezados={["Mes", "Ventas", "Monto (Bs)"]}
              filas={porMes.map((item) => [etiquetaMes(item.mes), item.cantidad, item.monto.toLocaleString("es-BO")])}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por qué se pierden</CardTitle>
            <CardDescription>{pluralizar(resultados.perdidas, "oportunidad perdida", "oportunidades perdidas")} en el periodo.</CardDescription>
          </CardHeader>
          <CardContent>
            {motivos.length === 0 ? (
              <p className="text-sm text-muted-foreground">No se perdió ninguna oportunidad en el periodo.</p>
            ) : (
              <BarrasHorizontales
                descripcion="Oportunidades perdidas por motivo"
                filas={motivos.map((item) => ({ clave: item.motivo, etiqueta: item.motivo, valor: item.cantidad, textoValor: String(item.cantidad) }))}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Resultados por vendedor</CardTitle>
          <CardDescription>Lo ganado y perdido en el periodo; lo abierto, las alarmas y los seguimientos vencidos, a hoy.</CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Vendedor</TableHead>
              <TableHead className="text-right">Ganado</TableHead>
              <TableHead className="hidden text-right md:table-cell">Tasa de cierre</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Ciclo promedio</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Abierto</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Actividades (30 días)</TableHead>
              <TableHead className="pr-6 text-right">Pendientes</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {vendedores.map((fila) => {
              const persona = personaPorId(estado, fila.idVendedor);
              return (
                <TableRow key={fila.idVendedor}>
                  <TableCell className="pl-6 font-medium">{persona ? nombreCompleto(persona) : fila.idVendedor}</TableCell>
                  <TableCell className="text-right tabular-nums">
                    {formatearMonto(fila.montoGanado)}
                    <span className="block text-xs text-muted-foreground">{pluralizar(fila.ganadas, "venta", "ventas")}</span>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums md:table-cell">
                    {porcentaje(fila.tasaDeCierre)}
                    <span className="block text-xs text-muted-foreground">{fila.perdidas} perdidas</span>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{dias(fila.cicloPromedio)}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatearMonto(fila.montoAbierto)}
                    <span className="block text-xs text-muted-foreground">{pluralizar(fila.abiertas, "oportunidad", "oportunidades")}</span>
                  </TableCell>
                  <TableCell className="hidden text-right tabular-nums lg:table-cell">{fila.actividades30Dias}</TableCell>
                  <TableCell className="pr-6 text-right">
                    <span className="flex flex-col items-end gap-1">
                      {fila.alarmas > 0 && <Badge className="bg-peligro-suave text-destructive">{pluralizar(fila.alarmas, "alarma", "alarmas")}</Badge>}
                      {fila.seguimientosVencidos > 0 && (
                        <Badge className="bg-advertencia-suave text-advertencia">{pluralizar(fila.seguimientosVencidos, "vencido", "vencidos")}</Badge>
                      )}
                      {fila.alarmas + fila.seguimientosVencidos === 0 && <span className="text-xs text-muted-foreground">Al día</span>}
                    </span>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Oportunidades estancadas</CardTitle>
          <CardDescription>Sin actividad reciente: las que conviene mover primero.</CardDescription>
        </CardHeader>
        <CardContent>
          {estancadas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Ninguna: todas tienen actividad reciente.</p>
          ) : (
            <ul className="flex flex-col divide-y">
              {estancadas.map((alarma) => {
                const oportunidad = oportunidadPorId(estado, alarma.idOportunidad!);
                const cliente = clientePorId(estado, alarma.idCliente);
                const vendedor = personaPorId(estado, alarma.idResponsable);
                if (!oportunidad) return null;
                return (
                  <li key={oportunidad.id}>
                    <button
                      type="button"
                      onClick={() => setOportunidadAbierta(oportunidad.id)}
                      className="flex w-full flex-wrap items-center justify-between gap-2 rounded-md py-2.5 text-left text-sm outline-none hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span className="flex flex-col">
                        <span className="font-medium">{oportunidad.titulo}</span>
                        <span className="text-xs text-muted-foreground">
                          {cliente?.razonSocial} · {nombresEtapa[oportunidad.etapa]} · {vendedor ? nombreCompleto(vendedor) : ""}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="tabular-nums">{formatearMonto(oportunidad.monto)}</span>
                        <Badge className="bg-peligro-suave text-destructive">
                          {nombresAlarma[alarma.tipo]} · {alarma.dias} días
                        </Badge>
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            También están en{" "}
            <Link href="/seguimientos" className="underline-offset-4 hover:underline">
              Seguimientos y alarmas
            </Link>
            .
          </p>
        </CardContent>
      </Card>

      <DetalleOportunidad idOportunidad={oportunidadAbierta} alCerrar={() => setOportunidadAbierta(null)} />
    </>
  );
}

function Cifra({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className={cn("font-heading text-2xl font-semibold tabular-nums")}>{valor}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
