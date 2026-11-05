"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Download, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { empresa } from "@/datos/catalogos";
import { parametrosPlanilla } from "@/datos/parametros";
import type { FilaPlanilla } from "@/datos/tipos";
import { crearPdfBoleta, nombreArchivoBoleta } from "@/lib/boleta-pdf";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { planillaDelMes } from "@/lib/demo/consultas";
import { formatearFecha, formatearImporte, formatearMes } from "@/lib/formato";
import { montoALetras } from "@/lib/numero-a-letras";
import { descargarPdf } from "@/lib/pdf";
import { cn } from "@/lib/utils";

export function BoletaDePago() {
  const { mes, idPersona } = useParams<{ mes: string; idPersona: string }>();
  const estado = useEstadoDemo();
  const valido = /^\d{4}-\d{2}$/.test(mes);
  const planilla = valido ? planillaDelMes(estado, mes) : null;
  const fila = planilla?.filas.find((item) => item.idPersona === idPersona);

  if (!planilla || !fila) {
    return (
      <div className="flex flex-col items-center gap-3 py-16 text-center">
        <h1 className="font-heading text-lg font-semibold">No encontramos esta boleta</h1>
        <p className="text-sm text-muted-foreground">La persona no figura en la planilla de ese mes.</p>
        <Button variant="outline" nativeButton={false} render={<Link href="/planilla" />}>
          Ir a la planilla
        </Button>
      </div>
    );
  }

  const vistaPrevia = planilla.cerrada === null;

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Button variant="ghost" size="sm" className="-ml-2" nativeButton={false} render={<Link href={`/planilla?mes=${mes}`} />}>
          <ArrowLeft />
          Planilla de {formatearMes(mes).toLowerCase()}
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.print()}>
            <Printer />
            Imprimir
          </Button>
          <Button onClick={() => descargarPdf(crearPdfBoleta(fila, mes, { vistaPrevia }), nombreArchivoBoleta(fila, mes))}>
            <Download />
            Descargar PDF
          </Button>
        </div>
      </div>

      {vistaPrevia && (
        <p className="rounded-lg bg-advertencia-suave px-4 py-3 text-sm text-advertencia print:hidden">
          Vista previa: la planilla de este mes todavía no está cerrada, así que los montos pueden cambiar.
        </p>
      )}

      <HojaBoleta fila={fila} mes={mes} vistaPrevia={vistaPrevia} />
    </>
  );
}

const porcentaje = (valor: number) => `${(valor * 100).toLocaleString("es-BO", { maximumFractionDigits: 2 })}%`;

function HojaBoleta({ fila, mes, vistaPrevia }: { fila: FilaPlanilla; mes: string; vistaPrevia: boolean }) {
  const ingresos: [string, number][] = [["Haber básico", fila.haberBasico]];
  if (fila.descuentoDiasNoPagados > 0) {
    const detalle = [
      fila.diasSinGoce ? `${fila.diasSinGoce} sin goce` : "",
      fila.diasAntesDelIngreso ? `${fila.diasAntesDelIngreso} antes del ingreso` : "",
    ]
      .filter(Boolean)
      .join(", ");
    ingresos.push([`Días no pagados (${detalle})`, -fila.descuentoDiasNoPagados]);
  }
  ingresos.push([`Bono de antigüedad (${fila.porcentajeBono}%)`, fila.bonoAntiguedad]);
  const descuentos: [string, number][] = [[`Aporte laboral a la Gestora (${porcentaje(parametrosPlanilla.aporteLaboralAfp)})`, fila.aporteLaboral]];
  if (fila.aporteNacionalSolidario > 0) descuentos.push(["Aporte nacional solidario", fila.aporteNacionalSolidario]);
  descuentos.push(["RC-IVA", fila.rcIva]);

  return (
    <article className="mx-auto w-full max-w-3xl rounded-xl border bg-card p-6 shadow-sm sm:p-10 print:max-w-none print:rounded-none print:border-0 print:p-0 print:shadow-none">
      <header className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-heading text-lg font-semibold">{empresa.razonSocial}</p>
          <p className="text-sm text-muted-foreground">NIT {empresa.nit}</p>
          <p className="text-sm text-muted-foreground">{empresa.direccion}</p>
        </div>
        <div className="sm:text-right">
          <h1 className="font-heading text-xl font-semibold text-primary">BOLETA DE PAGO</h1>
          <p className="text-sm">{formatearMes(mes)}</p>
          {vistaPrevia && <p className="text-xs font-medium text-advertencia">Vista previa: planilla sin cerrar</p>}
        </div>
      </header>

      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 py-5 text-sm">
        <Dato etiqueta="Nombre" valor={fila.nombreCompleto} destacado />
        <Dato etiqueta="Carnet de identidad" valor={fila.carnetIdentidad} />
        <Dato etiqueta="Cargo" valor={fila.cargo} />
        <Dato etiqueta="Fecha de ingreso" valor={formatearFecha(fila.fechaIngreso)} />
        <Dato etiqueta="Años de servicio" valor={String(fila.aniosServicio)} />
        <Dato etiqueta="Días pagados" valor={`${fila.diasPagados} de ${parametrosPlanilla.diasDelMesComercial}`} />
      </dl>

      <div className="grid gap-4 sm:grid-cols-2">
        <Bloque titulo="Ingresos" filas={ingresos} total={["Total ganado", fila.totalGanado]} />
        <Bloque titulo="Descuentos" filas={descuentos} total={["Total descuentos", fila.totalDescuentos]} />
      </div>

      <div className="mt-5 rounded-lg bg-marca-suave px-4 py-3">
        <div className="flex items-baseline justify-between gap-4">
          <span className="font-semibold text-primary">LÍQUIDO PAGABLE</span>
          <span className="font-heading text-2xl font-semibold text-primary tabular-nums">Bs {formatearImporte(fila.liquidoPagable)}</span>
        </div>
        <p className="mt-1 text-xs">Son: {montoALetras(fila.liquidoPagable)}</p>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Depósito en la cuenta {fila.cuentaBancaria}</p>

      <div className="mt-16 grid grid-cols-2 gap-10 text-center text-xs text-muted-foreground">
        <div className="border-t pt-2">Por {empresa.razonSocial}</div>
        <div className="border-t pt-2">Recibí conforme</div>
      </div>
    </article>
  );
}

function Dato({ etiqueta, valor, destacado }: { etiqueta: string; valor: string; destacado?: boolean }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground uppercase">{etiqueta}</dt>
      <dd className={cn(destacado && "font-semibold")}>{valor}</dd>
    </div>
  );
}

function Bloque({ titulo, filas, total }: { titulo: string; filas: [string, number][]; total: [string, number] }) {
  return (
    <div className="flex flex-col text-sm">
      <div className="flex justify-between rounded-md bg-marca-suave px-3 py-1.5 text-xs font-semibold text-primary uppercase">
        <span>{titulo}</span>
        <span className="normal-case">Bs</span>
      </div>
      <dl className="flex flex-1 flex-col gap-1.5 px-3 py-3">
        {filas.map(([concepto, monto]) => (
          <div key={concepto} className="flex justify-between gap-4">
            <dt>{concepto}</dt>
            <dd className="tabular-nums">{monto < 0 ? `-${formatearImporte(-monto)}` : formatearImporte(monto)}</dd>
          </div>
        ))}
      </dl>
      <div className="mx-3 flex justify-between border-t pt-2 font-semibold">
        <span>{total[0]}</span>
        <span className="tabular-nums">{formatearImporte(total[1])}</span>
      </div>
    </div>
  );
}
