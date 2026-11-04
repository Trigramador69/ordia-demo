// Nombres de los meses sin depender de Intl, para usarlos también desde Node
// al generar datos ("noviembre de 2026").

export const nombresMeses = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

export function formatearNombreMesYAnio(mes: string) {
  const [anio, numero] = mes.split("-").map(Number);
  return `${nombresMeses[numero - 1]} de ${anio}`;
}
