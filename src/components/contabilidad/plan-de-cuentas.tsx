"use client";

import { Search } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nombresTipoCuenta } from "@/datos/catalogos";
import { planDeCuentas } from "@/datos/plan-cuentas";
import type { Cuenta, TipoCuenta } from "@/datos/tipos";
import { saldosPorCuenta, type SaldoCuenta } from "@/lib/contabilidad";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { formatearImporte } from "@/lib/formato";
import { useFiltroUrl, useFiltroUrlTexto } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

const opcionesTipo: Record<TipoCuenta | "todos", string> = { todos: "Todos los grupos", ...nombresTipoCuenta };

// Saldo de una cuenta o de un grupo: un grupo suma sus cuentas de movimiento, y
// las regularizadoras (depreciación acumulada) restan.
function saldoDe(cuenta: Cuenta, saldos: Map<string, SaldoCuenta>) {
  if (cuenta.imputable) return saldos.get(cuenta.codigo)?.saldo ?? 0;
  return planDeCuentas
    .filter((hija) => hija.imputable && hija.codigo.startsWith(`${cuenta.codigo}.`))
    .reduce((suma, hija) => {
      const saldo = saldos.get(hija.codigo)?.saldo ?? 0;
      return suma + (hija.regularizadora ? -saldo : saldo);
    }, 0);
}

export function PlanDeCuentas() {
  const { asientos } = useEstadoDemo();
  const saldos = saldosPorCuenta(asientos);
  const [busqueda, setBusqueda] = useFiltroUrlTexto("buscar");
  const [tipo, setTipo] = useFiltroUrl<TipoCuenta | "todos">("grupo", "todos", Object.keys(opcionesTipo) as (TipoCuenta | "todos")[]);

  const texto = busqueda.trim().toLowerCase();
  const visibles = planDeCuentas
    .filter((cuenta) => tipo === "todos" || cuenta.tipo === tipo)
    .filter((cuenta) => texto === "" || cuenta.nombre.toLowerCase().includes(texto) || cuenta.codigo.startsWith(texto));
  const imputables = planDeCuentas.filter((cuenta) => cuenta.imputable).length;

  return (
    <>
      <EncabezadoPagina
        titulo="Plan de cuentas"
        descripcion={`Plan simplificado de una empresa de servicios: ${imputables} cuentas de movimiento en cinco grupos. Los saldos salen de los asientos registrados.`}
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_14rem] lg:max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Código o nombre de la cuenta"
            aria-label="Buscar cuenta"
            className="pl-8"
          />
        </div>
        <SelectorSimple opciones={opcionesTipo} valor={tipo} alCambiar={setTipo} />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-32 pl-4">Código</TableHead>
              <TableHead>Cuenta</TableHead>
              <TableHead className="hidden md:table-cell">Grupo</TableHead>
              <TableHead className="pr-4 text-right">Saldo (Bs)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                  Ninguna cuenta coincide con la búsqueda.
                </TableCell>
              </TableRow>
            )}
            {visibles.map((cuenta) => {
              const saldo = saldoDe(cuenta, saldos);
              return (
                <TableRow key={cuenta.codigo} className={cn(cuenta.nivel === 1 && "bg-muted/50 hover:bg-muted/50")}>
                  <TableCell className="pl-4 font-mono text-xs text-muted-foreground tabular-nums">{cuenta.codigo}</TableCell>
                  <TableCell>
                    <span
                      className={cn("flex items-center gap-2", !cuenta.imputable && "font-medium", cuenta.nivel === 1 && "font-semibold")}
                      style={{ paddingLeft: `${(cuenta.nivel - 1) * 1.25}rem` }}
                    >
                      {cuenta.nombre}
                      {cuenta.regularizadora && (
                        <Badge variant="outline" className="font-normal">
                          Regularizadora
                        </Badge>
                      )}
                    </span>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground md:table-cell">{nombresTipoCuenta[cuenta.tipo]}</TableCell>
                  <TableCell
                    className={cn(
                      "pr-4 text-right tabular-nums",
                      !cuenta.imputable && "font-medium",
                      saldo === 0 && "text-muted-foreground",
                      saldo < 0 && "text-destructive",
                    )}
                  >
                    {saldo === 0 ? "-" : formatearImporte(saldo)}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
