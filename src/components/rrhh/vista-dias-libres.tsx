"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarCheck2, CalendarMinus } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { DialogoDiaLibre, DialogoPermiso } from "@/components/rrhh/dialogos-dias-libres-permisos";
import { formatearRango } from "@/components/rrhh/insignias";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nombresTipoMovimientoDiaLibre, nombresTipoPermiso } from "@/datos/catalogos";
import { mesDeFecha } from "@/datos/fechas";
import { parametrosPermisos } from "@/datos/parametros";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { personaPorId } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFecha, formatearNombreMes, nombreCompleto } from "@/lib/formato";
import { useFiltroUrl } from "@/lib/use-filtro-url";
import { diasSinGoceEnMes, resumenPermisos, saldoDiasLibres } from "@/lib/vacaciones";
import { cn } from "@/lib/utils";

type Vista = "saldos" | "dias-libres" | "permisos";
const vistas: Vista[] = ["saldos", "dias-libres", "permisos"];

export function VistaDiasLibres() {
  const [vista, setVista] = useFiltroUrl<Vista>("vista", "saldos", vistas);
  const [dialogoDiaLibre, setDialogoDiaLibre] = useState(false);
  const [dialogoPermiso, setDialogoPermiso] = useState(false);

  return (
    <>
      <EncabezadoPagina
        titulo="Días libres y permisos"
        descripcion={`Días libres ganados por trabajar feriados o fines de semana, y permisos con goce (${parametrosPermisos.diasConGocePorGestion} días al año) o sin goce de haber.`}
        acciones={
          <>
            <Button variant="outline" onClick={() => setDialogoDiaLibre(true)}>
              <CalendarCheck2 />
              Registrar día libre
            </Button>
            <Button onClick={() => setDialogoPermiso(true)}>
              <CalendarMinus />
              Registrar permiso
            </Button>
          </>
        }
      />

      <Tabs value={vista} onValueChange={(valor) => setVista(valor as Vista)}>
        <TabsList>
          <TabsTrigger value="saldos">Saldos por persona</TabsTrigger>
          <TabsTrigger value="dias-libres">Días libres</TabsTrigger>
          <TabsTrigger value="permisos">Permisos</TabsTrigger>
        </TabsList>
        <TabsContent value="saldos" className="pt-2">
          <TablaSaldos />
        </TabsContent>
        <TabsContent value="dias-libres" className="pt-2">
          <TablaDiasLibres />
        </TabsContent>
        <TabsContent value="permisos" className="pt-2">
          <TablaPermisos />
        </TabsContent>
      </Tabs>

      <DialogoDiaLibre abierto={dialogoDiaLibre} alCambiarAbierto={setDialogoDiaLibre} />
      <DialogoPermiso abierto={dialogoPermiso} alCambiarAbierto={setDialogoPermiso} />
    </>
  );
}

function TablaSaldos() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const mes = mesDeFecha(hoy);

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Persona</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Días libres ganados</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Usados</TableHead>
            <TableHead className="text-right">Saldo de días libres</TableHead>
            <TableHead className="text-right">Con goce este año</TableHead>
            <TableHead className="pr-4 text-right">Sin goce este año</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {estado.personas.map((persona) => {
            const diasLibres = saldoDiasLibres(persona.id, estado.movimientosDiasLibres);
            const permisos = resumenPermisos(persona.id, estado.permisos, hoy);
            const sinGoceDelMes = diasSinGoceEnMes(persona.id, estado.permisos, mes);
            return (
              <TableRow key={persona.id}>
                <TableCell className="pl-4">
                  <Link href={`/personal/${persona.id}`} className="font-medium hover:underline">
                    {nombreCompleto(persona)}
                  </Link>
                  <p className="text-xs text-muted-foreground">{persona.cargo}</p>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{diasLibres.ganados}</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{diasLibres.usados}</TableCell>
                <TableCell className={cn("text-right font-semibold tabular-nums", diasLibres.saldo === 0 && "font-normal text-muted-foreground")}>
                  {diasLibres.saldo}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {permisos.conGoce} de {permisos.cupoConGoce}
                </TableCell>
                <TableCell className="pr-4 text-right tabular-nums">
                  {permisos.sinGoce}
                  {sinGoceDelMes > 0 && (
                    <Badge className="ml-2 bg-peligro-suave text-destructive">
                      {sinGoceDelMes} en {formatearNombreMes(mes)}: descuenta
                    </Badge>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function TablaDiasLibres() {
  const estado = useEstadoDemo();
  const movimientos = [...estado.movimientosDiasLibres].sort((a, b) => b.fecha.localeCompare(a.fecha));

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Fecha</TableHead>
            <TableHead>Persona</TableHead>
            <TableHead>Movimiento</TableHead>
            <TableHead className="pr-4">Detalle</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {movimientos.length === 0 && (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                Sin días libres registrados.
              </TableCell>
            </TableRow>
          )}
          {movimientos.map((movimiento) => {
            const persona = personaPorId(estado, movimiento.idPersona);
            return (
              <TableRow key={movimiento.id}>
                <TableCell className="pl-4 tabular-nums">{formatearFecha(movimiento.fecha)}</TableCell>
                <TableCell>
                  {persona && (
                    <Link href={`/personal/${persona.id}`} className="font-medium hover:underline">
                      {nombreCompleto(persona)}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={movimiento.tipo === "ganado" ? "bg-exito-suave text-exito" : "bg-advertencia-suave text-advertencia"}>
                    {nombresTipoMovimientoDiaLibre[movimiento.tipo]}
                  </Badge>
                </TableCell>
                <TableCell className="pr-4 whitespace-normal text-muted-foreground">{movimiento.motivo}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}

function TablaPermisos() {
  const estado = useEstadoDemo();
  const permisos = [...estado.permisos].sort((a, b) => b.desde.localeCompare(a.desde));

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Fechas</TableHead>
            <TableHead>Persona</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead className="text-right">Días</TableHead>
            <TableHead className="pr-4">Motivo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {permisos.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                Sin permisos registrados.
              </TableCell>
            </TableRow>
          )}
          {permisos.map((permiso) => {
            const persona = personaPorId(estado, permiso.idPersona);
            return (
              <TableRow key={permiso.id}>
                <TableCell className="pl-4 tabular-nums">{formatearRango(permiso.desde, permiso.hasta)}</TableCell>
                <TableCell>
                  {persona && (
                    <Link href={`/personal/${persona.id}`} className="font-medium hover:underline">
                      {nombreCompleto(persona)}
                    </Link>
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={permiso.tipo === "con_goce" ? "bg-marca-suave text-primary" : "bg-peligro-suave text-destructive"}>
                    {nombresTipoPermiso[permiso.tipo]}
                  </Badge>
                </TableCell>
                <TableCell className="text-right tabular-nums">{permiso.diasHabiles}</TableCell>
                <TableCell className="pr-4 whitespace-normal text-muted-foreground">{permiso.motivo}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
