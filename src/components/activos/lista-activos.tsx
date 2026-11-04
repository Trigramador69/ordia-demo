"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { CategoriaActivo, EstadoActivo } from "@/datos/tipos";
import { cuotaMensual, depreciacionDelMesDeActivo, nombresCategoriaActivo, valorEnLibros } from "@/lib/activos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { personaPorId, ultimoMesDepreciado } from "@/lib/demo/consultas";
import { formatearFecha, formatearImporte, formatearMes, formatearMonto, nombreCompleto, pluralizar } from "@/lib/formato";
import { useFiltroUrl, useFiltroUrlTexto } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

export const nombresEstadoActivo: Record<EstadoActivo, string> = {
  en_uso: "En uso",
  en_reparacion: "En reparación",
  baja: "Dado de baja",
};

const clasesEstadoActivo: Record<EstadoActivo, string> = {
  en_uso: "bg-exito-suave text-exito",
  en_reparacion: "bg-advertencia-suave text-advertencia",
  baja: "bg-muted text-muted-foreground",
};

export function InsigniaEstadoActivo({ estado }: { estado: EstadoActivo }) {
  return <Badge className={clasesEstadoActivo[estado]}>{nombresEstadoActivo[estado]}</Badge>;
}

const todas = "todas";

export function ListaActivos() {
  const estado = useEstadoDemo();
  const router = useRouter();
  const filtrosActuales = useSearchParams().toString();
  const hastaMes = ultimoMesDepreciado(estado);
  const opcionesCategoria: Record<CategoriaActivo | typeof todas, string> = { [todas]: "Todas las categorías", ...nombresCategoriaActivo };
  const opcionesEstado: Record<EstadoActivo | typeof todas, string> = { [todas]: "Todos los estados", ...nombresEstadoActivo };
  const [busqueda, setBusqueda] = useFiltroUrlTexto("buscar");
  const [categoria, setCategoria] = useFiltroUrl<CategoriaActivo | typeof todas>("categoria", todas, Object.keys(opcionesCategoria) as (CategoriaActivo | typeof todas)[]);
  const [estadoActivo, setEstadoActivo] = useFiltroUrl<EstadoActivo | typeof todas>("estado", todas, Object.keys(opcionesEstado) as (EstadoActivo | typeof todas)[]);

  const vigentes = estado.activos.filter((activo) => activo.estado !== "baja");
  const costo = vigentes.reduce((suma, activo) => suma + activo.valorCompra, 0);
  const libros = vigentes.reduce((suma, activo) => suma + valorEnLibros(activo, hastaMes), 0);
  const mensual = vigentes.reduce((suma, activo) => suma + (depreciacionDelMesDeActivo(activo, hastaMes) > 0 ? cuotaMensual(activo) : 0), 0);

  const texto = busqueda.trim().toLowerCase();
  const visibles = estado.activos
    .filter((activo) => categoria === todas || activo.categoria === categoria)
    .filter((activo) => estadoActivo === todas || activo.estado === estadoActivo)
    .filter((activo) => {
      if (texto === "") return true;
      const responsable = activo.idResponsable ? personaPorId(estado, activo.idResponsable) : undefined;
      return (
        activo.nombre.toLowerCase().includes(texto) ||
        activo.codigo.toLowerCase().includes(texto) ||
        (responsable ? nombreCompleto(responsable).toLowerCase().includes(texto) : false)
      );
    });
  const enlaceFicha = (idActivo: string) => `/activos/${idActivo}${filtrosActuales ? `?filtros=${encodeURIComponent(filtrosActuales)}` : ""}`;

  return (
    <>
      <EncabezadoPagina
        titulo="Activos fijos"
        descripcion={`${pluralizar(estado.activos.length, "activo", "activos")}, cada uno con su responsable. Valores en libros a ${formatearMes(hastaMes).toLowerCase()}, el último mes depreciado.`}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra titulo="Valor de compra" valor={formatearMonto(costo)} detalle={pluralizar(vigentes.length, "activo vigente", "activos vigentes")} />
        <Cifra titulo="Valor en libros" valor={formatearMonto(Math.round(libros))} detalle={`Depreciado: ${formatearMonto(Math.round(costo - libros))}`} />
        <Cifra titulo="Depreciación mensual" valor={formatearMonto(Math.round(mensual))} detalle="Lineal, según la vida útil de cada categoría" />
        <Cifra
          titulo="En reparación"
          valor={String(estado.activos.filter((activo) => activo.estado === "en_reparacion").length)}
          detalle={pluralizar(estado.activos.filter((activo) => activo.estado === "baja").length, "dado de baja", "dados de baja")}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_14rem_14rem] lg:max-w-4xl">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Código, nombre o responsable" aria-label="Buscar activo" className="pl-8" />
        </div>
        <SelectorSimple opciones={opcionesCategoria} valor={categoria} alCambiar={setCategoria} />
        <SelectorSimple opciones={opcionesEstado} valor={estadoActivo} alCambiar={setEstadoActivo} />
      </div>

      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Activo</TableHead>
              <TableHead className="hidden lg:table-cell">Categoría</TableHead>
              <TableHead className="hidden md:table-cell">Responsable</TableHead>
              <TableHead className="hidden text-right sm:table-cell">Compra</TableHead>
              <TableHead className="text-right">Valor en libros</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Ningún activo coincide con los filtros.
                </TableCell>
              </TableRow>
            )}
            {visibles.map((activo) => {
              const responsable = activo.idResponsable ? personaPorId(estado, activo.idResponsable) : undefined;
              const libro = activo.estado === "baja" ? null : valorEnLibros(activo, hastaMes);
              return (
                <TableRow key={activo.id} className="cursor-pointer" onClick={() => router.push(enlaceFicha(activo.id))}>
                  <TableCell className="pl-4">
                    <Link href={enlaceFicha(activo.id)} className="font-medium hover:underline" onClick={(evento) => evento.stopPropagation()}>
                      {activo.nombre}
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {activo.codigo} · {activo.ubicacion}
                    </p>
                  </TableCell>
                  <TableCell className="hidden text-muted-foreground lg:table-cell">{nombresCategoriaActivo[activo.categoria]}</TableCell>
                  <TableCell className="hidden md:table-cell">{responsable ? nombreCompleto(responsable) : "-"}</TableCell>
                  <TableCell className="hidden text-right tabular-nums sm:table-cell">
                    {formatearImporte(activo.valorCompra)}
                    <span className="block text-xs text-muted-foreground">{formatearFecha(activo.fechaCompra)}</span>
                  </TableCell>
                  <TableCell className={cn("text-right tabular-nums", libro === 0 && "text-muted-foreground")}>
                    {libro === null ? "-" : formatearImporte(libro)}
                    {libro === 0 && <span className="block text-xs">totalmente depreciado</span>}
                  </TableCell>
                  <TableCell>
                    <InsigniaEstadoActivo estado={activo.estado} />
                  </TableCell>
                  <TableCell>
                    <ChevronRight className="size-4 text-muted-foreground" />
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

export function Cifra({ titulo, valor, detalle }: { titulo: string; valor: string; detalle: string }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className="font-heading text-2xl font-semibold tabular-nums">{valor}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
