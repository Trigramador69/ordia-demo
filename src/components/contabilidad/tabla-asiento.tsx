import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { buscarCuenta } from "@/datos/plan-cuentas";
import type { LineaAsiento } from "@/datos/tipos";
import { totalesDeAsiento } from "@/lib/contabilidad";
import { formatearImporte } from "@/lib/formato";

// Líneas de un asiento con sus cuentas, el debe y el haber, y los totales.
export function TablaAsiento({ lineas }: { lineas: LineaAsiento[] }) {
  const { debe, haber } = totalesDeAsiento(lineas);
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Cuenta</TableHead>
          <TableHead className="text-right">Debe (Bs)</TableHead>
          <TableHead className="text-right">Haber (Bs)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lineas.map((linea, indice) => (
          <TableRow key={`${linea.codigoCuenta}-${indice}`}>
            <TableCell className={linea.haber > 0 ? "pl-8" : undefined}>
              <span className="mr-2 font-mono text-xs text-muted-foreground">{linea.codigoCuenta}</span>
              {buscarCuenta(linea.codigoCuenta)?.nombre}
              {linea.detalle && <span className="block text-xs text-muted-foreground">{linea.detalle}</span>}
            </TableCell>
            <TableCell className="text-right tabular-nums">{linea.debe > 0 ? formatearImporte(linea.debe) : ""}</TableCell>
            <TableCell className="text-right tabular-nums">{linea.haber > 0 ? formatearImporte(linea.haber) : ""}</TableCell>
          </TableRow>
        ))}
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell className="font-medium">Totales</TableCell>
          <TableCell className="text-right font-medium tabular-nums">{formatearImporte(debe)}</TableCell>
          <TableCell className="text-right font-medium tabular-nums">{formatearImporte(haber)}</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}
