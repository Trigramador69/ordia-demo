import type { Aleatorio } from "./aleatorio.ts";
import {
  apellidos,
  calles,
  nombresFemeninos,
  nombresMasculinos,
  parentescos,
  zonasPorCiudad,
} from "./nombres.ts";
import type { Ciudad } from "./tipos.ts";

export interface Identidad {
  nombres: string;
  apellidos: string;
  carnetIdentidad: string;
  telefono: string;
  correo: string;
  fechaNacimiento: string;
  direccion: string;
  contactoEmergencia: string;
}

const sufijoCarnetPorCiudad: Record<Ciudad, string> = {
  Cochabamba: "CB",
  "La Paz": "LP",
  "Santa Cruz": "SC",
  Sucre: "CH",
  Tarija: "TJ",
  Oruro: "OR",
};

export function sinAcentos(texto: string) {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

export function crearTelefono(aleatorio: Aleatorio) {
  const prefijo = aleatorio.elegir(["6", "7"]);
  const numero = String(aleatorio.entero(0, 9999999)).padStart(7, "0");
  return `${prefijo}${numero.slice(0, 3)} ${numero.slice(3)}`;
}

// Crea identidades inventadas sin repetir nombre completo ni carnet, para que
// el personal y los contactos de los clientes no choquen entre sí.
export function crearGeneradorIdentidades(aleatorio: Aleatorio) {
  const nombresUsados = new Set<string>();
  const carnetsUsados = new Set<string>();

  return function crearIdentidad(
    ciudad: Ciudad,
    opciones: { mujer?: boolean; anioNacimientoMinimo?: number; anioNacimientoMaximo?: number } = {},
  ): Identidad {
    const mujer = opciones.mujer ?? aleatorio.probabilidad(0.55);
    let nombres = "";
    let apellidosCompletos = "";
    do {
      nombres = aleatorio.elegir(mujer ? nombresFemeninos : nombresMasculinos);
      const [paterno, materno] = aleatorio.elegirVarios(apellidos, 2);
      apellidosCompletos = `${paterno} ${materno}`;
    } while (nombresUsados.has(`${nombres} ${apellidosCompletos}`));
    nombresUsados.add(`${nombres} ${apellidosCompletos}`);

    let carnetIdentidad = "";
    do {
      carnetIdentidad = `${aleatorio.entero(3200000, 13900000)} ${sufijoCarnetPorCiudad[ciudad]}`;
    } while (carnetsUsados.has(carnetIdentidad));
    carnetsUsados.add(carnetIdentidad);

    const primerNombre = sinAcentos(nombres.split(" ")[0]).toLowerCase();
    const primerApellido = sinAcentos(apellidosCompletos.split(" ")[0]).toLowerCase();
    const correo = `${primerNombre}.${primerApellido}${aleatorio.entero(1, 99)}@correo.bo`;

    const anioNacimiento = aleatorio.entero(
      opciones.anioNacimientoMinimo ?? 1974,
      opciones.anioNacimientoMaximo ?? 2004,
    );
    const fechaNacimiento = `${anioNacimiento}-${String(aleatorio.entero(1, 12)).padStart(2, "0")}-${String(aleatorio.entero(1, 28)).padStart(2, "0")}`;

    const direccion = `${aleatorio.elegir(calles)} ${aleatorio.entero(100, 2400)}, zona ${aleatorio.elegir(zonasPorCiudad[ciudad])}`;

    // El parentesco va con el género del nombre del contacto, y el apellido con
    // el parentesco: el padre y los hermanos llevan el paterno; la madre, el
    // materno; el cónyuge, uno propio; los hijos, el paterno del padre.
    const contactoMujer = aleatorio.probabilidad(0.5);
    const nombreDelContacto = aleatorio.elegir(contactoMujer ? nombresFemeninos : nombresMasculinos).split(" ")[0];
    const parentesco = aleatorio.elegir(parentescos[contactoMujer ? 0 : 1]);
    const [paterno, materno] = apellidosCompletos.split(" ");
    const otroApellido = apellidos.filter((apellido) => apellido !== paterno && apellido !== materno)[(apellidos.indexOf(materno) * 7) % (apellidos.length - 2)];
    const apellidoDelContacto =
      parentesco === "madre" ? materno
      : parentesco === "esposa" || parentesco === "esposo" ? otroApellido
      : (parentesco === "hija" || parentesco === "hijo") && mujer ? otroApellido
      : paterno;
    const contactoEmergencia = `${nombreDelContacto} ${apellidoDelContacto} (${parentesco}), ${crearTelefono(aleatorio)}`;

    return {
      nombres,
      apellidos: apellidosCompletos,
      carnetIdentidad,
      telefono: crearTelefono(aleatorio),
      correo,
      fechaNacimiento,
      direccion,
      contactoEmergencia,
    };
  };
}

export type CrearIdentidad = ReturnType<typeof crearGeneradorIdentidades>;
