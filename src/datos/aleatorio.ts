// Generador pseudoaleatorio con semilla fija (mulberry32). Los datos de la demo
// se generan con él para que salgan iguales en cada carga y en los archivos de
// ejemplo que se suben durante la presentación.

export interface Aleatorio {
  siguiente(): number;
  entero(minimo: number, maximo: number): number;
  elegir<T>(opciones: readonly T[]): T;
  elegirVarios<T>(opciones: readonly T[], cantidad: number): T[];
  probabilidad(valor: number): boolean;
}

export function crearAleatorio(semilla: number): Aleatorio {
  let estado = semilla >>> 0;

  function siguiente() {
    estado = (estado + 0x6d2b79f5) >>> 0;
    let t = estado;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  function entero(minimo: number, maximo: number) {
    return minimo + Math.floor(siguiente() * (maximo - minimo + 1));
  }

  function elegir<T>(opciones: readonly T[]) {
    return opciones[Math.floor(siguiente() * opciones.length)];
  }

  function elegirVarios<T>(opciones: readonly T[], cantidad: number) {
    const copia = [...opciones];
    for (let indice = copia.length - 1; indice > 0; indice--) {
      const otro = Math.floor(siguiente() * (indice + 1));
      [copia[indice], copia[otro]] = [copia[otro], copia[indice]];
    }
    return copia.slice(0, Math.min(cantidad, copia.length));
  }

  function probabilidad(valor: number) {
    return siguiente() < valor;
  }

  return { siguiente, entero, elegir, elegirVarios, probabilidad };
}
