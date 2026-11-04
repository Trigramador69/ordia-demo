"use client";

import { useSyncExternalStore } from "react";
import { fechaDeHoy } from "@/datos/fechas";
import { crearEstadoInicial, versionEstadoDemo } from "@/datos/semilla";
import type { EstadoDemo } from "@/datos/tipos";

// Estado de la demo guardado en el navegador. Arranca desde la semilla y cada
// cambio se guarda en localStorage; "Reiniciar demo" vuelve a la semilla.
// Se sincroniza entre pestañas, para que una solicitud hecha en "Mis
// vacaciones" aparezca en el panel del gerente abierto en otra pestaña.
//
// Los datos de ejemplo tienen fechas relativas al día en que se generan. Si lo
// guardado es de otro día, se descarta y se vuelve a generar: así siempre hay
// seguimientos de hoy, alguno vencido y una planilla del mes por cerrar.

const claveAlmacenamiento = "ordia-demo";

let estadoActual: EstadoDemo | null = null;
const suscriptores = new Set<() => void>();

function leerGuardado(texto: string | null): EstadoDemo | null {
  if (!texto) return null;
  try {
    const estado = JSON.parse(texto) as EstadoDemo;
    return estado.version === versionEstadoDemo && estado.fechaBase === fechaDeHoy() ? estado : null;
  } catch {
    return null;
  }
}

function cargarEstado(): EstadoDemo {
  try {
    return leerGuardado(localStorage.getItem(claveAlmacenamiento)) ?? crearEstadoInicial();
  } catch {
    return crearEstadoInicial();
  }
}

function notificar() {
  for (const suscriptor of suscriptores) suscriptor();
}

function alCambiarEnOtraPestana(evento: StorageEvent) {
  if (evento.key !== claveAlmacenamiento) return;
  estadoActual = leerGuardado(evento.newValue) ?? crearEstadoInicial();
  notificar();
}

function suscribir(suscriptor: () => void) {
  suscriptores.add(suscriptor);
  if (suscriptores.size === 1) window.addEventListener("storage", alCambiarEnOtraPestana);
  return () => {
    suscriptores.delete(suscriptor);
    if (suscriptores.size === 0) window.removeEventListener("storage", alCambiarEnOtraPestana);
  };
}

export function obtenerEstado(): EstadoDemo {
  estadoActual ??= cargarEstado();
  return estadoActual;
}

export function actualizarEstado(cambio: (estado: EstadoDemo) => EstadoDemo) {
  estadoActual = cambio(obtenerEstado());
  try {
    localStorage.setItem(claveAlmacenamiento, JSON.stringify(estadoActual));
  } catch {
    // Sin almacenamiento disponible (por ejemplo, navegación privada estricta):
    // la demo sigue funcionando en memoria hasta que se recargue la página.
  }
  notificar();
}

export function reiniciarDemo() {
  estadoActual = crearEstadoInicial();
  try {
    localStorage.removeItem(claveAlmacenamiento);
  } catch {
    // Igual que arriba: sin almacenamiento, el reinicio queda en memoria.
  }
  notificar();
}

// Solo se usa dentro de <PuertaNavegador>, que garantiza que se renderiza en el
// navegador; por eso la instantánea del servidor es la misma función.
export function useEstadoDemo(): EstadoDemo {
  return useSyncExternalStore(suscribir, obtenerEstado, obtenerEstado);
}
