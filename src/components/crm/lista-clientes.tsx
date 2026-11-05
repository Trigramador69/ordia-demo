"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight, CircleAlert, Search } from "lucide-react";
import { FechaSeguimiento, InsigniaEstadoCliente } from "@/components/crm/insignias";
import { EncabezadoPagina } from "@/components/panel/encabezado-pagina";
import { SelectorSimple } from "@/components/panel/selector-simple";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ciudades, nombresEstadoCliente, rubros } from "@/datos/catalogos";
import { idsVendedores } from "@/datos/equipo";
import type { EstadoCliente } from "@/datos/tipos";
import { esAbierta, proximoSeguimientoPorCliente } from "@/lib/crm";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { alarmasVisibles, clientesVisibles, contactoPrincipal, idVendedorDelRol, personaPorId } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearMonto, nombreCompleto, pluralizar } from "@/lib/formato";
import { useFiltroUrl, useFiltroUrlTexto } from "@/lib/use-filtro-url";

const todos = "todos";
type Orden = "seguimiento" | "nombre" | "abierto";
const nombresOrden: Record<Orden, string> = {
  seguimiento: "Próximo seguimiento",
  nombre: "Nombre",
  abierto: "Monto en el embudo",
};

export function ListaClientes() {
  const estado = useEstadoDemo();
  const router = useRouter();
  const filtrosActuales = useSearchParams().toString();
  const hoy = fechaDeHoy();
  const esVentas = idVendedorDelRol(estado) !== null;

  const opcionesEstado: Record<EstadoCliente | typeof todos, string> = { [todos]: "Todos los estados", ...nombresEstadoCliente };
  const opcionesVendedor: Record<string, string> = { [todos]: "Todos los vendedores" };
  for (const id of idsVendedores) {
    const persona = personaPorId(estado, id);
    if (persona) opcionesVendedor[id] = nombreCompleto(persona);
  }
  const opcionesRubro: Record<string, string> = { [todos]: "Todos los rubros", ...Object.fromEntries(rubros.map((rubro) => [rubro.nombre, rubro.nombre])) };
  const opcionesCiudad: Record<string, string> = { [todos]: "Todas las ciudades", ...Object.fromEntries(ciudades.map((ciudad) => [ciudad, ciudad])) };

  const [busqueda, setBusqueda] = useFiltroUrlTexto("buscar");
  const [estadoCliente, setEstadoCliente] = useFiltroUrl<EstadoCliente | typeof todos>("estado", todos, Object.keys(opcionesEstado) as (EstadoCliente | typeof todos)[]);
  const [idVendedor, setIdVendedor] = useFiltroUrl<string>("vendedor", todos, Object.keys(opcionesVendedor));
  const [rubro, setRubro] = useFiltroUrl<string>("rubro", todos, Object.keys(opcionesRubro));
  const [ciudad, setCiudad] = useFiltroUrl<string>("ciudad", todos, Object.keys(opcionesCiudad));
  const [orden, setOrden] = useFiltroUrl<Orden>("orden", "seguimiento", ["seguimiento", "nombre", "abierto"]);

  const proximos = proximoSeguimientoPorCliente(estado.seguimientos);
  const sinContacto = new Set(alarmasVisibles(estado, hoy).filter((alarma) => alarma.tipo === "cliente_sin_contacto").map((alarma) => alarma.idCliente));
  const clientes = clientesVisibles(estado);
  const filas = clientes.map((cliente) => ({
    cliente,
    contacto: contactoPrincipal(estado, cliente.id),
    vendedor: personaPorId(estado, cliente.idVendedor),
    abierto: estado.oportunidades
      .filter((oportunidad) => oportunidad.idCliente === cliente.id && esAbierta(oportunidad))
      .reduce((suma, oportunidad) => suma + oportunidad.monto, 0),
    proximo: proximos.get(cliente.id),
  }));

  const texto = busqueda.trim().toLowerCase();
  const visibles = filas
    .filter((fila) => estadoCliente === todos || fila.cliente.estado === estadoCliente)
    .filter((fila) => esVentas || idVendedor === todos || fila.cliente.idVendedor === idVendedor)
    .filter((fila) => rubro === todos || fila.cliente.rubro === rubro)
    .filter((fila) => ciudad === todos || fila.cliente.ciudad === ciudad)
    .filter(
      (fila) =>
        texto === "" ||
        fila.cliente.razonSocial.toLowerCase().includes(texto) ||
        fila.cliente.nit.includes(texto) ||
        (fila.contacto?.nombre.toLowerCase().includes(texto) ?? false),
    )
    .sort((a, b) => {
      if (orden === "nombre") return a.cliente.razonSocial.localeCompare(b.cliente.razonSocial, "es");
      if (orden === "abierto") return b.abierto - a.abierto;
      // Sin seguimiento agendado, al final.
      return (a.proximo?.fecha ?? "9999").localeCompare(b.proximo?.fecha ?? "9999") || a.cliente.razonSocial.localeCompare(b.cliente.razonSocial, "es");
    });

  const enlaceFicha = (idCliente: string) => `/clientes/${idCliente}${filtrosActuales ? `?filtros=${encodeURIComponent(filtrosActuales)}` : ""}`;
  const cuenta = (estadoBuscado: EstadoCliente) => clientes.filter((cliente) => cliente.estado === estadoBuscado).length;

  return (
    <>
      <EncabezadoPagina
        titulo={esVentas ? "Mis clientes" : "Clientes"}
        descripcion={`${pluralizar(clientes.length, "cliente", "clientes")} · ${cuenta("activo")} activos · ${pluralizar(cuenta("prospecto"), "prospecto", "prospectos")} · ${cuenta("inactivo")} inactivos`}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <div className="relative sm:col-span-2 lg:col-span-3 xl:col-span-1">
          <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input value={busqueda} onChange={(evento) => setBusqueda(evento.target.value)} placeholder="Nombre, NIT o contacto" aria-label="Buscar cliente" className="pl-8" />
        </div>
        <SelectorSimple opciones={opcionesEstado} valor={estadoCliente} alCambiar={setEstadoCliente} />
        {!esVentas && <SelectorSimple opciones={opcionesVendedor} valor={idVendedor} alCambiar={setIdVendedor} />}
        <SelectorSimple opciones={opcionesRubro} valor={rubro} alCambiar={setRubro} />
        <SelectorSimple opciones={opcionesCiudad} valor={ciudad} alCambiar={setCiudad} />
        <SelectorSimple opciones={nombresOrden} valor={orden} alCambiar={setOrden} />
      </div>

      <p className="-mt-2 text-sm text-muted-foreground">
        Mostrando {visibles.length} de {filas.length}
      </p>

      <Card className="-mt-2 py-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="pl-4">Cliente</TableHead>
              <TableHead className="hidden 2xl:table-cell">Contacto</TableHead>
              {!esVentas && <TableHead className="hidden md:table-cell">Vendedor</TableHead>}
              <TableHead>Estado</TableHead>
              <TableHead className="hidden text-right sm:table-cell">En el embudo</TableHead>
              <TableHead>Próximo seguimiento</TableHead>
              <TableHead className="w-8" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibles.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center text-muted-foreground">
                  Ningún cliente coincide con los filtros.
                </TableCell>
              </TableRow>
            )}
            {visibles.map(({ cliente, contacto, vendedor, abierto, proximo }) => (
              <TableRow key={cliente.id} className="cursor-pointer" onClick={() => router.push(enlaceFicha(cliente.id))}>
                <TableCell className="pl-4">
                  <Link
                    href={enlaceFicha(cliente.id)}
                    className="rounded-sm font-medium outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
                    onClick={(evento) => evento.stopPropagation()}
                  >
                    {cliente.razonSocial}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {cliente.rubro} · {cliente.ciudad}
                  </p>
                </TableCell>
                <TableCell className="hidden 2xl:table-cell">
                  {contacto && (
                    <>
                      <span className="block">{contacto.nombre}</span>
                      <span className="text-xs text-muted-foreground">{contacto.telefono}</span>
                    </>
                  )}
                </TableCell>
                {!esVentas && <TableCell className="hidden text-muted-foreground md:table-cell">{vendedor ? nombreCompleto(vendedor) : "-"}</TableCell>}
                <TableCell>
                  <InsigniaEstadoCliente estado={cliente.estado} />
                </TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">{abierto > 0 ? formatearMonto(abierto) : "-"}</TableCell>
                <TableCell>
                  <div className="flex flex-col items-start gap-1">
                    {proximo ? (
                      <>
                        <FechaSeguimiento fecha={proximo.fecha} hoy={hoy} />
                        <span className="max-w-56 truncate text-xs text-muted-foreground">{proximo.motivo}</span>
                      </>
                    ) : (
                      <span className="text-xs text-muted-foreground">Sin agendar</span>
                    )}
                    {sinContacto.has(cliente.id) && (
                      <span className="flex items-center gap-1 text-xs text-destructive">
                        <CircleAlert className="size-3" />
                        Sin contacto hace más de un mes
                      </span>
                    )}
                  </div>
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
