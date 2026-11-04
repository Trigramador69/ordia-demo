"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { InsigniaAusencia } from "@/components/rrhh/insignias";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { nombresArea } from "@/datos/catalogos";
import type { Area } from "@/datos/tipos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { ausenciaEnFecha } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearAntiguedad, formatearFecha, formatearMonto, iniciales, nombreCompleto, pluralizar } from "@/lib/formato";
import { useFiltroUrl, useFiltroUrlTexto } from "@/lib/use-filtro-url";
import { resumenVacaciones, saldoDiasLibres } from "@/lib/vacaciones";

const opcionesArea: Record<Area | "todas", string> = { todas: "Todas las áreas", ...nombresArea };

export function ListaPersonal() {
  const estado = useEstadoDemo();
  const router = useRouter();
  const filtrosActuales = useSearchParams().toString();
  const hoy = fechaDeHoy();
  const [busqueda, setBusqueda] = useFiltroUrlTexto("buscar");
  const [area, setArea] = useFiltroUrl<Area | "todas">("area", "todas", Object.keys(opcionesArea) as (Area | "todas")[]);

  const filas = estado.personas.map((persona) => ({
    persona,
    vacaciones: resumenVacaciones(persona, estado.solicitudesVacacion, hoy),
    diasLibres: saldoDiasLibres(persona.id, estado.movimientosDiasLibres).saldo,
    ausencia: ausenciaEnFecha(estado, persona.id, hoy),
  }));
  const fueraHoy = filas.filter((fila) => fila.ausencia).length;
  const totalBasicos = estado.personas.reduce((suma, persona) => suma + persona.sueldoBasico, 0);

  const texto = busqueda.trim().toLowerCase();
  const visibles = filas
    .filter((fila) => area === "todas" || fila.persona.area === area)
    .filter(
      (fila) =>
        texto === "" ||
        nombreCompleto(fila.persona).toLowerCase().includes(texto) ||
        fila.persona.cargo.toLowerCase().includes(texto) ||
        fila.persona.carnetIdentidad.toLowerCase().includes(texto),
    );

  const enlaceFicha = (idPersona: string) =>
    `/personal/${idPersona}${filtrosActuales ? `?filtros=${encodeURIComponent(filtrosActuales)}` : ""}`;

  return (
    <>
      <EncabezadoPagina
        titulo="Personal"
        descripcion={`${pluralizar(estado.personas.length, "persona", "personas")} · ${fueraHoy === 0 ? "todos en la oficina hoy" : `${fueraHoy} fuera hoy`} · sueldos básicos por ${formatearMonto(totalBasicos)} al mes`}
      />

      <div className="grid gap-3 sm:grid-cols-[1fr_14rem] lg:max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={busqueda}
            onChange={(evento) => setBusqueda(evento.target.value)}
            placeholder="Nombre, cargo o carnet"
            aria-label="Buscar personal"
            className="pl-8"
          />
        </div>
        <SelectorSimple opciones={opcionesArea} valor={area} alCambiar={setArea} />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Persona</TableHead>
              <TableHead className="hidden lg:table-cell">Área</TableHead>
              <TableHead className="hidden md:table-cell">Ingreso</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Sueldo básico</TableHead>
              <TableHead className="text-right">Vacaciones</TableHead>
              <TableHead className="hidden text-right md:table-cell">Días libres</TableHead>
              <TableHead>Hoy</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-muted-foreground">
                  Nadie coincide con los filtros.
                </TableCell>
              </TableRow>
            )}
            {visibles.map(({ persona, vacaciones, diasLibres, ausencia }) => (
              <TableRow key={persona.id} className="cursor-pointer" onClick={() => router.push(enlaceFicha(persona.id))}>
                <TableCell className="pl-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="size-8">
                      <AvatarFallback className="bg-marca-suave text-xs text-primary">{iniciales(persona)}</AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <Link
                        href={enlaceFicha(persona.id)}
                        className="w-fit rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={(evento) => evento.stopPropagation()}
                      >
                        {nombreCompleto(persona)}
                      </Link>
                      <span className="text-xs text-muted-foreground">{persona.cargo}</span>
                    </div>
                  </div>
                </TableCell>
                <TableCell className="hidden text-muted-foreground lg:table-cell">{nombresArea[persona.area]}</TableCell>
                <TableCell className="hidden md:table-cell">
                  <span className="block tabular-nums">{formatearFecha(persona.fechaIngreso)}</span>
                  <span className="text-xs text-muted-foreground">{formatearAntiguedad(persona.fechaIngreso)}</span>
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{formatearMonto(persona.sueldoBasico)}</TableCell>
                <TableCell className="text-right tabular-nums">
                  {vacaciones.fechaPrimerDerecho ? (
                    <span className="text-xs text-muted-foreground">Desde el {formatearFecha(vacaciones.fechaPrimerDerecho)}</span>
                  ) : (
                    <>
                      <span className="block font-medium">{pluralizar(vacaciones.saldo, "día", "días")}</span>
                      <span className="text-xs text-muted-foreground">{vacaciones.diasGestionActual} por gestión</span>
                    </>
                  )}
                </TableCell>
                <TableCell className="hidden text-right tabular-nums md:table-cell">{diasLibres || "-"}</TableCell>
                <TableCell>
                  {ausencia ? <InsigniaAusencia tipo={ausencia.tipo} /> : <span className="text-xs text-muted-foreground">En la oficina</span>}
                </TableCell>
                <TableCell>
                  <ChevronRight className="size-4 text-muted-foreground" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>
    </>
  );
}
