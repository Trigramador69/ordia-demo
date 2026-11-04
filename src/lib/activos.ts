import { mesDeFecha, sumarMesesAMes } from "../datos/fechas.ts";
import { vidaUtilPorCategoria } from "../datos/parametros.ts";
import type { Activo, CategoriaActivo } from "../datos/tipos.ts";
import { aCentavos, redondear } from "./contabilidad.ts";

// Depreciación lineal de los activos fijos: el valor de compra repartido en
// partes iguales durante la vida útil de su categoría (src/datos/parametros.ts).
// Empieza el mes siguiente a la compra y se detiene al dar de baja el activo.
// Importa con extensión .ts porque también lo ejecuta Node.

export const nombresCategoriaActivo: Record<CategoriaActivo, string> = {
  computacion: "Equipos de computación",
  muebles: "Muebles y enseres",
  equipos_oficina: "Equipos de oficina",
  vehiculos: "Vehículos",
};

// Meses entre dos meses "AAAA-MM" (positivo si `hasta` es posterior).
export function mesesEntre(desde: string, hasta: string) {
  const [anioDesde, mesDesde] = desde.split("-").map(Number);
  const [anioHasta, mesHasta] = hasta.split("-").map(Number);
  return (anioHasta - anioDesde) * 12 + (mesHasta - mesDesde);
}

export function vidaUtilEnMeses(activo: Pick<Activo, "categoria">) {
  return vidaUtilPorCategoria[activo.categoria] * 12;
}

export function cuotaMensual(activo: Pick<Activo, "categoria" | "valorCompra">) {
  return redondear(activo.valorCompra / vidaUtilEnMeses(activo));
}

export function primerMesDeDepreciacion(activo: Pick<Activo, "fechaCompra">) {
  return sumarMesesAMes(mesDeFecha(activo.fechaCompra), 1);
}

// Depreciación de un activo en un mes. El último mes de su vida útil lleva el
// resto, para que el total sea exactamente el valor de compra.
export function depreciacionDelMesDeActivo(activo: Activo, mes: string) {
  if (activo.fechaBaja && mesDeFecha(activo.fechaBaja) <= mes) return 0;
  const numeroDeMes = mesesEntre(primerMesDeDepreciacion(activo), mes) + 1;
  const vida = vidaUtilEnMeses(activo);
  if (numeroDeMes < 1 || numeroDeMes > vida) return 0;
  const cuota = cuotaMensual(activo);
  return numeroDeMes === vida ? redondear(activo.valorCompra - cuota * (vida - 1)) : cuota;
}

// Depreciación acumulada desde la compra hasta un mes, inclusive.
export function depreciacionAcumulada(activo: Activo, hastaMes: string) {
  const inicio = primerMesDeDepreciacion(activo);
  let mesFinal = hastaMes;
  if (activo.fechaBaja) {
    const anteriorALaBaja = sumarMesesAMes(mesDeFecha(activo.fechaBaja), -1);
    if (anteriorALaBaja < mesFinal) mesFinal = anteriorALaBaja;
  }
  const meses = Math.min(vidaUtilEnMeses(activo), mesesEntre(inicio, mesFinal) + 1);
  if (meses <= 0) return 0;
  if (meses === vidaUtilEnMeses(activo)) return activo.valorCompra;
  return redondear(cuotaMensual(activo) * meses);
}

export function valorEnLibros(activo: Activo, hastaMes: string) {
  return redondear(activo.valorCompra - depreciacionAcumulada(activo, hastaMes));
}

export interface FilaCuadro {
  mes: string;
  monto: number;
  acumulada: number;
  valorEnLibros: number;
}

// Cuadro de depreciación mes a mes, de la compra a `hastaMes`.
export function cuadroDeDepreciacion(activo: Activo, hastaMes: string): FilaCuadro[] {
  const filas: FilaCuadro[] = [];
  let acumulada = 0;
  for (let mes = primerMesDeDepreciacion(activo); mes <= hastaMes; mes = sumarMesesAMes(mes, 1)) {
    const monto = depreciacionDelMesDeActivo(activo, mes);
    if (monto === 0 && acumulada > 0) break;
    acumulada = redondear(acumulada + monto);
    filas.push({ mes, monto, acumulada, valorEnLibros: redondear(activo.valorCompra - acumulada) });
  }
  return filas;
}

// Depreciación de todos los activos en un mes, por activo y por categoría.
export function calcularDepreciacionDelMes(activos: Activo[], mes: string) {
  const montos = activos
    .map((activo) => ({ idActivo: activo.id, monto: depreciacionDelMesDeActivo(activo, mes) }))
    .filter((item) => item.monto > 0);
  const porCategoria: Partial<Record<CategoriaActivo, number>> = {};
  for (const { idActivo, monto } of montos) {
    const categoria = activos.find((activo) => activo.id === idActivo)!.categoria;
    porCategoria[categoria] = (aCentavos(porCategoria[categoria] ?? 0) + aCentavos(monto)) / 100;
  }
  const total = montos.reduce((suma, item) => suma + aCentavos(item.monto), 0) / 100;
  return { montos, porCategoria, total };
}

export const idDepreciacionDelMes = (mes: string) => `dep-${mes}`;
