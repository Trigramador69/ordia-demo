import { idPersona, personaPorRol } from "./equipo.ts";
import { aniosCumplidos, esFinDeSemana, mesDeFecha, primerDiaDelMes, sumarAnios, sumarDias, sumarMesesAMes, ultimoDiaDelMes } from "./fechas.ts";
import { contarDiasHabiles, diaHabilDesde, diaHabilHasta, feriadosDelAnio, sumarDiasHabiles } from "./feriados.ts";
import { parametrosVacaciones } from "./parametros.ts";
import type { EstadoSolicitud, MovimientoDiaLibre, Permiso, Persona, SolicitudVacacion, TipoPermiso } from "./tipos.ts";

// Vacaciones, días libres y permisos del equipo, relativos a `hoy`. Están
// pensados para la presentación: alguien de vacaciones hoy, una solicitud por
// aprobar, una vacación ya programada y un permiso sin goce de haber en el mes
// en curso que se descuenta en la planilla.

interface VacacionPlaneada {
  persona: number;
  // Días antes (negativo) o después (positivo) de hoy en que empieza.
  inicio: number;
  dias: number;
  estado: EstadoSolicitud;
  comentario: string;
  motivoRechazo?: string;
}

const vacaciones: VacacionPlaneada[] = [
  { persona: 1, inicio: -200, dias: 10, estado: "aprobada", comentario: "Viaje familiar" },
  { persona: 1, inicio: -75, dias: 8, estado: "aprobada", comentario: "Descanso" },
  { persona: 2, inicio: -150, dias: 10, estado: "aprobada", comentario: "Viaje al exterior" },
  { persona: 2, inicio: -40, dias: 5, estado: "aprobada", comentario: "Asuntos familiares" },
  { persona: 3, inicio: -120, dias: 7, estado: "aprobada", comentario: "Descanso" },
  { persona: 3, inicio: 14, dias: 4, estado: "pendiente", comentario: "Viaje a Santa Cruz por el cumpleaños de mi madre" },
  { persona: 5, inicio: -180, dias: 10, estado: "aprobada", comentario: "Vacación anual" },
  { persona: 5, inicio: -62, dias: 5, estado: "rechazada", comentario: "Descanso", motivoRechazo: "Coincide con el cierre de las propuestas del trimestre. Reprogramar." },
  { persona: 6, inicio: -95, dias: 5, estado: "aprobada", comentario: "Viaje a Tarija" },
  { persona: 7, inicio: -50, dias: 6, estado: "aprobada", comentario: "Primera vacación" },
  { persona: 8, inicio: -210, dias: 5, estado: "aprobada", comentario: "Descanso" },
  // De vacaciones hoy: empieza dos días hábiles antes.
  { persona: 8, inicio: 0, dias: 7, estado: "aprobada", comentario: "Viaje al lago Titicaca" },
  { persona: 9, inicio: -130, dias: 8, estado: "aprobada", comentario: "Vacación anual" },
  // Programada dentro de los próximos 30 días aunque caiga en fin de semana o feriado.
  { persona: 9, inicio: 24, dias: 5, estado: "aprobada", comentario: "Fin de año con la familia" },
  { persona: 10, inicio: -70, dias: 4, estado: "aprobada", comentario: "Trámites en Sucre" },
];

const permisosPlaneados: { persona: number; inicio: number; dias: number; tipo: TipoPermiso; motivo: string }[] = [
  { persona: 1, inicio: -160, dias: 1, tipo: "con_goce", motivo: "Cita médica" },
  { persona: 3, inicio: -35, dias: 1, tipo: "con_goce", motivo: "Cita médica" },
  { persona: 6, inicio: -80, dias: 1, tipo: "con_goce", motivo: "Trámite personal" },
  { persona: 10, inicio: -100, dias: 2, tipo: "con_goce", motivo: "Matrimonio de su hermana" },
  { persona: 8, inicio: -25, dias: 1, tipo: "con_goce", motivo: "Reunión en el colegio de su hijo" },
];

export interface AusenciasGeneradas {
  solicitudesVacacion: SolicitudVacacion[];
  movimientosDiasLibres: MovimientoDiaLibre[];
  permisos: Permiso[];
}

export function generarAusencias(personas: Persona[], hoy: string): AusenciasGeneradas {
  const solicitudesVacacion: SolicitudVacacion[] = [];
  const movimientosDiasLibres: MovimientoDiaLibre[] = [];
  const permisos: Permiso[] = [];
  const idGerente = personaPorRol.gerente;
  const personaDe = (numero: number) => personas.find((persona) => persona.id === idPersona(numero))!;

  // --- Vacaciones ---
  for (const planeada of vacaciones) {
    const persona = personaDe(planeada.persona);
    const desde =
      planeada.inicio === 0
        ? diaHabilHasta(sumarDias(diaHabilHasta(hoy), -2))
        : diaHabilDesde(sumarDias(hoy, planeada.inicio));
    const hasta = sumarDiasHabiles(desde, planeada.dias);

    // Solo vacaciones de las gestiones que todavía cuentan en el saldo.
    const anios = aniosCumplidos(persona.fechaIngreso, hoy);
    const inicioVigente = sumarAnios(persona.fechaIngreso, Math.max(1, anios - parametrosVacaciones.gestionesAcumulables + 1));
    if (planeada.estado !== "pendiente" && desde < inicioVigente) continue;

    // Pedida unas semanas antes; si eso cae en el futuro, hace dos días.
    const pedidaAntes = sumarDias(desde, planeada.estado === "pendiente" ? -16 : -18);
    const fechaSolicitud = pedidaAntes < hoy ? pedidaAntes : sumarDias(hoy, -2);
    const resuelta = planeada.estado !== "pendiente";
    solicitudesVacacion.push({
      id: `vac-${String(solicitudesVacacion.length + 1).padStart(3, "0")}`,
      idPersona: persona.id,
      desde,
      hasta,
      diasHabiles: contarDiasHabiles(desde, hasta),
      comentario: planeada.comentario,
      estado: planeada.estado,
      fechaSolicitud,
      fechaResolucion: resuelta ? sumarDias(fechaSolicitud, 1) : null,
      idResolutor: resuelta ? idGerente : null,
      motivoRechazo: planeada.motivoRechazo ?? null,
    });
  }

  // --- Días libres: se ganan trabajando un feriado o un sábado ---
  const anioActual = Number(hoy.slice(0, 4));
  const feriadosPasados = [...feriadosDelAnio(anioActual - 1), ...feriadosDelAnio(anioActual)]
    .filter((feriado) => feriado.fecha < hoy && !esFinDeSemana(feriado.fecha))
    .slice(-3);
  const sabadoAntesDe = (dias: number) => {
    let fecha = sumarDias(hoy, -dias);
    while (new Date(`${fecha}T00:00:00Z`).getUTCDay() !== 6) fecha = sumarDias(fecha, -1);
    return fecha;
  };
  const feriadoReciente = feriadosPasados[feriadosPasados.length - 1];
  const feriadoAnterior = feriadosPasados[feriadosPasados.length - 2];
  const sabadoFeria = sabadoAntesDe(55);

  const movimientos: [number, MovimientoDiaLibre["tipo"], string, string][] = [
    [9, "ganado", feriadoReciente.fecha, `Trabajó el feriado (${feriadoReciente.nombre}) en una instalación urgente`],
    [9, "ganado", sabadoAntesDe(38), "Trabajó el sábado en el mantenimiento de un cliente"],
    [9, "usado", diaHabilDesde(sumarDias(hoy, -18)), "Día libre"],
    [10, "ganado", feriadoAnterior.fecha, `Trabajó el feriado (${feriadoAnterior.nombre}) de turno`],
    [10, "ganado", feriadoReciente.fecha, `Trabajó el feriado (${feriadoReciente.nombre}) en una instalación urgente`],
    [10, "usado", diaHabilDesde(sumarDias(hoy, -9)), "Día libre"],
    [5, "ganado", sabadoFeria, "Atendió el stand de la feria empresarial el sábado"],
    [5, "usado", diaHabilDesde(sumarDias(sabadoFeria, 10)), "Día libre"],
    [7, "ganado", sabadoFeria, "Atendió el stand de la feria empresarial el sábado"],
    [2, "ganado", sabadoAntesDe(120), "Trabajó el sábado en el cierre contable del semestre"],
  ];
  for (const [numero, tipo, fecha, motivo] of movimientos) {
    if (fecha < personaDe(numero).fechaIngreso) continue;
    movimientosDiasLibres.push({
      id: `dli-${String(movimientosDiasLibres.length + 1).padStart(3, "0")}`,
      idPersona: idPersona(numero),
      tipo,
      fecha,
      dias: 1,
      motivo,
    });
  }

  // --- Permisos ---
  function agregarPermiso(numero: number, tipo: TipoPermiso, desde: string, hasta: string, motivo: string) {
    permisos.push({
      id: `prm-${String(permisos.length + 1).padStart(3, "0")}`,
      idPersona: idPersona(numero),
      tipo,
      desde,
      hasta,
      diasHabiles: contarDiasHabiles(desde, hasta),
      motivo,
      fechaRegistro: desde < hoy ? desde : hoy,
    });
  }
  for (const planeado of permisosPlaneados) {
    const desde = diaHabilDesde(sumarDias(hoy, planeado.inicio));
    if (desde < personaDe(planeado.persona).fechaIngreso) continue;
    agregarPermiso(planeado.persona, planeado.tipo, desde, sumarDiasHabiles(desde, planeado.dias), planeado.motivo);
  }

  // Sin goce de haber en el mes en curso: descuenta en la planilla por cerrar.
  const mesActual = mesDeFecha(hoy);
  const inicioSinGoce = diaHabilDesde(primerDiaDelMes(mesActual));
  const finSinGoce = sumarDiasHabiles(inicioSinGoce, 2);
  agregarPermiso(7, "sin_goce", inicioSinGoce, finSinGoce <= ultimoDiaDelMes(mesActual) ? finSinGoce : inicioSinGoce, "Viaje por un asunto familiar");

  // Y uno en el mes anterior, que ya se descontó en la planilla cerrada.
  const mesAnterior = sumarMesesAMes(mesActual, -1);
  const diaSinGoceAnterior = diaHabilDesde(`${mesAnterior}-12`);
  agregarPermiso(4, "sin_goce", diaSinGoceAnterior, diaSinGoceAnterior, "Asunto personal");

  return { solicitudesVacacion, movimientosDiasLibres, permisos };
}
