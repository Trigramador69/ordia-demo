// Operaciones con fechas en texto ISO ("2026-09-14") y horas "HH:MM".
// Se calculan en UTC para que no dependan de la zona horaria del navegador.

function aFechaUtc(fecha: string) {
  const [anio, mes, dia] = fecha.split("-").map(Number);
  return new Date(Date.UTC(anio, mes - 1, dia));
}

function aTextoIso(fecha: Date) {
  return fecha.toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number) {
  const resultado = aFechaUtc(fecha);
  resultado.setUTCDate(resultado.getUTCDate() + dias);
  return aTextoIso(resultado);
}

export function sumarMeses(fecha: string, meses: number) {
  const resultado = aFechaUtc(fecha);
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  return aTextoIso(resultado);
}

// 0 = domingo, 1 = lunes ... 6 = sábado.
export function diaDeLaSemana(fecha: string) {
  return aFechaUtc(fecha).getUTCDay();
}

export function diasDelMes(mes: string) {
  const [anio, numeroMes] = mes.split("-").map(Number);
  const cantidad = new Date(Date.UTC(anio, numeroMes, 0)).getUTCDate();
  return Array.from({ length: cantidad }, (_, indice) =>
    `${mes}-${String(indice + 1).padStart(2, "0")}`,
  );
}

export function diferenciaEnDias(desde: string, hasta: string) {
  return Math.round((aFechaUtc(hasta).getTime() - aFechaUtc(desde).getTime()) / 86400000);
}

export function horaAMinutos(hora: string) {
  const [horas, minutos] = hora.split(":").map(Number);
  return horas * 60 + minutos;
}

export function minutosAHora(minutosDelDia: number) {
  const horas = Math.floor(minutosDelDia / 60);
  const minutos = minutosDelDia % 60;
  return `${String(horas).padStart(2, "0")}:${String(minutos).padStart(2, "0")}`;
}

export function desplazarHora(hora: string, minutos: number) {
  return minutosAHora(horaAMinutos(hora) + minutos);
}

export function estaEnRango(fecha: string, desde: string, hasta: string | null) {
  return fecha >= desde && (hasta === null || fecha <= hasta);
}

export function sumarAnios(fecha: string, anios: number) {
  return sumarMeses(fecha, anios * 12);
}

// "2026-11-04" -> "2026-11"
export function mesDeFecha(fecha: string) {
  return fecha.slice(0, 7);
}

export function primerDiaDelMes(mes: string) {
  return `${mes}-01`;
}

export function ultimoDiaDelMes(mes: string) {
  const dias = diasDelMes(mes);
  return dias[dias.length - 1];
}

// "2026-11" con -1 -> "2026-10"
export function sumarMesesAMes(mes: string, meses: number) {
  return mesDeFecha(sumarMeses(primerDiaDelMes(mes), meses));
}

export function esFinDeSemana(fecha: string) {
  const dia = diaDeLaSemana(fecha);
  return dia === 0 || dia === 6;
}

// Fechas desde/hasta inclusive.
export function fechasEntre(desde: string, hasta: string) {
  const fechas: string[] = [];
  for (let fecha = desde; fecha <= hasta; fecha = sumarDias(fecha, 1)) fechas.push(fecha);
  return fechas;
}

// Años cumplidos entre dos fechas: la antigüedad que cuenta para vacaciones y
// para el bono de antigüedad.
export function aniosCumplidos(desde: string, hasta: string) {
  const [anioDesde, mesDesde, diaDesde] = desde.split("-").map(Number);
  const [anioHasta, mesHasta, diaHasta] = hasta.split("-").map(Number);
  const cumplioEsteAnio = mesHasta > mesDesde || (mesHasta === mesDesde && diaHasta >= diaDesde);
  return Math.max(0, anioHasta - anioDesde - (cumplioEsteAnio ? 0 : 1));
}

// Fecha local del navegador (o de la máquina, en los scripts).
export function fechaDeHoy() {
  const hoy = new Date();
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-${String(hoy.getDate()).padStart(2, "0")}`;
}
