"use client";

import Link from "next/link";
import { CheckCircle2, TrendingDown, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { TablaAsiento } from "@/components/contabilidad/tabla-asiento";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mesDeFecha, ultimoDiaDelMes } from "@/datos/fechas";
import { formatearNombreMesYAnio } from "@/datos/meses";
import { vidaUtilPorCategoria } from "@/datos/parametros";
import type { CategoriaActivo } from "@/datos/tipos";
import { calcularDepreciacionDelMes, idDepreciacionDelMes, nombresCategoriaActivo } from "@/lib/activos";
import { asientoDeDepreciacion, crearAsiento } from "@/lib/contabilidad";
import { registrarDepreciacion } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { activoPorId, asientoPorId } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMes, formatearMonto, pluralizar } from "@/lib/formato";
import { useFiltroUrl } from "@/lib/use-filtro-url";

export function VistaDepreciacion() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const mesActual = mesDeFecha(hoy);
  const meses = [...new Set([mesActual, ...estado.depreciaciones.map((item) => item.mes)])].sort((a, b) => b.localeCompare(a));
  const [mes, setMes] = useFiltroUrl<string>("mes", mesActual, meses);
  const registrada = estado.depreciaciones.find((item) => item.mes === mes);

  // Registrada: la que quedó en el asiento. Pendiente: la que se calcula hoy.
  const calculo = calcularDepreciacionDelMes(estado.activos, mes);
  const montos = registrada ? registrada.montos : calculo.montos;
  const total = montos.reduce((suma, item) => suma + item.monto, 0);
  const porCategoria = new Map<CategoriaActivo, { cantidad: number; monto: number }>();
  for (const item of montos) {
    const activo = activoPorId(estado, item.idActivo);
    if (!activo) continue;
    const actual = porCategoria.get(activo.categoria) ?? { cantidad: 0, monto: 0 };
    porCategoria.set(activo.categoria, { cantidad: actual.cantidad + 1, monto: actual.monto + item.monto });
  }
  const asiento = registrada
    ? asientoPorId(estado, registrada.idAsiento)
    : crearAsiento(
        asientoDeDepreciacion({ idDepreciacion: idDepreciacionDelMes(mes), nombreMes: formatearNombreMesYAnio(mes), fecha: ultimoDiaDelMes(mes), porCategoria: calculo.porCategoria }),
        estado.asientos,
        hoy,
      );

  function registrar() {
    const { asiento: nuevo, deshacer } = registrarDepreciacion(mes);
    toast.success(`Depreciación de ${formatearMes(mes).toLowerCase()} registrada.`, {
      description: `Asiento N° ${nuevo.numero} por ${formatearMonto(total)}.`,
      action: { label: "Deshacer", onClick: deshacer },
    });
  }

  return (
    <>
      <EncabezadoPagina
        titulo={`Depreciación de ${formatearMes(mes).toLowerCase()}`}
        descripcion={`Lineal por categoría: computación ${vidaUtilPorCategoria.computacion} años, vehículos ${vidaUtilPorCategoria.vehiculos}, equipos de oficina ${vidaUtilPorCategoria.equipos_oficina} y muebles ${vidaUtilPorCategoria.muebles}.`}
        acciones={
          <>
            <SelectorSimple opciones={Object.fromEntries(meses.map((item) => [item, formatearMes(item)]))} valor={mes} alCambiar={setMes} className="w-48" />
            {!registrada && (
              <Button onClick={registrar} disabled={montos.length === 0}>
                <TrendingDown />
                Registrar depreciación
              </Button>
            )}
          </>
        }
      />

      {registrada ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-exito/30 bg-exito-suave px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 text-exito" />
          <span className="font-medium text-exito">Registrada</span>
          <span className="text-muted-foreground">
            el {formatearFecha(registrada.fechaRegistro)} · asiento N° {asiento?.numero} en el libro diario
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-advertencia/30 bg-advertencia-suave px-4 py-3 text-sm">
          <TriangleAlert className="size-4 text-advertencia" />
          <span className="font-medium text-advertencia">Por registrar</span>
          <span className="text-muted-foreground">Al registrarla se genera su asiento: gasto de depreciación contra la depreciación acumulada de cada categoría.</span>
        </div>
      )}

      <div className="grid items-start gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="pb-0">
          <CardHeader>
            <CardTitle>Por categoría</CardTitle>
            <CardDescription>
              {formatearMonto(total)} de {pluralizar(montos.length, "activo", "activos")}. Los totalmente depreciados o dados de baja ya no suman.
            </CardDescription>
          </CardHeader>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="pl-6">Categoría</TableHead>
                <TableHead className="text-right">Vida útil</TableHead>
                <TableHead className="text-right">Activos</TableHead>
                <TableHead className="pr-6 text-right">Depreciación (Bs)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {[...porCategoria.entries()].map(([categoria, datos]) => (
                <TableRow key={categoria}>
                  <TableCell className="pl-6">{nombresCategoriaActivo[categoria]}</TableCell>
                  <TableCell className="text-right tabular-nums">{vidaUtilPorCategoria[categoria]} años</TableCell>
                  <TableCell className="text-right tabular-nums">{datos.cantidad}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{formatearImporte(datos.monto)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell className="pl-6 font-medium" colSpan={3}>
                  Total
                </TableCell>
                <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatearImporte(total)}</TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </Card>

        {asiento && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Asiento contable
                {registrada ? <Badge variant="secondary">N° {asiento.numero}</Badge> : <Badge className="bg-advertencia-suave text-advertencia">Se registra al confirmar</Badge>}
              </CardTitle>
              <CardDescription>{asiento.glosa}, con fecha {formatearFecha(asiento.fecha)}.</CardDescription>
            </CardHeader>
            <CardContent>
              <TablaAsiento lineas={asiento.lineas} />
            </CardContent>
          </Card>
        )}
      </div>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>Por activo</CardTitle>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Activo</TableHead>
              <TableHead className="hidden md:table-cell">Categoría</TableHead>
              <TableHead className="pr-6 text-right">Depreciación (Bs)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {montos.map((item) => {
              const activo = activoPorId(estado, item.idActivo);
              if (!activo) return null;
              return (
                <TableRow key={item.idActivo}>
                  <TableCell className="pl-6">
                    <Link href={`/activos/${activo.id}`} className="font-medium hover:underline">
                      {activo.nombre}
                    </Link>
                    <span className="ml-2 text-xs text-muted-foreground">{activo.codigo}</span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{nombresCategoriaActivo[activo.categoria]}</TableCell>
                  <TableCell className="pr-6 text-right tabular-nums">{formatearImporte(item.monto)}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
