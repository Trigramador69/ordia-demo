// Monto en letras, como va en boletas y facturas de Bolivia:
// 11214.95 -> "ONCE MIL DOSCIENTOS CATORCE 95/100 BOLIVIANOS".

const unidades = [
  "", "uno", "dos", "tres", "cuatro", "cinco", "seis", "siete", "ocho", "nueve",
  "diez", "once", "doce", "trece", "catorce", "quince", "dieciséis", "diecisiete", "dieciocho", "diecinueve",
  "veinte", "veintiuno", "veintidós", "veintitrés", "veinticuatro", "veinticinco", "veintiséis", "veintisiete", "veintiocho", "veintinueve",
];
const decenas = ["", "", "", "treinta", "cuarenta", "cincuenta", "sesenta", "setenta", "ochenta", "noventa"];
const centenas = ["", "ciento", "doscientos", "trescientos", "cuatrocientos", "quinientos", "seiscientos", "setecientos", "ochocientos", "novecientos"];

function hastaNovecientosNoventaYNueve(numero: number): string {
  if (numero === 0) return "";
  if (numero === 100) return "cien";
  const centena = Math.floor(numero / 100);
  const resto = numero % 100;
  let texto = centenas[centena];
  if (resto > 0) {
    const parte = resto < 30 ? unidades[resto] : `${decenas[Math.floor(resto / 10)]}${resto % 10 ? ` y ${unidades[resto % 10]}` : ""}`;
    texto = texto ? `${texto} ${parte}` : parte;
  }
  return texto;
}

// "uno" pasa a "un" delante de "mil" o "millones" (veintiún mil, un millón).
function apocopar(texto: string) {
  return texto.replace(/veintiuno$/, "veintiún").replace(/uno$/, "un");
}

export function enteroALetras(numero: number): string {
  if (numero === 0) return "cero";
  const millones = Math.floor(numero / 1_000_000);
  const miles = Math.floor((numero % 1_000_000) / 1000);
  const resto = numero % 1000;
  const partes: string[] = [];
  if (millones > 0) partes.push(millones === 1 ? "un millón" : `${apocopar(enteroALetras(millones))} millones`);
  if (miles > 0) partes.push(miles === 1 ? "mil" : `${apocopar(hastaNovecientosNoventaYNueve(miles))} mil`);
  if (resto > 0) partes.push(hastaNovecientosNoventaYNueve(resto));
  return partes.join(" ");
}

export function montoALetras(monto: number, moneda = "bolivianos") {
  const centavosTotales = Math.round(monto * 100);
  const entero = Math.floor(centavosTotales / 100);
  const centavos = centavosTotales % 100;
  return `${enteroALetras(entero)} ${String(centavos).padStart(2, "0")}/100 ${moneda}`.toUpperCase();
}
