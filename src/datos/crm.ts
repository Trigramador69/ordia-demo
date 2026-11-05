import type { Aleatorio } from "./aleatorio.ts";
import {
  etapasAbiertas,
  motivosPerdida,
  nombresOrigenCliente,
  probabilidadPorEtapa,
  rubros,
  servicios,
  umbralesAlarmas,
} from "./catalogos.ts";
import { diferenciaEnDias, sumarDias } from "./fechas.ts";
import { crearTelefono, sinAcentos, type CrearIdentidad } from "./identidades.ts";
import { calles, cargosDeContacto, formasSocietarias, nombresDeFantasia, zonasPorCiudad } from "./nombres.ts";
import type {
  Actividad,
  CambioEtapa,
  Ciudad,
  Cliente,
  Contacto,
  EstadoCliente,
  EtapaOportunidad,
  OrigenCliente,
  Oportunidad,
  Seguimiento,
  TipoActividad,
} from "./tipos.ts";

// Clientes, oportunidades, actividades y seguimientos del CRM. Todas las fechas
// salen de `hoy`, para que la demo siempre tenga seguimientos de hoy, alguno
// vencido y oportunidades estancadas, se presente el día que se presente.

const cantidadPorEstado: Record<EstadoCliente, number> = { activo: 45, prospecto: 35, inactivo: 20 };

// Oportunidades abiertas por etapa (40 en total).
const abiertasPorEtapa: Record<string, number> = { prospecto: 9, contactado: 10, propuesta: 11, negociacion: 10 };

const ganadasUltimosSeisMeses = 26;
const perdidasUltimosSeisMeses = 16;
// De las ganadas, cuántas se cierran en el mes en curso ("ventas del mes").
const ganadasEsteMes = 4;

// Oportunidades abiertas que disparan alarmas automáticas.
const cantidadEstancadas = 6;
const cantidadPropuestasSinRespuesta = 3;
const cantidadActivosSinContacto = 5;

const ciudadesPonderadas: Ciudad[] = [
  ...Array<Ciudad>(8).fill("Cochabamba"),
  ...Array<Ciudad>(5).fill("La Paz"),
  ...Array<Ciudad>(5).fill("Santa Cruz"),
  "Sucre",
  "Tarija",
  "Oruro",
];

const codigoDeArea: Record<Ciudad, string> = {
  Cochabamba: "4",
  "La Paz": "2",
  "Santa Cruz": "3",
  Sucre: "4",
  Tarija: "4",
  Oruro: "2",
};

const origenes = Object.keys(nombresOrigenCliente) as OrigenCliente[];

// Tipos de entidad con su propia forma jurídica (sin ella, se elige una al azar).
const formaPorTipoDeNegocio: Record<string, string> = {
  "Cooperativa de Ahorro y Crédito": "R.L.",
  "Unidad Educativa Privada": "",
  "Instituto Técnico": "",
};

const motivosSeguimientoPorEtapa: Record<string, string[]> = {
  prospecto: ["Llamar para presentar la empresa", "Confirmar la reunión de presentación"],
  contactado: ["Enviar la propuesta", "Agendar una visita para relevar requerimientos"],
  propuesta: ["Llamar para conocer su opinión sobre la propuesta", "Resolver dudas sobre la propuesta"],
  negociacion: ["Enviar la propuesta ajustada", "Confirmar las condiciones de pago", "Coordinar la firma del contrato"],
};

const motivosSeguimientoCliente = [
  "Llamar para coordinar la renovación del contrato",
  "Visita de revisión del servicio",
  "Consultar su satisfacción con el servicio",
];

export interface CrmGenerado {
  clientes: Cliente[];
  contactos: Contacto[];
  oportunidades: Oportunidad[];
  actividades: Actividad[];
  seguimientos: Seguimiento[];
}

function redondearMonto(monto: number) {
  return Math.round(monto / 500) * 500;
}

export function generarCrm(
  aleatorio: Aleatorio,
  crearIdentidad: CrearIdentidad,
  hoy: string,
  idsVendedores: string[],
): CrmGenerado {
  const clientes: Cliente[] = [];
  const contactos: Contacto[] = [];
  const oportunidades: Oportunidad[] = [];
  const actividades: Actividad[] = [];
  const seguimientos: Seguimiento[] = [];

  const contactoPrincipal = new Map<string, Contacto>();
  const haceDias = (dias: number) => sumarDias(hoy, -dias);

  // --- 1. Clientes y contactos ---

  const estados = aleatorio.elegirVarios(
    (Object.entries(cantidadPorEstado) as [EstadoCliente, number][]).flatMap(([estado, cantidad]) =>
      Array<EstadoCliente>(cantidad).fill(estado),
    ),
    100,
  );
  const fantasiasUsadas = new Set<string>();
  const nitsUsados = new Set<string>();
  // Reparto desparejo a propósito, para que los resultados por vendedor difieran.
  const vendedoresPonderados = [0, 0, 1, 1, 1, 2, 2, 3, 3, 3].map((indice) => idsVendedores[indice % idsVendedores.length]);

  for (const [indice, estado] of estados.entries()) {
    const rubro = aleatorio.elegir(rubros);
    // Cada nombre de fantasía se usa una sola vez: también arma el dominio de correo.
    let fantasia = "";
    do {
      fantasia = aleatorio.elegir(nombresDeFantasia);
    } while (fantasiasUsadas.has(fantasia));
    fantasiasUsadas.add(fantasia);
    const tipoDeNegocio = aleatorio.elegir(rubro.tiposDeNegocio);
    const forma = formaPorTipoDeNegocio[tipoDeNegocio] ?? aleatorio.elegir(formasSocietarias);
    const razonSocial = [tipoDeNegocio, fantasia, forma].filter(Boolean).join(" ");

    let nit = "";
    do {
      nit = `${aleatorio.entero(1000000, 4999999)}0${aleatorio.entero(10, 29)}`;
    } while (nitsUsados.has(nit));
    nitsUsados.add(nit);

    const ciudad = aleatorio.elegir(ciudadesPonderadas);
    const antiguedadDias: Record<EstadoCliente, [number, number]> = {
      activo: [200, 1500],
      prospecto: [5, 150],
      inactivo: [500, 1800],
    };
    const cliente: Cliente = {
      id: `cli-${String(indice + 1).padStart(3, "0")}`,
      razonSocial,
      nit,
      rubro: rubro.nombre,
      ciudad,
      direccion: `${aleatorio.elegir(calles)} ${aleatorio.entero(100, 2400)}, zona ${aleatorio.elegir(zonasPorCiudad[ciudad])}`,
      telefono: `${codigoDeArea[ciudad]} ${aleatorio.entero(400, 499)} ${String(aleatorio.entero(0, 9999)).padStart(4, "0")}`,
      idVendedor: aleatorio.elegir(vendedoresPonderados),
      estado,
      origen: aleatorio.elegir(origenes),
      fechaAlta: haceDias(aleatorio.entero(...antiguedadDias[estado])),
    };
    clientes.push(cliente);

    const dominio = `${sinAcentos(fantasia).toLowerCase().replace(/[^a-z]/g, "")}.com.bo`;
    const cantidadContactos = aleatorio.probabilidad(0.4) ? 2 : 1;
    for (let numero = 0; numero < cantidadContactos; numero++) {
      const mujer = aleatorio.probabilidad(0.5);
      const identidad = crearIdentidad(ciudad, { mujer });
      const nombre = `${identidad.nombres} ${identidad.apellidos.split(" ")[0]}`;
      const contacto: Contacto = {
        id: `con-${String(contactos.length + 1).padStart(3, "0")}`,
        idCliente: cliente.id,
        nombre,
        cargo: aleatorio.elegir(cargosDeContacto)[mujer ? 0 : 1],
        telefono: crearTelefono(aleatorio),
        correo: `${sinAcentos(identidad.nombres.split(" ")[0]).toLowerCase()}.${sinAcentos(identidad.apellidos.split(" ")[0]).toLowerCase()}@${dominio}`,
        principal: numero === 0,
      };
      contactos.push(contacto);
      if (numero === 0) contactoPrincipal.set(cliente.id, contacto);
    }
  }

  const porEstado = (estado: EstadoCliente) => clientes.filter((cliente) => cliente.estado === estado);
  const activos = aleatorio.elegirVarios(porEstado("activo"), 100);
  const prospectos = aleatorio.elegirVarios(porEstado("prospecto"), 100);
  const inactivos = aleatorio.elegirVarios(porEstado("inactivo"), 100);

  // --- Ayudas para oportunidades y actividades ---

  function agregarActividad(cliente: Cliente, idOportunidad: string | null, tipo: TipoActividad, fecha: string, descripcion: string) {
    const actividad: Actividad = {
      id: `act-${String(actividades.length + 1).padStart(4, "0")}`,
      idCliente: cliente.id,
      idOportunidad,
      tipo,
      fecha,
      descripcion,
      idAutor: cliente.idVendedor,
    };
    actividades.push(actividad);
    return actividad;
  }

  function elegirServicio(cliente: Cliente) {
    const opciones = cliente.estado === "activo" ? servicios : servicios.filter((servicio) => servicio.id !== "srv-ampliacion");
    return aleatorio.elegir(opciones);
  }

  // Reparte los cambios de etapa entre la creación y el último cambio.
  function armarHistorial(etapaFinal: EtapaOportunidad, recorrido: EtapaOportunidad[], creacion: string, ultimoCambio: string) {
    const total = Math.max(0, diferenciaEnDias(creacion, ultimoCambio));
    const pasos = recorrido.length - 1;
    const historial: CambioEtapa[] = recorrido.map((etapa, indice) => {
      if (indice === 0) return { etapa, fecha: creacion };
      if (indice === pasos) return { etapa, fecha: ultimoCambio };
      const base = Math.round((total * indice) / pasos);
      const desvio = Math.round(total / (pasos * 4));
      return { etapa, fecha: sumarDias(creacion, Math.min(total, Math.max(0, base + aleatorio.entero(-desvio, desvio)))) };
    });
    for (let indice = 1; indice < historial.length; indice++) {
      if (historial[indice].fecha < historial[indice - 1].fecha) historial[indice].fecha = historial[indice - 1].fecha;
    }
    if (historial[historial.length - 1].etapa !== etapaFinal) throw new Error("Recorrido de etapas inconsistente");
    return historial;
  }

  // Una actividad por cada cambio de etapa, con el texto que corresponde.
  function actividadesDeHistorial(cliente: Cliente, oportunidad: Oportunidad, nombreServicio: string) {
    const contacto = contactoPrincipal.get(cliente.id)!;
    for (const cambio of oportunidad.historialEtapas) {
      switch (cambio.etapa) {
        case "prospecto":
          agregarActividad(cliente, oportunidad.id, "nota", cambio.fecha, `Se registró la oportunidad: ${nombreServicio.toLowerCase()}. Llegó por ${nombresOrigenCliente[cliente.origen].toLowerCase()}.`);
          break;
        case "contactado":
          agregarActividad(
            cliente,
            oportunidad.id,
            aleatorio.elegir<TipoActividad>(["llamada", "reunion"]),
            cambio.fecha,
            `Primera conversación con ${contacto.nombre} (${contacto.cargo.toLowerCase()}). Quedó en recibir una propuesta.`,
          );
          break;
        case "propuesta":
          agregarActividad(cliente, oportunidad.id, "correo", cambio.fecha, `Se envió la propuesta por Bs ${oportunidad.monto.toLocaleString("es-BO")}.`);
          break;
        case "negociacion":
          agregarActividad(
            cliente,
            oportunidad.id,
            "reunion",
            cambio.fecha,
            `Revisión de la propuesta con ${contacto.nombre}: ${aleatorio.elegir(["piden ajustar los plazos de entrega", "consultan un descuento por pago anticipado", "consultan las condiciones de pago", "piden sumar una visita mensual"])}.`,
          );
          break;
        case "ganada":
          agregarActividad(cliente, oportunidad.id, "nota", cambio.fecha, "El cliente aceptó la propuesta. Se coordinó la firma del contrato.");
          break;
        case "perdida":
          agregarActividad(cliente, oportunidad.id, "nota", cambio.fecha, `Oportunidad perdida: ${(oportunidad.motivoPerdida ?? "").toLowerCase()}.`);
          break;
      }
    }
  }

  function crearOportunidad(
    cliente: Cliente,
    datos: { etapa: EtapaOportunidad; recorrido: EtapaOportunidad[]; creacion: string; ultimoCambio: string; cierreEstimado: string },
  ) {
    const servicio = elegirServicio(cliente);
    const cerrada = datos.etapa === "ganada" || datos.etapa === "perdida";
    const base = probabilidadPorEtapa[datos.etapa];
    const oportunidad: Oportunidad = {
      id: `opo-${String(oportunidades.length + 1).padStart(3, "0")}`,
      idCliente: cliente.id,
      titulo: servicio.nombre,
      idServicio: servicio.id,
      monto: redondearMonto(aleatorio.entero(servicio.montoMinimo, servicio.montoMaximo)),
      etapa: datos.etapa,
      probabilidad: cerrada ? base : Math.min(95, Math.max(5, base + aleatorio.elegir([0, 0, 0, -10, 10]))),
      idVendedor: cliente.idVendedor,
      fechaCreacion: datos.creacion,
      fechaCierreEstimada: datos.cierreEstimado,
      fechaCierre: cerrada ? datos.ultimoCambio : null,
      motivoPerdida: datos.etapa === "perdida" ? aleatorio.elegir(motivosPerdida) : null,
      historialEtapas: armarHistorial(datos.etapa, datos.recorrido, datos.creacion, datos.ultimoCambio),
    };
    oportunidades.push(oportunidad);
    actividadesDeHistorial(cliente, oportunidad, servicio.nombre);
    return oportunidad;
  }

  const recorridoHasta = (etapa: EtapaOportunidad) => etapasAbiertas.slice(0, etapasAbiertas.indexOf(etapa) + 1);

  // --- 2. Oportunidades abiertas ---

  const etapasDeAbiertas = aleatorio.elegirVarios(
    Object.entries(abiertasPorEtapa).flatMap(([etapa, cantidad]) => Array<EtapaOportunidad>(cantidad).fill(etapa as EtapaOportunidad)),
    100,
  );
  const clientesConAbierta = [...prospectos.slice(0, 24), ...activos.slice(0, 16)];
  // Días desde la creación según la etapa: las más avanzadas llevan más tiempo.
  const edadPorEtapa: Record<string, [number, number]> = {
    prospecto: [4, 35],
    contactado: [12, 55],
    propuesta: [20, 75],
    negociacion: [30, 100],
  };

  const candidatasEstancadas = etapasDeAbiertas
    .map((etapa, indice) => ({ etapa, indice }))
    .filter((item) => item.etapa !== "prospecto" && item.etapa !== "propuesta");
  const indicesEstancadas = new Set(aleatorio.elegirVarios(candidatasEstancadas, cantidadEstancadas).map((item) => item.indice));
  const indicesSinRespuesta = new Set(
    etapasDeAbiertas
      .map((etapa, indice) => ({ etapa, indice }))
      .filter((item) => item.etapa === "propuesta")
      .slice(0, cantidadPropuestasSinRespuesta)
      .map((item) => item.indice),
  );

  // Fechas de los seguimientos pendientes de las oportunidades sin alarma:
  // 5 para hoy, 6 vencidos, 8 en lo que queda de la semana y el resto después.
  const desfasesSeguimientos = aleatorio.elegirVarios(
    [
      ...Array<number>(5).fill(0),
      ...[-1, -2, -3, -4, -6, -9],
      ...[1, 1, 2, 2, 3, 4, 5, 6],
      ...[8, 9, 10, 12, 14, 15, 18, 21, 24, 28, 30],
    ],
    100,
  );

  etapasDeAbiertas.forEach((etapa, indice) => {
    const cliente = clientesConAbierta[indice];
    const [edadMinima, edadMaxima] = edadPorEtapa[etapa];
    let creacion = haceDias(aleatorio.entero(edadMinima, edadMaxima));
    let ultimaActividad: string;
    let fechaSeguimiento: string | null = null;

    if (indicesEstancadas.has(indice)) {
      // Sin actividad desde hace más del umbral; la mitad con su seguimiento vencido.
      ultimaActividad = haceDias(aleatorio.entero(umbralesAlarmas.diasOportunidadSinActividad + 2, 45));
      if (creacion > ultimaActividad) creacion = sumarDias(ultimaActividad, -aleatorio.entero(10, 30));
      if (aleatorio.probabilidad(0.5)) fechaSeguimiento = sumarDias(ultimaActividad, aleatorio.entero(5, 9));
    } else if (indicesSinRespuesta.has(indice)) {
      // Propuesta enviada hace más de una semana y sin respuesta.
      ultimaActividad = haceDias(aleatorio.entero(umbralesAlarmas.diasPropuestaSinRespuesta + 1, umbralesAlarmas.diasOportunidadSinActividad - 1));
      if (creacion > ultimaActividad) creacion = sumarDias(ultimaActividad, -aleatorio.entero(10, 25));
    } else {
      const desfase = desfasesSeguimientos.pop() ?? aleatorio.entero(1, 20);
      fechaSeguimiento = sumarDias(hoy, desfase);
      // La última actividad es anterior al seguimiento que se agendó en ella.
      const tope = desfase < 0 ? -desfase + 1 : 0;
      // Sin pasar el umbral de estancada; las propuestas, además, con respuesta reciente.
      const maximoAtras = etapa === "propuesta" ? umbralesAlarmas.diasPropuestaSinRespuesta - 1 : 10;
      const margen = Math.max(0, Math.min(maximoAtras, umbralesAlarmas.diasOportunidadSinActividad - 1 - tope));
      ultimaActividad = haceDias(tope + aleatorio.entero(0, margen));
      if (creacion > ultimaActividad) creacion = sumarDias(ultimaActividad, -aleatorio.entero(3, 15));
    }

    // El último cambio de etapa: en las estancadas y sin respuesta coincide con
    // la última actividad; en las demás, puede ser anterior y haber llamadas después.
    const recorrido = recorridoHasta(etapa);
    const sinAlarma = !indicesEstancadas.has(indice) && !indicesSinRespuesta.has(indice);
    let ultimoCambio = ultimaActividad;
    if (sinAlarma && recorrido.length > 1 && aleatorio.probabilidad(0.6)) {
      const anterior = sumarDias(ultimaActividad, -aleatorio.entero(2, 12));
      ultimoCambio = anterior > creacion ? anterior : creacion;
    }

    const oportunidad = crearOportunidad(cliente, {
      etapa,
      recorrido,
      creacion,
      ultimoCambio,
      cierreEstimado: sumarDias(hoy, aleatorio.entero(-6, 60)),
    });

    // En una oportunidad que sigue en "Prospecto" el historial tiene una sola
    // etapa (su creación), así que se compara contra el último cambio real.
    if (ultimaActividad > oportunidad.historialEtapas[oportunidad.historialEtapas.length - 1].fecha) {
      const contacto = contactoPrincipal.get(cliente.id)!;
      agregarActividad(
        cliente,
        oportunidad.id,
        aleatorio.elegir<TipoActividad>(["llamada", "llamada", "correo"]),
        ultimaActividad,
        etapa === "propuesta"
          ? `${contacto.nombre} confirmó que está revisando la propuesta con su equipo.`
          : aleatorio.elegir([
              `Llamada de seguimiento con ${contacto.nombre}. Mantienen el interés.`,
              `${contacto.nombre} pidió más información sobre los plazos.`,
              `Se compartió una referencia de otro cliente del rubro.`,
            ]),
      );
    }

    if (fechaSeguimiento) {
      seguimientos.push({
        id: `seg-${String(seguimientos.length + 1).padStart(3, "0")}`,
        idCliente: cliente.id,
        idOportunidad: oportunidad.id,
        fecha: fechaSeguimiento,
        motivo: aleatorio.elegir(motivosSeguimientoPorEtapa[etapa]),
        idResponsable: cliente.idVendedor,
        estado: "pendiente",
        fechaRealizado: null,
        idActividad: null,
      });
    }
  });

  // --- 3. Ganadas y perdidas de los últimos 6 meses ---

  const diaDelMes = Number(hoy.slice(8, 10));
  activos.slice(0, ganadasUltimosSeisMeses).forEach((cliente, indice) => {
    const cierre = indice < ganadasEsteMes ? haceDias(aleatorio.entero(0, diaDelMes - 1)) : haceDias(aleatorio.entero(diaDelMes, 180));
    const creacion = sumarDias(cierre, -aleatorio.entero(18, 80));
    crearOportunidad(cliente, {
      etapa: "ganada",
      recorrido: [...etapasAbiertas, "ganada"],
      creacion,
      ultimoCambio: cierre,
      cierreEstimado: sumarDias(cierre, aleatorio.entero(-10, 10)),
    });
  });

  // Repartidas entre los vendedores, unas cuatro cada uno, para que la tasa de
  // cierre por vendedor sea creíble. Los dos activos son fijos: su actividad
  // reciente cuenta para la alarma de cliente sin contacto.
  const clientesConPerdida = activos.slice(30, 32);
  const topePorVendedor = Math.ceil(perdidasUltimosSeisMeses / new Set(clientes.map((cliente) => cliente.idVendedor)).size);
  const perdidasDe = (idVendedor: string) => clientesConPerdida.filter((cliente) => cliente.idVendedor === idVendedor).length;
  const candidatos = [...prospectos.slice(24, 30), ...activos.slice(ganadasUltimosSeisMeses, 30), ...inactivos];
  for (const cliente of candidatos) {
    if (clientesConPerdida.length === perdidasUltimosSeisMeses) break;
    if (perdidasDe(cliente.idVendedor) < topePorVendedor) clientesConPerdida.push(cliente);
  }
  // Si algún vendedor tiene pocos candidatos, se completa con el resto.
  for (const cliente of candidatos) {
    if (clientesConPerdida.length === perdidasUltimosSeisMeses) break;
    if (!clientesConPerdida.includes(cliente)) clientesConPerdida.push(cliente);
  }
  clientesConPerdida.forEach((cliente) => {
    const etapaAlPerder = aleatorio.elegir<EtapaOportunidad>(["contactado", "propuesta", "propuesta", "negociacion"]);
    const cierre = haceDias(aleatorio.entero(4, 180));
    const creacion = sumarDias(cierre, -aleatorio.entero(15, 70));
    crearOportunidad(cliente, {
      etapa: "perdida",
      recorrido: [...recorridoHasta(etapaAlPerder), "perdida"],
      creacion,
      ultimoCambio: cierre,
      cierreEstimado: sumarDias(cierre, aleatorio.entero(-5, 20)),
    });
  });

  // --- 4. Historial más antiguo: cada cliente activo o inactivo tuvo al menos una venta ---

  for (const cliente of [...activos, ...inactivos]) {
    const tieneGanada = oportunidades.some((oportunidad) => oportunidad.idCliente === cliente.id && oportunidad.etapa === "ganada");
    if (tieneGanada) continue;
    const cierre = cliente.estado === "activo" ? haceDias(aleatorio.entero(190, 700)) : haceDias(aleatorio.entero(300, 1100));
    crearOportunidad(cliente, {
      etapa: "ganada",
      recorrido: [...etapasAbiertas, "ganada"],
      creacion: sumarDias(cierre, -aleatorio.entero(20, 70)),
      ultimoCambio: cierre,
      cierreEstimado: cierre,
    });
  }

  // --- 5. Actividades de cuenta ---

  // Prospectos sin oportunidad: un primer contacto reciente.
  for (const cliente of prospectos.slice(30)) {
    const contacto = contactoPrincipal.get(cliente.id)!;
    agregarActividad(cliente, null, "llamada", haceDias(aleatorio.entero(2, 40)), `Primer contacto con ${contacto.nombre}. Pidió volver a hablar más adelante.`);
  }
  // Inactivos: la última conversación, hace tiempo.
  for (const cliente of inactivos) {
    agregarActividad(cliente, null, "llamada", haceDias(aleatorio.entero(120, 500)), "Indicó que por ahora no requiere el servicio. Volver a consultar en unos meses.");
  }

  // Clientes activos: casi todos con contacto en el último mes, salvo unos
  // pocos que quedan sin contacto a propósito para la alarma automática.
  const ultimaActividadDe = (idCliente: string) =>
    actividades.filter((actividad) => actividad.idCliente === idCliente).reduce((ultima, actividad) => (actividad.fecha > ultima ? actividad.fecha : ultima), "");
  const limiteSinContacto = haceDias(umbralesAlarmas.diasClienteActivoSinContacto);
  const activosSinContactoReciente = activos.filter((cliente) => ultimaActividadDe(cliente.id) < limiteSinContacto);
  const quedanSinContacto = new Set(activosSinContactoReciente.slice(0, cantidadActivosSinContacto).map((cliente) => cliente.id));

  for (const cliente of activos) {
    const contacto = contactoPrincipal.get(cliente.id)!;
    // Una visita de revisión en los últimos meses, para que la ficha tenga historia.
    agregarActividad(
      cliente,
      null,
      "reunion",
      haceDias(aleatorio.entero(quedanSinContacto.has(cliente.id) ? umbralesAlarmas.diasClienteActivoSinContacto + 5 : 35, 160)),
      `Visita de revisión del servicio con ${contacto.nombre}. ${aleatorio.elegir(["Sin observaciones.", "Pidió reforzar la atención los lunes.", "Conforme con el servicio.", "Consultó por ampliar el alcance."])}`,
    );
    if (quedanSinContacto.has(cliente.id) || ultimaActividadDe(cliente.id) >= limiteSinContacto) continue;
    agregarActividad(
      cliente,
      null,
      aleatorio.elegir<TipoActividad>(["llamada", "correo"]),
      haceDias(aleatorio.entero(1, umbralesAlarmas.diasClienteActivoSinContacto - 3)),
      aleatorio.elegir([
        `Llamada de cortesía con ${contacto.nombre}. Todo en orden.`,
        `Se envió el reporte mensual del servicio a ${contacto.nombre}.`,
        `${contacto.nombre} consultó por la factura del mes.`,
      ]),
    );
  }

  // Seguimientos de cuenta para clientes activos (renovaciones, visitas).
  const desfasesCuenta = [0, -2, 3, 9];
  activos.slice(32, 32 + desfasesCuenta.length).forEach((cliente, indice) => {
    seguimientos.push({
      id: `seg-${String(seguimientos.length + 1).padStart(3, "0")}`,
      idCliente: cliente.id,
      idOportunidad: null,
      fecha: sumarDias(hoy, desfasesCuenta[indice]),
      motivo: motivosSeguimientoCliente[indice % motivosSeguimientoCliente.length],
      idResponsable: cliente.idVendedor,
      estado: "pendiente",
      fechaRealizado: null,
      idActividad: null,
    });
  });

  // --- 6. Fecha de alta coherente: el día de su primera actividad registrada ---

  for (const cliente of clientes) {
    const fechas = actividades.filter((actividad) => actividad.idCliente === cliente.id).map((actividad) => actividad.fecha);
    if (fechas.length > 0) cliente.fechaAlta = fechas.reduce((minima, fecha) => (fecha < minima ? fecha : minima));
  }

  actividades.sort((a, b) => b.fecha.localeCompare(a.fecha) || b.id.localeCompare(a.id));
  return { clientes, contactos, oportunidades, actividades, seguimientos };
}
