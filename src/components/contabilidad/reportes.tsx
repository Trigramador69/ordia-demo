"use client";

import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { mesDeFecha, primerDiaDelMes, ultimoDiaDelMes } from "@/datos/fechas";
import { buscarCuenta, planDeCuentas } from "@/datos/plan-cuentas";
import { aCentavos, saldosPorCuenta } from "@/lib/contabilidad";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMes } from "@/lib/formato";
import { useFiltroUrl } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

type Vista = "comprobacion" | "resultados";

export function Reportes() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const meses = [...new Set(estado.asientos.map((asiento) => mesDeFecha(asiento.fecha)))].sort((a, b) => b.localeCompare(a));
  const [vista, setVista] = useFiltroUrl<Vista>("vista", "comprobacion", ["comprobacion", "resultados"]);
  const [mes, setMes] = useFiltroUrl<string>("mes", mesDeFecha(hoy), meses);

  return (
    <>
      <EncabezadoPagina
        titulo="Reportes contables"
        descripcion="Salen de los asientos registrados: se recalculan solos con cada factura, cobro, planilla, depreciación o asiento manual."
        acciones={<SelectorSimple opciones={Object.fromEntries(meses.map((item) => [item, formatearMes(item)]))} valor={mes} alCambiar={setMes} className="w-48" />}
      />
      <Tabs value={vista} onValueChange={(valor) => setVista(valor as Vista)}>
        <TabsList>
          <TabsTrigger value="comprobacion">Balance de comprobación</TabsTrigger>
          <TabsTrigger value="resultados">Estado de resultados</TabsTrigger>
        </TabsList>
        <TabsContent value="comprobacion" className="pt-2">
          <BalanceDeComprobacion mes={mes} />
        </TabsContent>
        <TabsContent value="resultados" className="pt-2">
          <EstadoDeResultados mes={mes} />
        </TabsContent>
      </Tabs>
    </>
  );
}

// Sumas y saldos de cada cuenta con movimiento, acumulados al cierre del mes.
function BalanceDeComprobacion({ mes }: { mes: string }) {
  const { asientos } = useEstadoDemo();
  const hasta = ultimoDiaDelMes(mes);
  const saldos = saldosPorCuenta(asientos, { hasta });
  const filas = planDeCuentas
    .filter((cuenta) => cuenta.imputable && saldos.has(cuenta.codigo))
    .map((cuenta) => {
      const { debe, haber } = saldos.get(cuenta.codigo)!;
      const diferencia = aCentavos(debe) - aCentavos(haber);
      return { cuenta, debe, haber, deudor: diferencia > 0 ? diferencia / 100 : 0, acreedor: diferencia < 0 ? -diferencia / 100 : 0 };
    });
  const suma = (campo: "debe" | "haber" | "deudor" | "acreedor") => filas.reduce((total, fila) => total + aCentavos(fila[campo]), 0) / 100;
  const cuadra = aCentavos(suma("debe")) === aCentavos(suma("haber")) && aCentavos(suma("deudor")) === aCentavos(suma("acreedor"));

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Balance de comprobación de sumas y saldos</CardTitle>
        <CardDescription className="flex flex-wrap items-center gap-2">
          Al {formatearFecha(hasta)}.
          {cuadra && (
            <span className="flex items-center gap-1 text-exito">
              <CheckCircle2 className="size-3.5" />
              Las sumas y los saldos cuadran.
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-6">Cuenta</TableHead>
            <TableHead className="text-right">Debe</TableHead>
            <TableHead className="text-right">Haber</TableHead>
            <TableHead className="text-right">Saldo deudor</TableHead>
            <TableHead className="pr-6 text-right">Saldo acreedor</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map((fila) => (
            <TableRow key={fila.cuenta.codigo}>
              <TableCell className="pl-6">
                <Link href={`/libro-mayor?cuenta=${fila.cuenta.codigo}&mes=todos`} className="hover:underline">
                  <span className="mr-2 font-mono text-xs text-muted-foreground">{fila.cuenta.codigo}</span>
                  {fila.cuenta.nombre}
                </Link>
              </TableCell>
              <TableCell className="text-right tabular-nums">{formatearImporte(fila.debe)}</TableCell>
              <TableCell className="text-right tabular-nums">{formatearImporte(fila.haber)}</TableCell>
              <TableCell className="text-right tabular-nums">{fila.deudor ? formatearImporte(fila.deudor) : ""}</TableCell>
              <TableCell className="pr-6 text-right tabular-nums">{fila.acreedor ? formatearImporte(fila.acreedor) : ""}</TableCell>
            </TableRow>
          ))}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="pl-6 font-medium">Totales (Bs)</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatearImporte(suma("debe"))}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatearImporte(suma("haber"))}</TableCell>
            <TableCell className="text-right font-semibold tabular-nums">{formatearImporte(suma("deudor"))}</TableCell>
            <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatearImporte(suma("acreedor"))}</TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}

// Ingresos menos gastos del mes, agrupados como en el plan de cuentas.
function EstadoDeResultados({ mes }: { mes: string }) {
  const { asientos } = useEstadoDemo();
  const saldos = saldosPorCuenta(asientos, { desde: primerDiaDelMes(mes), hasta: ultimoDiaDelMes(mes) });
  const grupos = (prefijo: string) =>
    planDeCuentas
      .filter((cuenta) => cuenta.nivel === 2 && cuenta.codigo.startsWith(prefijo))
      .map((grupo) => ({
        grupo,
        cuentas: planDeCuentas
          .filter((cuenta) => cuenta.imputable && cuenta.codigo.startsWith(`${grupo.codigo}.`) && saldos.has(cuenta.codigo))
          .map((cuenta) => ({ cuenta, monto: saldos.get(cuenta.codigo)!.saldo })),
      }))
      .filter((item) => item.cuentas.length > 0);
  const ingresos = grupos("4");
  const gastos = grupos("5");
  const total = (lista: ReturnType<typeof grupos>) => lista.flatMap((item) => item.cuentas).reduce((suma, item) => suma + aCentavos(item.monto), 0) / 100;
  const totalIngresos = total(ingresos);
  const totalGastos = total(gastos);
  const resultado = (aCentavos(totalIngresos) - aCentavos(totalGastos)) / 100;

  return (
    <Card className="pb-0">
      <CardHeader>
        <CardTitle>Estado de resultados de {formatearMes(mes).toLowerCase()}</CardTitle>
        <CardDescription>
          Del {formatearFecha(primerDiaDelMes(mes))} al {formatearFecha(ultimoDiaDelMes(mes))}. Los ingresos son netos de IVA.
        </CardDescription>
      </CardHeader>
      <Table>
        <TableBody>
          <Seccion titulo="Ingresos" grupos={ingresos} total={totalIngresos} />
          <Seccion titulo="Gastos" grupos={gastos} total={totalGastos} />
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell className="pl-6 font-semibold">{resultado >= 0 ? "Utilidad del mes" : "Pérdida del mes"}</TableCell>
            <TableCell className={cn("pr-6 text-right font-heading text-lg font-semibold tabular-nums", resultado < 0 ? "text-destructive" : "text-exito")}>
              {formatearImporte(resultado)}
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </Card>
  );
}

function Seccion({
  titulo,
  grupos,
  total,
}: {
  titulo: string;
  grupos: { grupo: { codigo: string; nombre: string }; cuentas: { cuenta: { codigo: string; nombre: string }; monto: number }[] }[];
  total: number;
}) {
  return (
    <>
      <TableRow className="bg-muted/50 hover:bg-muted/50">
        <TableCell className="pl-6 font-semibold">{titulo}</TableCell>
        <TableCell className="pr-6 text-right font-semibold tabular-nums">{formatearImporte(total)}</TableCell>
      </TableRow>
      {grupos.length === 0 && (
        <TableRow>
          <TableCell className="pl-10 text-muted-foreground" colSpan={2}>
            Sin movimientos en el mes.
          </TableCell>
        </TableRow>
      )}
      {grupos.map(({ grupo, cuentas }) => (
        <GrupoFilas key={grupo.codigo} nombre={buscarCuenta(grupo.codigo)?.nombre ?? grupo.nombre} cuentas={cuentas} />
      ))}
    </>
  );
}

function GrupoFilas({ nombre, cuentas }: { nombre: string; cuentas: { cuenta: { codigo: string; nombre: string }; monto: number }[] }) {
  const subtotal = cuentas.reduce((suma, item) => suma + aCentavos(item.monto), 0) / 100;
  return (
    <>
      <TableRow>
        <TableCell className="pl-8 font-medium">{nombre}</TableCell>
        <TableCell className="pr-6 text-right font-medium tabular-nums">{formatearImporte(subtotal)}</TableCell>
      </TableRow>
      {cuentas.map(({ cuenta, monto }) => (
        <TableRow key={cuenta.codigo}>
          <TableCell className="pl-12 text-muted-foreground">{cuenta.nombre}</TableCell>
          <TableCell className="pr-6 text-right text-muted-foreground tabular-nums">{formatearImporte(monto)}</TableCell>
        </TableRow>
      ))}
    </>
  );
}
