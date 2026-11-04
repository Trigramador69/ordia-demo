import type { CategoriaActivo } from "./plan-cuentas.ts";

// Parámetros legales y de política de la empresa. Corregirlos aquí no toca la
// lógica: la planilla, las vacaciones, los asientos y la depreciación los leen
// de este archivo.
//
// Revisados el 04/11/2026 contra la normativa vigente. Cada valor dice de qué
// norma sale. Los marcados "A VALIDAR" son práctica o política de la empresa
// de ejemplo y conviene confirmarlos con Line o con un contador.

// --- Planilla de sueldos ---

export const parametrosPlanilla = {
  // Salario mínimo nacional, en bolivianos. Es la base del bono de antigüedad
  // y del RC-IVA. D.S. 5516 del 13/01/2026, retroactivo al 01/01/2026 (abrogó
  // al D.S. 5503). Actualizar cuando salga el decreto de la gestión 2027.
  salarioMinimoNacional: 3300,

  // El valor de un día de sueldo es el haber mensual dividido entre 30.
  diasDelMesComercial: 30,

  // Bono de antigüedad: un porcentaje de 3 salarios mínimos, según los años de
  // servicio cumplidos. Cada tramo rige desde esos años hasta el siguiente.
  // Escala: D.S. 21060, art. 60. Base de 3 salarios mínimos: D.S. 23474 para
  // empresas productivas; la jurisprudencia la extiende a las de servicios con
  // utilidades (Autos Supremos 207/2008, 468/2008 y 93/2009). A VALIDAR que
  // aplique al cliente.
  bonoAntiguedad: {
    salariosMinimosBase: 3,
    tramos: [
      { desdeAnios: 0, porcentaje: 0 },
      { desdeAnios: 2, porcentaje: 5 },
      { desdeAnios: 5, porcentaje: 11 },
      { desdeAnios: 8, porcentaje: 18 },
      { desdeAnios: 11, porcentaje: 26 },
      { desdeAnios: 15, porcentaje: 34 },
      { desdeAnios: 20, porcentaje: 42 },
      { desdeAnios: 25, porcentaje: 50 },
    ],
  },

  // Los días sin goce de haber se descuentan del haber básico y del bono de
  // antigüedad (los dos se pagan en proporción a los días trabajados). El
  // descuento va antes de calcular la AFP y el RC-IVA, que se aplican sobre lo
  // efectivamente ganado. A VALIDAR: no hay norma que diga si el bono también
  // se descuenta; es práctica.
  descontarSinGoceDelBono: true,

  // Aporte laboral sobre el total ganado, que hoy se paga a la Gestora Pública:
  // vejez 10%, riesgo común 1,71%, comisión 0,5% y aporte solidario 0,5%.
  aporteLaboralAfp: 0.1271,

  // Aporte nacional solidario: un porcentaje sobre lo que el total ganado
  // excede cada monto (los tramos se suman). Ley 1582 y D.S. 5280, desde el
  // periodo de cotización de octubre de 2024. En la demo solo el gerente pasa
  // el primer tramo.
  aporteNacionalSolidario: [
    { excedenteDe: 13000, porcentaje: 0.0115 },
    { excedenteDe: 25000, porcentaje: 0.0574 },
    { excedenteDe: 35000, porcentaje: 0.1148 },
  ],

  // RC-IVA de dependientes, simplificado (sin el descargo con facturas del
  // formulario 110):
  //   1. sueldo neto = total ganado - aportes laborales;
  //   2. base = sueldo neto - mínimo no imponible (2 salarios mínimos);
  //   3. impuesto = 13% de la base;
  //   4. a pagar = impuesto - 13% de 1 salario mínimo (cómputo a favor).
  // El cómputo a favor era de 2 salarios mínimos hasta abril de 2025; el D.S.
  // 5383 (01/05/2025) lo bajó a 1. Paga quien tenga un sueldo neto de más de
  // 3 salarios mínimos.
  rcIva: {
    alicuota: 0.13,
    salariosMinimosNoImponibles: 2,
    salariosMinimosComputoAFavor: 1,
  },

  // Aportes patronales, sobre el total ganado: 17,21% en total. No se
  // descuentan al trabajador. El solidario subió de 3% a 3,5% con la Ley 1582 y
  // el D.S. 5280 (octubre de 2024).
  aportesPatronales: {
    cajaDeSalud: 0.1,
    riesgoProfesional: 0.0171,
    solidario: 0.035,
    vivienda: 0.02,
  },

  // Provisiones mensuales, sobre el total ganado: la doceava parte de un sueldo
  // al año para cada una. No se descuentan al trabajador; van al asiento de la
  // planilla.
  provisiones: {
    aguinaldo: 0.0833,
    indemnizacion: 0.0833,
  },
};

// --- Vacaciones ---

export const parametrosVacaciones = {
  // Días hábiles de vacación por gestión, según los años de servicio cumplidos
  // al empezar la gestión (art. 44 de la Ley General del Trabajo y sus
  // modificaciones). Con menos de 1 año todavía no corresponden.
  tramos: [
    { desdeAnios: 1, dias: 15 },
    { desdeAnios: 5, dias: 20 },
    { desdeAnios: 10, dias: 30 },
  ],
  // Gestiones que se pueden acumular. Lo de gestiones más antiguas ya no
  // cuenta en el saldo. La vacación no se acumula salvo acuerdo escrito o si
  // el empleador no la otorgó, y como máximo por dos gestiones (art. 33 del
  // Reglamento de la Ley General del Trabajo y D.S. 4709).
  gestionesAcumulables: 2,
};

// --- Permisos ---

export const parametrosPermisos = {
  // Política de la empresa de ejemplo, no es una norma: días de permiso con
  // goce de haber por gestión calendario. Los permisos sin goce no tienen tope,
  // pero descuentan en la planilla. A VALIDAR con lo que haga el cliente.
  diasConGocePorGestion: 3,
};

// --- Impuestos de la facturación ---

export const parametrosImpuestos = {
  // Ley 843; sin cambios encontrados en 2026.
  // El IVA está incluido en el precio facturado (13% del total).
  iva: 0.13,
  // Impuesto a las transacciones: 3% del total facturado, a cargo de la empresa.
  impuestoTransacciones: 0.03,
};

// --- Depreciación de activos fijos ---

// Vida útil en años, para depreciación lineal (D.S. 24051, anexo). A VALIDAR:
// todavía no se revisó contra el texto vigente (se usa el día 6).
export const vidaUtilPorCategoria: Record<CategoriaActivo, number> = {
  muebles: 10,
  computacion: 4,
  vehiculos: 5,
  equipos_oficina: 8,
};
