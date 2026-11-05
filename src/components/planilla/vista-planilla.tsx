"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Download, FileText, Lock, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { TablaAsiento } from "@/components/contabilidad/tabla-asiento";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { mesDeFecha, ultimoDiaDelMes } from "@/datos/fechas";
import { parametrosPlanilla } from "@/datos/parametros";
import type { FilaPlanilla } from "@/datos/tipos";
import { crearAsiento } from "@/lib/contabilidad";
import { cerrarPlanilla } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { asientoPorId, mesesConPlanilla, personaPorId, planillaDelMes } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearImporte, formatearMes, formatearMonto, pluralizar } from "@/lib/formato";
import { borradorAsientoPlanilla } from "@/lib/planilla";
import { useFiltroUrl } from "@/lib/use-filtro-url";

const porcentaje = (valor: number) => `${(valor * 100).toLocaleString("es-BO", { maximumFractionDigits: 2 })}%`;

export function VistaPlanilla() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const meses = mesesConPlanilla(estado, hoy);
  const opcionesMes = Object.fromEntries(meses.map((mes) => [mes, formatearMes(mes)]));
  const [mes, setMes] = useFiltroUrl<string>("mes", mesDeFecha(hoy), meses);
  const [dialogoCierre, setDialogoCierre] = useState(false);

  const planilla = planillaDelMes(estado, mes);
  const { cerrada, filas, totales } = planilla;
  const cerradoPor = cerrada ? personaPorId(estado, cerrada.idCerradoPor) : undefined;
  // Si sigue abierta, el asiento se muestra como quedaría al cerrarla.
  const asiento = cerrada
    ? asientoPorId(estado, cerrada.idAsiento)
    : crearAsiento(borradorAsientoPlanilla(mes, filas), estado.asientos, hoy);

  return (
    <>
      <EncabezadoPagina
        titulo={`Planilla de ${formatearMes(mes).toLowerCase()}`}
        descripcion={`${pluralizar(filas.length, "persona", "personas")} · salario mínimo nacional ${formatearMonto(parametrosPlanilla.salarioMinimoNacional)}`}
        acciones={
          <>
            <SelectorSimple opciones={opcionesMes} valor={mes} alCambiar={setMes} className="w-48" />
            <Button variant="outline" onClick={() => descargarCsv(filas, mes)}>
              <Download />
              Descargar
            </Button>
            {!cerrada && (
              <Button onClick={() => setDialogoCierre(true)}>
                <Lock />
                Cerrar planilla
              </Button>
            )}
          </>
        }
      />

      {cerrada ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-exito/30 bg-exito-suave px-4 py-3 text-sm">
          <CheckCircle2 className="size-4 text-exito" />
          <span className="font-medium text-exito">Cerrada</span>
          <span className="text-muted-foreground">
            el {formatearFecha(cerrada.fechaCierre)}
            {cerradoPor && ` por ${cerradoPor.nombres.split(" ")[0]} ${cerradoPor.apellidos.split(" ")[0]}`} · queda fija y sus boletas
            no cambian · asiento N° {asiento?.numero} en el libro diario
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-lg border border-advertencia/30 bg-advertencia-suave px-4 py-3 text-sm">
          <TriangleAlert className="size-4 text-advertencia" />
          <span className="font-medium text-advertencia">Por cerrar</span>
          <span className="text-muted-foreground">
            Se calcula con los datos de hoy: sueldos, antigüedad y permisos sin goce de haber. Al cerrarla queda fija y se registra su
            asiento contable.
          </span>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra titulo="Total ganado" valor={totales.totalGanado} detalle={`Haber básico ganado ${formatearMonto(totales.totalGanado - totales.bonoAntiguedad)} · bono de antigüedad ${formatearMonto(totales.bonoAntiguedad)}`} />
        <Cifra
          titulo="Descuentos"
          valor={totales.totalDescuentos}
          detalle={`Aportes laborales ${formatearMonto(totales.aporteLaboral + totales.aporteNacionalSolidario)} · RC-IVA ${formatearMonto(totales.rcIva)}`}
        />
        <Cifra titulo="Líquido pagable" valor={totales.liquidoPagable} detalle="A depositar en las cuentas del personal" destacada />
        <Cifra
          titulo="Costo para la empresa"
          valor={totales.costoEmpresa}
          detalle={`Total ganado, aportes patronales ${formatearMonto(totales.aportesPatronales)} y provisiones`}
        />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Persona</TableHead>
              <TableHead className="hidden text-right lg:table-cell">Días</TableHead>
              <TableHead className="hidden text-right md:table-cell">Haber básico</TableHead>
              <TableHead className="hidden text-right md:table-cell">Bono antigüedad</TableHead>
              <TableHead className="text-right">Total ganado</TableHead>
              <TableHead className="hidden text-right xl:table-cell">Aportes laborales</TableHead>
              <TableHead className="hidden text-right xl:table-cell">RC-IVA</TableHead>
              <TableHead className="hidden text-right sm:table-cell xl:hidden 2xl:table-cell">Descuentos</TableHead>
              <TableHead className="text-right">Líquido pagable</TableHead>
              <TableHead className="w-10 pr-4" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {filas.map((fila) => (
              <TableRow key={fila.idPersona}>
                <TableCell className="pl-4">
                  <Link href={`/personal/${fila.idPersona}`} className="font-medium hover:underline">
                    {fila.nombreCompleto}
                  </Link>
                  <p className="text-xs text-muted-foreground">{fila.cargo}</p>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums lg:table-cell">
                  {fila.diasPagados}
                  {fila.diasSinGoce > 0 && <p className="text-xs text-destructive">{pluralizar(fila.diasSinGoce, "día", "días")} sin goce</p>}
                  {fila.diasAntesDelIngreso > 0 && <p className="text-xs text-muted-foreground">ingresó en el mes</p>}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">
                  {formatearImporte(fila.haberBasicoGanado)}
                  {fila.descuentoDiasNoPagados > 0 && (
                    <p className="text-xs text-muted-foreground">de {formatearImporte(fila.haberBasico)}</p>
                  )}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">
                  {fila.bonoAntiguedad > 0 ? formatearImporte(fila.bonoAntiguedad) : "-"}
                  {fila.porcentajeBono > 0 && <p className="text-xs text-muted-foreground">{fila.porcentajeBono}%</p>}
                </TableCell>
                <TableCell className="text-right font-medium tabular-nums">{formatearImporte(fila.totalGanado)}</TableCell>
                <TableCell className="hidden text-right tabular-nums xl:table-cell">
                  {formatearImporte(fila.aporteLaboral + fila.aporteNacionalSolidario)}
                  {fila.aporteNacionalSolidario > 0 && (
                    <p className="text-xs text-muted-foreground">con {formatearImporte(fila.aporteNacionalSolidario)} solidario</p>
                  )}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums xl:table-cell">{fila.rcIva > 0 ? formatearImporte(fila.rcIva) : "-"}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell xl:hidden 2xl:table-cell">{formatearImporte(fila.totalDescuentos)}</TableCell>
                <TableCell className="text-right font-semibold tabular-nums">{formatearImporte(fila.liquidoPagable)}</TableCell>
                <TableCell className="pr-4">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    nativeButton={false}
                    render={<Link href={`/planilla/${mes}/${fila.idPersona}`} aria-label={`Boleta de ${fila.nombreCompleto}`} />}
                  >
                    <FileText />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TableCell className="pl-4 font-medium">Totales (Bs)</TableCell>
              <TableCell className="hidden lg:table-cell" />
              <TableCell className="hidden text-right tabular-nums md:table-cell">{formatearImporte(totales.haberBasicoGanado)}</TableCell>
              <TableCell className="hidden text-right tabular-nums md:table-cell">{formatearImporte(totales.bonoAntiguedad)}</TableCell>
              <TableCell className="text-right font-medium tabular-nums">{formatearImporte(totales.totalGanado)}</TableCell>
              <TableCell className="hidden text-right tabular-nums xl:table-cell">
                {formatearImporte(totales.aporteLaboral + totales.aporteNacionalSolidario)}
              </TableCell>
              <TableCell className="hidden text-right tabular-nums xl:table-cell">{formatearImporte(totales.rcIva)}</TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell xl:hidden 2xl:table-cell">{formatearImporte(totales.totalDescuentos)}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{formatearImporte(totales.liquidoPagable)}</TableCell>
              <TableCell className="pr-4" />
            </TableRow>
          </TableFooter>
        </Table>
      </Card>

      <div className="grid items-start gap-4 xl:grid-cols-[22rem_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>A cargo de la empresa</CardTitle>
            <CardDescription>Sobre el total ganado. No se descuentan al personal.</CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="flex flex-col gap-2 text-sm">
              <Concepto etiqueta={`Caja de salud (${porcentaje(parametrosPlanilla.aportesPatronales.cajaDeSalud)})`} monto={totales.cajaDeSalud} />
              <Concepto etiqueta={`Riesgo profesional (${porcentaje(parametrosPlanilla.aportesPatronales.riesgoProfesional)})`} monto={totales.riesgoProfesional} />
              <Concepto etiqueta={`Aporte patronal solidario (${porcentaje(parametrosPlanilla.aportesPatronales.solidario)})`} monto={totales.solidario} />
              <Concepto etiqueta={`Vivienda (${porcentaje(parametrosPlanilla.aportesPatronales.vivienda)})`} monto={totales.vivienda} />
              <Concepto etiqueta="Total aportes patronales" monto={totales.aportesPatronales} total />
              <Concepto etiqueta={`Provisión de aguinaldo (${porcentaje(parametrosPlanilla.provisiones.aguinaldo)})`} monto={totales.provisionAguinaldo} />
              <Concepto etiqueta={`Provisión de indemnización (${porcentaje(parametrosPlanilla.provisiones.indemnizacion)})`} monto={totales.provisionIndemnizacion} />
            </dl>
          </CardContent>
        </Card>

        {asiento && (
          <Card>
            <CardHeader>
              <CardTitle className="flex flex-wrap items-center gap-2">
                Asiento contable
                {cerrada ? (
                  <Badge variant="secondary">N° {asiento.numero}</Badge>
                ) : (
                  <Badge className="bg-advertencia-suave text-advertencia">Se registra al cerrar</Badge>
                )}
              </CardTitle>
              <CardDescription>{asiento.glosa}, con fecha {formatearFecha(asiento.fecha)}.</CardDescription>
            </CardHeader>
            <CardContent>
              <TablaAsiento lineas={asiento.lineas} />
            </CardContent>
          </Card>
        )}
      </div>

      {!cerrada && (
        <DialogoCierre
          abierto={dialogoCierre}
          alCambiarAbierto={setDialogoCierre}
          mes={mes}
          personas={filas.length}
          liquido={totales.liquidoPagable}
          numeroAsiento={asiento?.numero ?? 0}
          mesTerminado={hoy > ultimoDiaDelMes(mes)}
        />
      )}
    </>
  );
}

function DialogoCierre({
  abierto,
  alCambiarAbierto,
  mes,
  personas,
  liquido,
  numeroAsiento,
  mesTerminado,
}: {
  abierto: boolean;
  alCambiarAbierto: (abierto: boolean) => void;
  mes: string;
  personas: number;
  liquido: number;
  numeroAsiento: number;
  mesTerminado: boolean;
}) {
  const estado = useEstadoDemo();

  function cerrar() {
    const { asiento, deshacer } = cerrarPlanilla(mes, usuarioDelRol(estado).id);
    alCambiarAbierto(false);
    toast.success(`Planilla de ${formatearMes(mes).toLowerCase()} cerrada.`, {
      description: `Se registró el asiento N° ${asiento.numero} en el libro diario. Las boletas ya están listas.`,
      action: { label: "Deshacer", onClick: deshacer },
    });
  }

  return (
    <Dialog open={abierto} onOpenChange={alCambiarAbierto}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>¿Cerrar la planilla de {formatearMes(mes).toLowerCase()}?</DialogTitle>
          <DialogDescription>
            {pluralizar(personas, "persona", "personas")} · líquido pagable {formatearMonto(liquido)}. La planilla queda fija, sus
            boletas no cambian y se registra el asiento N° {numeroAsiento} en el libro diario.
          </DialogDescription>
        </DialogHeader>
        {!mesTerminado && (
          <p className="rounded-lg bg-advertencia-suave px-3 py-2 text-sm text-advertencia">
            El mes todavía no terminó: lo que se registre después (por ejemplo, un permiso sin goce de haber) ya no entra en esta
            planilla.
          </p>
        )}
        <DialogFooter>
          <DialogClose render={<Button variant="outline" />}>Cancelar</DialogClose>
          <Button onClick={cerrar}>
            <Lock />
            Cerrar planilla
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Cifra({ titulo, valor, detalle, destacada }: { titulo: string; valor: number; detalle: string; destacada?: boolean }) {
  return (
    <Card className={destacada ? "border-primary/30" : undefined}>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className={`font-heading text-2xl font-semibold tabular-nums ${destacada ? "text-primary" : ""}`}>
          {formatearMonto(valor)}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}

function Concepto({ etiqueta, monto, total }: { etiqueta: string; monto: number; total?: boolean }) {
  return (
    <div className={`flex justify-between gap-4 ${total ? "border-t pt-2 font-medium" : ""}`}>
      <dt className={total ? "" : "text-muted-foreground"}>{etiqueta}</dt>
      <dd className="tabular-nums">{formatearImporte(monto)}</dd>
    </div>
  );
}

function descargarCsv(filas: FilaPlanilla[], mes: string) {
  const columnas = [
    "Persona", "Carnet", "Cargo", "Días pagados", "Haber básico", "Haber básico ganado", "Bono de antigüedad",
    "Total ganado", "Aporte laboral", "Aporte nacional solidario", "RC-IVA", "Total descuentos", "Líquido pagable",
  ];
  const numero = (valor: number) => valor.toFixed(2).replace(".", ",");
  const lineas = [columnas.join(";")];
  for (const fila of filas) {
    lineas.push(
      [
        fila.nombreCompleto, fila.carnetIdentidad, fila.cargo, fila.diasPagados, numero(fila.haberBasico), numero(fila.haberBasicoGanado),
        numero(fila.bonoAntiguedad), numero(fila.totalGanado), numero(fila.aporteLaboral), numero(fila.aporteNacionalSolidario),
        numero(fila.rcIva), numero(fila.totalDescuentos), numero(fila.liquidoPagable),
      ].join(";"),
    );
  }
  const contenido = String.fromCodePoint(0xfeff) + lineas.join("\r\n");
  const enlace = document.createElement("a");
  enlace.href = URL.createObjectURL(new Blob([contenido], { type: "text/csv;charset=utf-8" }));
  enlace.download = `planilla-${mes}.csv`;
  enlace.click();
  URL.revokeObjectURL(enlace.href);
}
