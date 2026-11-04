"use client";

import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nombresTipoCuenta } from "@/datos/catalogos";
import { mesDeFecha, primerDiaDelMes, ultimoDiaDelMes } from "@/datos/fechas";
import { buscarCuenta, cuentasDelSistema, esDeudora, planDeCuentas } from "@/datos/plan-cuentas";
import { aCentavos } from "@/lib/contabilidad";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMes, pluralizar } from "@/lib/formato";
import { useFiltroUrl } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

const todos = "todos";
const opcionesCuenta = Object.fromEntries(
  planDeCuentas.filter((cuenta) => cuenta.imputable).map((cuenta) => [cuenta.codigo, `${cuenta.codigo} ${cuenta.nombre}`]),
);

export function LibroMayor() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const meses = [...new Set(estado.asientos.map((asiento) => mesDeFecha(asiento.fecha)))].sort((a, b) => b.localeCompare(a));
  const opcionesMes: Record<string, string> = { [todos]: "Todo el periodo", ...Object.fromEntries(meses.map((mes) => [mes, formatearMes(mes)])) };
  const [codigo, setCodigo] = useFiltroUrl<string>("cuenta", cuentasDelSistema.banco, Object.keys(opcionesCuenta));
  const [mes, setMes] = useFiltroUrl<string>("mes", mesDeFecha(hoy), Object.keys(opcionesMes));
  const cuenta = buscarCuenta(codigo)!;
  const deudora = esDeudora(cuenta);
  const desde = mes === todos ? "" : primerDiaDelMes(mes);
  const hasta = mes === todos ? "9999-12-31" : ultimoDiaDelMes(mes);

  // Saldo con el signo del lado natural de la cuenta, en centavos.
  const efecto = (debe: number, haber: number) => (deudora ? aCentavos(debe) - aCentavos(haber) : aCentavos(haber) - aCentavos(debe));
  const movimientos = estado.asientos
    .flatMap((asiento) => asiento.lineas.filter((linea) => linea.codigoCuenta === codigo).map((linea) => ({ asiento, linea })))
    .sort((a, b) => a.asiento.fecha.localeCompare(b.asiento.fecha) || a.asiento.numero - b.asiento.numero);
  const saldoAnterior = movimientos.filter((item) => item.asiento.fecha < desde).reduce((suma, item) => suma + efecto(item.linea.debe, item.linea.haber), 0);
  const delPeriodo = movimientos.filter((item) => item.asiento.fecha >= desde && item.asiento.fecha <= hasta);
  // Saldo acumulado línea a línea, en centavos, a partir del saldo anterior.
  const acumulados = delPeriodo.reduce<number[]>(
    (lista, item) => [...lista, (lista.at(-1) ?? saldoAnterior) + efecto(item.linea.debe, item.linea.haber)],
    [],
  );
  const filas = delPeriodo.map((item, indice) => ({ ...item, saldo: acumulados[indice] / 100 }));
  const saldo = acumulados.at(-1) ?? saldoAnterior;
  const totalDebe = filas.reduce((suma, fila) => suma + aCentavos(fila.linea.debe), 0) / 100;
  const totalHaber = filas.reduce((suma, fila) => suma + aCentavos(fila.linea.haber), 0) / 100;

  return (
    <>
      <EncabezadoPagina titulo="Libro mayor" descripcion="Movimientos de una cuenta con su saldo acumulado." />

      <div className="grid gap-3 sm:grid-cols-[1fr_14rem] lg:max-w-3xl">
        <SelectorSimple opciones={opcionesCuenta} valor={codigo} alCambiar={setCodigo} />
        <SelectorSimple opciones={opcionesMes} valor={mes} alCambiar={setMes} />
      </div>

      <Card className="pb-0">
        <CardHeader>
          <CardTitle>
            {cuenta.codigo} {cuenta.nombre}
          </CardTitle>
          <CardDescription>
            {nombresTipoCuenta[cuenta.tipo]}
            {cuenta.regularizadora ? " (regularizadora)" : ""} · saldo {deudora ? "deudor" : "acreedor"} · {pluralizar(filas.length, "movimiento", "movimientos")}
          </CardDescription>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-6">Fecha</TableHead>
              <TableHead>Asiento</TableHead>
              <TableHead className="text-right">Debe</TableHead>
              <TableHead className="text-right">Haber</TableHead>
              <TableHead className="pr-6 text-right">Saldo</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {mes !== todos && (
              <TableRow className="bg-muted/30">
                <TableCell className="pl-6 text-muted-foreground" colSpan={4}>
                  Saldo al inicio de {formatearMes(mes).toLowerCase()}
                </TableCell>
                <TableCell className="pr-6 text-right font-medium tabular-nums">{formatearImporte(saldoAnterior / 100)}</TableCell>
              </TableRow>
            )}
            {filas.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  Sin movimientos en este periodo.
                </TableCell>
              </TableRow>
            )}
            {filas.map(({ asiento, linea, saldo: saldoFila }, indice) => (
              <TableRow key={`${asiento.id}-${indice}`}>
                <TableCell className="pl-6 tabular-nums">{formatearFecha(asiento.fecha)}</TableCell>
                <TableCell className="max-w-md whitespace-normal">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">N° {asiento.numero}</span>
                  {asiento.glosa}
                </TableCell>
                <TableCell className="text-right tabular-nums">{linea.debe ? formatearImporte(linea.debe) : ""}</TableCell>
                <TableCell className="text-right tabular-nums">{linea.haber ? formatearImporte(linea.haber) : ""}</TableCell>
                <TableCell className={cn("pr-6 text-right tabular-nums", saldoFila < 0 && "text-destructive")}>{formatearImporte(saldoFila)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-6 font-medium" colSpan={2}>
                Totales y saldo final
              </TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatearImporte(totalDebe)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatearImporte(totalHaber)}</TableCell>
              <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatearImporte(saldo / 100)}</TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </Card>
    </>
  );
}
