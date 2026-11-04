"use client";

import { useState } from "react";
import { CircleAlert, Plus, Search } from "lucide-react";
import { toast } from "sonner";
import { DetalleOportunidad } from "@/components/crm/detalle-oportunidad";
import { DialogoNuevaOportunidad, DialogoPerdida } from "@/components/crm/dialogos";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { usuarioDelRol } from "@/components/panel/selector-rol";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { etapas, nombresEtapa, umbralesAlarmas } from "@/datos/catalogos";
import { idsVendedores } from "@/datos/equipo";
import { diferenciaEnDias, mesDeFecha, sumarDias } from "@/datos/fechas";
import type { EtapaOportunidad, Oportunidad } from "@/datos/tipos";
import { esAbierta, montoPonderado, ultimasActividades } from "@/lib/crm";
import { moverOportunidad } from "@/lib/demo/acciones";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { clientePorId, idVendedorDelRol, oportunidadesVisibles, personaPorId } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearMonto, iniciales, nombreCompleto, pluralizar } from "@/lib/formato";
import { useFiltroUrl, useFiltroUrlTexto } from "@/lib/use-filtro-url";
import { cn } from "@/lib/utils";

// Las columnas de ganadas y perdidas muestran solo lo cerrado en este tiempo.
const diasCerradasVisibles = 30;
const todos = "todos";

function formatearMontoCorto(monto: number) {
  if (monto >= 1_000_000) return `Bs ${(monto / 1_000_000).toLocaleString("es-BO", { maximumFractionDigits: 1 })} M`;
  if (monto >= 1000) return `Bs ${Math.round(monto / 1000).toLocaleString("es-BO")} mil`;
  return formatearMonto(monto);
}

export function TableroEmbudo() {
  const estado = useEstadoDemo();
  const hoy = fechaDeHoy();
  const esVentas = idVendedorDelRol(estado) !== null;
  const opcionesVendedor: Record<string, string> = { [todos]: "Todo el equipo comercial" };
  for (const id of idsVendedores) {
    const persona = personaPorId(estado, id);
    if (persona) opcionesVendedor[id] = nombreCompleto(persona);
  }
  const [idVendedor, setIdVendedor] = useFiltroUrl<string>("vendedor", todos, Object.keys(opcionesVendedor));
  const [busqueda, setBusqueda] = useFiltroUrlTexto("buscar");
  const [arrastrando, setArrastrando] = useState<string | null>(null);
  const [sobre, setSobre] = useState<EtapaOportunidad | null>(null);
  const [seleccionada, setSeleccionada] = useState<string | null>(null);
  const [perdiendo, setPerdiendo] = useState<Oportunidad | null>(null);
  const [dialogoNueva, setDialogoNueva] = useState(false);

  const { porOportunidad } = ultimasActividades(estado.actividades);
  const desdeCerradas = sumarDias(hoy, -diasCerradasVisibles);
  const texto = busqueda.trim().toLowerCase();
  const visibles = oportunidadesVisibles(estado)
    .filter((oportunidad) => esVentas || idVendedor === todos || oportunidad.idVendedor === idVendedor)
    .filter((oportunidad) => esAbierta(oportunidad) || (oportunidad.fechaCierre ?? "") >= desdeCerradas)
    .filter((oportunidad) => {
      if (texto === "") return true;
      const cliente = clientePorId(estado, oportunidad.idCliente);
      return oportunidad.titulo.toLowerCase().includes(texto) || (cliente?.razonSocial.toLowerCase().includes(texto) ?? false);
    });

  const abiertas = visibles.filter(esAbierta);
  const totalAbierto = abiertas.reduce((suma, oportunidad) => suma + oportunidad.monto, 0);
  const ponderado = abiertas.reduce((suma, oportunidad) => suma + montoPonderado(oportunidad), 0);
  const mesActual = mesDeFecha(hoy);
  const ganadasMes = oportunidadesVisibles(estado)
    .filter((oportunidad) => esVentas || idVendedor === todos || oportunidad.idVendedor === idVendedor)
    .filter((oportunidad) => oportunidad.etapa === "ganada" && oportunidad.fechaCierre?.startsWith(mesActual));
  const diasSinActividad = (oportunidad: Oportunidad) => {
    const ultima = porOportunidad.get(oportunidad.id) ?? oportunidad.historialEtapas.at(-1)?.fecha ?? oportunidad.fechaCreacion;
    return diferenciaEnDias(ultima, hoy);
  };
  const umbral = (oportunidad: Oportunidad) =>
    oportunidad.etapa === "propuesta" ? umbralesAlarmas.diasPropuestaSinRespuesta : umbralesAlarmas.diasOportunidadSinActividad;
  const estancadas = abiertas.filter((oportunidad) => diasSinActividad(oportunidad) > umbral(oportunidad));

  function soltar(etapa: EtapaOportunidad) {
    const id = arrastrando;
    setArrastrando(null);
    setSobre(null);
    const oportunidad = abiertas.find((item) => item.id === id);
    if (!oportunidad || oportunidad.etapa === etapa) return;
    if (etapa === "perdida") {
      setPerdiendo(oportunidad);
      return;
    }
    const deshacer = moverOportunidad(oportunidad.id, etapa, usuarioDelRol(estado).id);
    toast.success(etapa === "ganada" ? `Ganada: ${oportunidad.titulo}.` : `${oportunidad.titulo} pasó a ${nombresEtapa[etapa]}.`, {
      description: etapa === "ganada" && estado.modulos.facturacion ? "Ábrala para emitir su factura." : undefined,
      action: { label: "Deshacer", onClick: deshacer },
    });
  }

  return (
    <>
      <EncabezadoPagina
        titulo="Embudo de ventas"
        descripcion="Arrastre una oportunidad a otra etapa, o ábrala para ver su detalle y moverla desde ahí."
        acciones={
          <Button onClick={() => setDialogoNueva(true)}>
            <Plus />
            Nueva oportunidad
          </Button>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Cifra titulo="En el embudo" valor={formatearMonto(totalAbierto)} detalle={pluralizar(abiertas.length, "oportunidad abierta", "oportunidades abiertas")} />
        <Cifra titulo="Ponderado por probabilidad" valor={formatearMonto(Math.round(ponderado))} detalle="Lo que se espera cerrar" />
        <Cifra
          titulo="Ganado este mes"
          valor={formatearMonto(ganadasMes.reduce((suma, oportunidad) => suma + oportunidad.monto, 0))}
          detalle={pluralizar(ganadasMes.length, "venta", "ventas")}
        />
        <Cifra
          titulo="Estancadas"
          valor={String(estancadas.length)}
          detalle={`Sin actividad: más de ${umbralesAlarmas.diasOportunidadSinActividad} días, o ${umbralesAlarmas.diasPropuestaSinRespuesta} si hay propuesta`}
          alerta={estancadas.length > 0}
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-[1fr_16rem] lg:max-w-2xl">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Oportunidad o cliente" aria-label="Buscar oportunidad" className="pl-8" />
        </div>
        {!esVentas && <SelectorSimple opciones={opcionesVendedor} valor={idVendedor} alCambiar={setIdVendedor} />}
      </div>

      <div className="-mx-4 flex gap-3 overflow-x-auto px-4 pb-4 md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
        {etapas.map((etapa) => {
          const enEtapa = visibles
            .filter((oportunidad) => oportunidad.etapa === etapa)
            .sort((a, b) => (esAbierta(a) ? b.monto - a.monto : (b.fechaCierre ?? "").localeCompare(a.fechaCierre ?? "")));
          const total = enEtapa.reduce((suma, oportunidad) => suma + oportunidad.monto, 0);
          const cerrada = etapa === "ganada" || etapa === "perdida";
          return (
            <section
              key={etapa}
              aria-label={nombresEtapa[etapa]}
              onDragOver={(evento) => {
                if (!arrastrando) return;
                evento.preventDefault();
                setSobre(etapa);
              }}
              onDragLeave={() => setSobre((actual) => (actual === etapa ? null : actual))}
              onDrop={() => soltar(etapa)}
              className={cn(
                "flex w-68 shrink-0 flex-col rounded-xl border bg-muted/30 p-2.5 transition-colors",
                sobre === etapa && "border-primary/60 bg-primary/5",
                etapa === "ganada" && "bg-exito-suave/40",
                etapa === "perdida" && "bg-peligro-suave/40",
              )}
            >
              <header className="mb-2.5 flex items-center justify-between gap-2 px-1">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  {nombresEtapa[etapa]}
                  <span className="rounded-full bg-background px-1.5 text-xs font-normal text-muted-foreground">{enEtapa.length}</span>
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{formatearMontoCorto(total)}</span>
              </header>
              {cerrada && <p className="mb-2 px-1 text-xs text-muted-foreground">Últimos {diasCerradasVisibles} días</p>}
              <div className="flex flex-col gap-2">
                {enEtapa.map((oportunidad) => {
                  const cliente = clientePorId(estado, oportunidad.idCliente);
                  const vendedor = personaPorId(estado, oportunidad.idVendedor);
                  const dias = diasSinActividad(oportunidad);
                  const alarma = !cerrada && dias > umbral(oportunidad);
                  return (
                    <div
                      key={oportunidad.id}
                      role="button"
                      tabIndex={0}
                      draggable={!cerrada}
                      onDragStart={() => setArrastrando(oportunidad.id)}
                      onDragEnd={() => {
                        setArrastrando(null);
                        setSobre(null);
                      }}
                      onClick={() => setSeleccionada(oportunidad.id)}
                      onKeyDown={(evento) => {
                        if (evento.key === "Enter" || evento.key === " ") {
                          evento.preventDefault();
                          setSeleccionada(oportunidad.id);
                        }
                      }}
                      className={cn(
                        "rounded-lg border bg-card p-3 text-sm shadow-xs outline-none transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring",
                        !cerrada && "cursor-grab active:cursor-grabbing",
                        arrastrando === oportunidad.id && "opacity-50",
                        alarma && "border-destructive/40",
                      )}
                    >
                      <p className="leading-snug font-medium">{oportunidad.titulo}</p>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">{cliente?.razonSocial}</p>
                      <div className="mt-2.5 flex items-center justify-between gap-2">
                        <span className="font-semibold tabular-nums">{formatearMonto(oportunidad.monto)}</span>
                        <span className="flex items-center gap-1.5">
                          {!cerrada && (
                            <span
                              title="Días desde la última actividad"
                              className={cn(
                                "flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] tabular-nums",
                                alarma ? "bg-peligro-suave text-destructive" : "bg-muted text-muted-foreground",
                              )}
                            >
                              {alarma && <CircleAlert className="size-3" />}
                              {dias === 0 ? "hoy" : `${dias} d`}
                            </span>
                          )}
                          {vendedor && (
                            <Avatar className="size-6" title={nombreCompleto(vendedor)}>
                              <AvatarFallback className="bg-marca-suave text-[10px] text-primary">{iniciales(vendedor)}</AvatarFallback>
                            </Avatar>
                          )}
                        </span>
                      </div>
                      {!cerrada && <p className="mt-1 text-[11px] text-muted-foreground">{oportunidad.probabilidad}% de probabilidad</p>}
                      {oportunidad.motivoPerdida && <p className="mt-1 text-[11px] text-muted-foreground">{oportunidad.motivoPerdida}</p>}
                    </div>
                  );
                })}
                {enEtapa.length === 0 && (
                  <p className="rounded-lg border border-dashed px-2 py-6 text-center text-xs text-muted-foreground">
                    {arrastrando ? "Suelte aquí" : "Sin oportunidades"}
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>

      <DetalleOportunidad idOportunidad={seleccionada} alCerrar={() => setSeleccionada(null)} />
      <DialogoPerdida oportunidad={perdiendo} alCerrar={() => setPerdiendo(null)} />
      <DialogoNuevaOportunidad abierto={dialogoNueva} alCambiarAbierto={setDialogoNueva} />
    </>
  );
}

function Cifra({ titulo, valor, detalle, alerta }: { titulo: string; valor: string; detalle: string; alerta?: boolean }) {
  return (
    <Card className={alerta ? "border-destructive/30" : undefined}>
      <CardHeader>
        <CardDescription>{titulo}</CardDescription>
        <CardTitle className={cn("font-heading text-2xl font-semibold tabular-nums", alerta && "text-destructive")}>{valor}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground">{detalle}</p>
      </CardContent>
    </Card>
  );
}
