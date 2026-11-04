import type { Aleatorio } from "./aleatorio.ts";
import { empresa } from "./catalogos.ts";
import { sumarDias, sumarMeses } from "./fechas.ts";
import { sinAcentos, type CrearIdentidad } from "./identidades.ts";
import type { Area, Persona, Rol, TipoContrato } from "./tipos.ts";

// El equipo interno de la empresa de ejemplo: 10 personas. La antigüedad se
// fija relativa al día en que se abre la demo, para que siempre se vean los
// tres tramos de vacaciones (y alguien que todavía no cumple el año).

interface DefinicionPersona {
  cargo: string;
  area: Area;
  mujer: boolean;
  antiguedad: { anios: number; meses: number; dias: number };
  sueldoBasico: number;
  edad: [number, number];
  tipoContrato: TipoContrato;
}

const definiciones: DefinicionPersona[] = [
  // 12 años: 30 días de vacación y 26% de bono de antigüedad.
  { cargo: "Gerente general", area: "gerencia", mujer: false, antiguedad: { anios: 12, meses: 4, dias: 9 }, sueldoBasico: 10500, edad: [46, 54], tipoContrato: "indefinido" },
  // 6 años: 20 días de vacación y 11% de bono.
  { cargo: "Jefa de administración y finanzas", area: "administracion", mujer: true, antiguedad: { anios: 6, meses: 2, dias: 15 }, sueldoBasico: 8000, edad: [36, 44], tipoContrato: "indefinido" },
  { cargo: "Contadora", area: "administracion", mujer: true, antiguedad: { anios: 3, meses: 8, dias: 3 }, sueldoBasico: 6500, edad: [30, 38], tipoContrato: "indefinido" },
  // Menos de 1 año: todavía no le corresponden vacaciones.
  { cargo: "Asistente administrativo", area: "administracion", mujer: false, antiguedad: { anios: 0, meses: 8, dias: 6 }, sueldoBasico: 3800, edad: [23, 27], tipoContrato: "plazo_fijo" },
  // Cerca de los 5 años: pronto pasa de 15 a 20 días.
  { cargo: "Jefe comercial", area: "comercial", mujer: false, antiguedad: { anios: 4, meses: 10, dias: 20 }, sueldoBasico: 8500, edad: [34, 42], tipoContrato: "indefinido" },
  { cargo: "Ejecutiva comercial", area: "comercial", mujer: true, antiguedad: { anios: 2, meses: 3, dias: 11 }, sueldoBasico: 5500, edad: [27, 33], tipoContrato: "indefinido" },
  { cargo: "Ejecutivo comercial", area: "comercial", mujer: false, antiguedad: { anios: 1, meses: 5, dias: 2 }, sueldoBasico: 5200, edad: [25, 31], tipoContrato: "indefinido" },
  { cargo: "Ejecutiva comercial", area: "comercial", mujer: true, antiguedad: { anios: 3, meses: 1, dias: 25 }, sueldoBasico: 5800, edad: [28, 35], tipoContrato: "indefinido" },
  { cargo: "Coordinador de operaciones", area: "operaciones", mujer: false, antiguedad: { anios: 2, meses: 9, dias: 14 }, sueldoBasico: 6200, edad: [30, 40], tipoContrato: "indefinido" },
  { cargo: "Técnica de operaciones", area: "operaciones", mujer: true, antiguedad: { anios: 1, meses: 8, dias: 17 }, sueldoBasico: 4300, edad: [24, 30], tipoContrato: "indefinido" },
];

export const idPersona = (numero: number) => `per-${String(numero).padStart(2, "0")}`;

// Quién usa la demo en cada rol. No hay inicio de sesión: el selector de rol
// muestra lo que ve cada uno.
export const personaPorRol: Record<Rol, string> = {
  gerente: idPersona(1),
  administracion: idPersona(2),
  ventas: idPersona(6),
};

// Equipo comercial: son los vendedores a cargo de los clientes del CRM.
export const idsVendedores = [idPersona(5), idPersona(6), idPersona(7), idPersona(8)];

export function generarEquipo(aleatorio: Aleatorio, crearIdentidad: CrearIdentidad, hoy: string): Persona[] {
  const anioActual = Number(hoy.slice(0, 4));

  // En un equipo de 10 no se repiten nombres ni primeros apellidos, para que
  // nadie se confunda durante la presentación.
  const nombresUsados = new Set<string>();
  const apellidosUsados = new Set<string>();

  return definiciones.map((definicion, indice) => {
    let identidad: ReturnType<CrearIdentidad>;
    do {
      identidad = crearIdentidad(empresa.ciudad, {
        mujer: definicion.mujer,
        anioNacimientoMinimo: anioActual - definicion.edad[1],
        anioNacimientoMaximo: anioActual - definicion.edad[0],
      });
    } while (nombresUsados.has(identidad.nombres.split(" ")[0]) || apellidosUsados.has(identidad.apellidos.split(" ")[0]));
    nombresUsados.add(identidad.nombres.split(" ")[0]);
    apellidosUsados.add(identidad.apellidos.split(" ")[0]);
    const { anios, meses, dias } = definicion.antiguedad;
    const fechaIngreso = sumarDias(sumarMeses(hoy, -(anios * 12 + meses)), -dias);
    const primerNombre = sinAcentos(identidad.nombres.split(" ")[0]).toLowerCase();
    const primerApellido = sinAcentos(identidad.apellidos.split(" ")[0]).toLowerCase();

    return {
      id: idPersona(indice + 1),
      nombres: identidad.nombres,
      apellidos: identidad.apellidos,
      carnetIdentidad: identidad.carnetIdentidad,
      fechaNacimiento: identidad.fechaNacimiento,
      telefono: identidad.telefono,
      correoPersonal: identidad.correo,
      correoLaboral: `${primerNombre}.${primerApellido}@${empresa.dominioCorreo}`,
      direccion: identidad.direccion,
      contactoEmergencia: identidad.contactoEmergencia,
      cargo: definicion.cargo,
      area: definicion.area,
      fechaIngreso,
      tipoContrato: definicion.tipoContrato,
      // Los contratos a plazo fijo de la demo son de un año.
      fechaFinContrato: definicion.tipoContrato === "plazo_fijo" ? sumarDias(sumarMeses(fechaIngreso, 12), -1) : null,
      sueldoBasico: definicion.sueldoBasico,
      cuentaBancaria: `${aleatorio.entero(1000, 4999)}-${aleatorio.entero(100000, 999999)}-${aleatorio.entero(1, 9)}`,
    };
  });
}
