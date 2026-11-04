"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarClock, CalendarPlus, Check, Hourglass, Palmtree, X } from "lucide-react";
import { toast } from "sonner";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { CalendarioEquipo } from "@/components/rrhh/calendario-equipo";
import { DialogoRechazo } from "@/components/rrhh/dialogos-dias-libres-permisos";
import { DialogoSolicitudVacacion } from "@/components/rrhh/dialogo-solicitud-vacacion";
import { InsigniaEstadoSolicitud, formatearRango } from "@/components/rrhh/insignias";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { nombresEstadoSolicitud } from "@/datos/catalogos";
import { sumarDias } from "@/datos/fechas";
import { parametrosVacaciones } from "@/datos/parametros";
import type { EstadoSolicitud, SolicitudVacacion } from "@/datos/tipos";
import { resolverSolicitud } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { personaPorId, vacacionEnCurso } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearAntiguedad, formatearFecha, iniciales, nombreCompleto, pluralizar } from "@/lib/formato";
import { useFiltroUrl } from "@/lib/use-filtro-url";
import { diasPorAntiguedad, resumenVacaciones } from "@/lib/vacaciones";

type Vista = "solicitudes" | "saldos" | "calendario";
const vistas: Vista[] = ["solicitudes", "saldos", "calendario"];
const opcionesEstado: Record<EstadoSolicitud | "todas", string> = { todas: "Todas las solicitudes", ...nombresEstadoSolicitud };

export function VistaVacaciones() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [vista, setVista] = useFiltroUrl<Vista>("vista", "solicitudes", vistas);
  const [dialogoSolicitud, setDialogoSolicitud] = useState(false);

  const pendientes = estado.solicitudesVacacion.filter((solicitud) => solicitud.estado === "pendiente");
  const fueraHoy = estado.personas.filter((persona) => vacacionEnCurso(estado, persona.id, hoy));
  const enTreintaDias = sumarDias(hoy, 30);
  const programadas = estado.solicitudesVacacion.filter(
    (solicitud) => solicitud.estado === "aprobada" && solicitud.desde > hoy && solicitud.desde <= enTreintaDias,
  );

  return (
    <>
      <EncabezadoPagina
        titulo="Vacaciones"
        descripcion="Días que corresponden a cada persona según su antigüedad, solicitudes y quién está fuera."
        acciones={
          <Button onClick={() => setDialogoSolicitud(true)}>
            <CalendarPlus />
            Nueva solicitud
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Indicador
          titulo="Solicitudes por aprobar"
          valor={pendientes.length}
          detalle={pendientes.length === 0 ? "Nada pendiente" : estado.rol === "gerente" ? "Las aprueba usted" : "Las aprueba el gerente"}
          icono={Hourglass}
        />
        <Indicador
          titulo="De vacaciones hoy"
          valor={fueraHoy.length}
          detalle={fueraHoy.length === 0 ? "Todo el equipo está en la oficina" : fueraHoy.map((persona) => nombreCompleto(persona)).join(", ")}
          icono={Palmtree}
        />
        <Indicador
          titulo="Programadas en 30 días"
          valor={programadas.length}
          detalle={
            programadas.length === 0
              ? "Sin vacaciones aprobadas próximas"
              : programadas.map((solicitud) => `${personaPorId(estado, solicitud.idPersona)?.nombres.split(" ")[0]} desde el ${formatearFecha(solicitud.desde)}`).join(", ")
          }
          icono={CalendarClock}
        />
      </div>

      <Tabs value={vista} onValueChange={(valor) => setVista(valor as Vista)}>
        <TabsList>
          <TabsTrigger value="solicitudes">
            Solicitudes
            {pendientes.length > 0 && (
              <span className="rounded-full bg-advertencia-suave px-1.5 text-xs text-advertencia tabular-nums">{pendientes.length}</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="saldos">Saldos por persona</TabsTrigger>
          <TabsTrigger value="calendario">Calendario</TabsTrigger>
        </TabsList>
        <TabsContent value="solicitudes" className="pt-2">
          <TablaSolicitudes />
        </TabsContent>
        <TabsContent value="saldos" className="pt-2">
          <TablaSaldos />
        </TabsContent>
        <TabsContent value="calendario" className="pt-2">
          <CalendarioEquipo />
        </TabsContent>
      </Tabs>

      <DialogoSolicitudVacacion abierto={dialogoSolicitud} alCambiarAbierto={setDialogoSolicitud} />
    </>
  );
}

function TablaSolicitudes() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const [filtro, setFiltro] = useFiltroUrl<EstadoSolicitud | "todas">("estado", "todas", Object.keys(opcionesEstado) as (EstadoSolicitud | "todas")[]);
  const [idRechazo, setIdRechazo] = useState<string | null>(null);
  const puedeAprobar = estado.rol === "gerente";
  const idUsuario = usuarioDelRol(estado).id;

  // Pendientes primero; después, de la más reciente a la más antigua.
  const solicitudes = estado.solicitudesVacacion
    .filter((solicitud) => filtro === "todas" || solicitud.estado === filtro)
    .sort((a, b) => Number(b.estado === "pendiente") - Number(a.estado === "pendiente") || b.desde.localeCompare(a.desde));

  function aprobar(solicitud: SolicitudVacacion) {
    const persona = personaPorId(estado, solicitud.idPersona);
    const deshacer = resolverSolicitud(solicitud.id, true, idUsuario);
    toast.success(`Vacaciones aprobadas para ${persona ? nombreCompleto(persona) : "la persona"}.`, {
      description: `Se descuentan ${pluralizar(solicitud.diasHabiles, "día", "días")} de su saldo.`,
      action: { label: "Deshacer", onClick: deshacer },
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <SelectorSimple opciones={opcionesEstado} valor={filtro} alCambiar={setFiltro} className="sm:w-60" />
      <Card className="py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Persona</TableHead>
              <TableHead>Fechas</TableHead>
              <TableHead className="text-right">Días</TableHead>
              <TableHead className="hidden lg:table-cell">Comentario</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead className="pr-4 text-right" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {solicitudes.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="py-10 text-center text-muted-foreground">
                  No hay solicitudes con este estado.
                </TableCell>
              </TableRow>
            )}
            {solicitudes.map((solicitud) => {
              const persona = personaPorId(estado, solicitud.idPersona);
              if (!persona) return null;
              const resumen = resumenVacaciones(persona, estado.solicitudesVacacion, hoy);
              const alcanza = solicitud.diasHabiles <= resumen.saldo;
              const resolutor = solicitud.idResolutor ? personaPorId(estado, solicitud.idResolutor) : undefined;
              return (
                <TableRow key={solicitud.id}>
                  <TableCell className="pl-4">
                    <Link href={`/personal/${persona.id}`} className="font-medium hover:underline">
                      {nombreCompleto(persona)}
                    </Link>
                    <p className="text-xs text-muted-foreground">Solicitada el {formatearFecha(solicitud.fechaSolicitud)}</p>
                  </TableCell>
                  <TableCell className="tabular-nums">{formatearRango(solicitud.desde, solicitud.hasta)}</TableCell>
                  <TableCell className="text-right tabular-nums">{solicitud.diasHabiles}</TableCell>
                  <TableCell className="hidden max-w-64 text-muted-foreground lg:table-cell">
                    <span className="line-clamp-2 whitespace-normal">{solicitud.comentario || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col items-start gap-1">
                      <InsigniaEstadoSolicitud estado={solicitud.estado} />
                      {solicitud.estado === "rechazada" && solicitud.motivoRechazo && (
                        <span className="max-w-56 text-xs whitespace-normal text-muted-foreground">{solicitud.motivoRechazo}</span>
                      )}
                      {solicitud.estado !== "pendiente" && resolutor && solicitud.fechaResolucion && (
                        <span className="text-xs text-muted-foreground">
                          {resolutor.nombres.split(" ")[0]}, {formatearFecha(solicitud.fechaResolucion)}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="pr-4 text-right">
                    {solicitud.estado === "pendiente" &&
                      (puedeAprobar ? (
                        <div className="flex justify-end gap-1">
                          <Button size="sm" variant="ghost" onClick={() => setIdRechazo(solicitud.id)}>
                            <X />
                            Rechazar
                          </Button>
                          <Button size="sm" onClick={() => aprobar(solicitud)} disabled={!alcanza} title={alcanza ? undefined : "No le alcanza el saldo"}>
                            <Check />
                            Aprobar
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">La aprueba el gerente</span>
                      ))}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
      <DialogoRechazo idSolicitud={idRechazo} idResolutor={idUsuario} alCerrar={() => setIdRechazo(null)} />
    </div>
  );
}

function TablaSaldos() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const filas = estado.personas
    .map((persona) => ({ persona, resumen: resumenVacaciones(persona, estado.solicitudesVacacion, hoy) }))
    .sort((a, b) => a.persona.fechaIngreso.localeCompare(b.persona.fechaIngreso));

  return (
    <Card className="py-0">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="pl-4">Persona</TableHead>
            <TableHead className="hidden md:table-cell">Antigüedad</TableHead>
            <TableHead className="text-right">Por gestión</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Derecho</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Tomados</TableHead>
            <TableHead className="hidden text-right lg:table-cell">Programados</TableHead>
            <TableHead className="text-right">Saldo</TableHead>
            <TableHead className="hidden pr-4 xl:table-cell">Próximo cambio</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filas.map(({ persona, resumen }) => (
            <TableRow key={persona.id}>
              <TableCell className="pl-4">
                <div className="flex items-center gap-3">
                  <Avatar className="size-8">
                    <AvatarFallback className="bg-marca-suave text-xs text-primary">{iniciales(persona)}</AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col">
                    <Link href={`/personal/${persona.id}`} className="w-fit font-medium hover:underline">
                      {nombreCompleto(persona)}
                    </Link>
                    <span className="text-xs text-muted-foreground">{persona.cargo}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden text-muted-foreground md:table-cell">{formatearAntiguedad(persona.fechaIngreso)}</TableCell>
              <TableCell className="text-right tabular-nums">{resumen.fechaPrimerDerecho ? "-" : `${resumen.diasGestionActual} días`}</TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">{resumen.derecho}</TableCell>
              <TableCell className="hidden text-right tabular-nums sm:table-cell">{resumen.tomados}</TableCell>
              <TableCell className="hidden text-right tabular-nums lg:table-cell">{resumen.programados || "-"}</TableCell>
              <TableCell className="text-right font-semibold tabular-nums">{resumen.saldo}</TableCell>
              <TableCell className="hidden pr-4 text-xs text-muted-foreground xl:table-cell">
                {resumen.fechaPrimerDerecho
                  ? `Cumple el año el ${formatearFecha(resumen.fechaPrimerDerecho)}: ${diasPorAntiguedad(1)} días`
                  : resumen.proximoTramo
                    ? `${resumen.proximoTramo.dias} días por gestión desde el ${formatearFecha(resumen.proximoTramo.fecha)}`
                    : "Ya está en el tramo más alto"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      <p className="border-t px-4 py-3 text-xs text-muted-foreground">
        Derecho: suma de las últimas {parametrosVacaciones.gestionesAcumulables} gestiones cumplidas (lo más antiguo ya no se
        acumula). Tomados y programados: vacaciones aprobadas dentro de esas gestiones, en días hábiles.
      </p>
    </Card>
  );
}

function Indicador({ titulo, valor, detalle, icono: Icono }: { titulo: string; valor: number; detalle: string; icono: typeof Palmtree }) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex items-center justify-between gap-2">
          <span>{titulo}</span>
          <Icono className="size-4" />
        </CardDescription>
        <CardTitle className="font-heading text-3xl font-semibold tabular-nums">{valor}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="line-clamp-2 text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
