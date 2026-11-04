// Pruebas de punta a punta de la demo, en un Chrome sin interfaz.
//
//   pnpm pruebas              compila y prueba
//   pnpm pruebas --sin-build  prueba la última compilación
//
// Levanta la demo compilada en un puerto propio, recorre todas las pantallas
// (sin errores de consola ni desborde horizontal, también a ancho de celular)
// y ejecuta los circuitos del recorrido de la presentación como lo haría una
// persona: clics, formularios y cambios de rol. Usa el Chrome instalado en la
// máquina; si no lo encuentra, se le indica con la variable CHROME_PATH.

import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { existsSync, mkdtempSync, readdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import puppeteer, { type Browser, type Page } from "puppeteer-core";
import { fechaDeHoy, mesDeFecha } from "../src/datos/fechas.ts";

const puerto = 3210;
const base = `http://localhost:${puerto}`;
const raiz = new URL("..", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const mes = mesDeFecha(fechaDeHoy());

const rutasDeChrome = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter((ruta): ruta is string => Boolean(ruta));

// --- Resultados ---

const resultados: { nombre: string; ok: boolean; detalle?: string }[] = [];

async function prueba(nombre: string, cuerpo: () => Promise<void>) {
  try {
    await cuerpo();
    resultados.push({ nombre, ok: true });
    console.log(`  ✓ ${nombre}`);
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    resultados.push({ nombre, ok: false, detalle });
    console.log(`  ✗ ${nombre}\n      ${detalle}`);
  }
}

function afirmar(condicion: unknown, mensaje: string): asserts condicion {
  if (!condicion) throw new Error(mensaje);
}

// --- Ayudas sobre la página ---

const erroresDeConsola: string[] = [];

async function abrir(navegador: Browser, ancho = 1366, alto = 900) {
  const pagina = await navegador.newPage();
  await pagina.setViewport({ width: ancho, height: alto });
  pagina.on("console", (mensaje) => {
    if (mensaje.type() === "error") erroresDeConsola.push(`${pagina.url()}: ${mensaje.text()}`);
  });
  pagina.on("pageerror", (error) => erroresDeConsola.push(`${pagina.url()}: ${error instanceof Error ? error.message : String(error)}`));
  return pagina;
}

// Navega y espera a que la pantalla se dibuje (los datos viven en el navegador).
async function ir(pagina: Page, ruta: string) {
  await pagina.goto(base + ruta, { waitUntil: "networkidle0" });
  await pagina.waitForSelector("main h1", { timeout: 20000 });
}

const texto = (pagina: Page) => pagina.evaluate(() => document.body.innerText);

async function esperarTexto(pagina: Page, buscado: string | RegExp, tiempo = 8000) {
  const patron = typeof buscado === "string" ? buscado : buscado.source;
  const esRegex = typeof buscado !== "string";
  await pagina
    .waitForFunction(
      (patronTexto: string, regex: boolean) => (regex ? new RegExp(patronTexto).test(document.body.innerText) : document.body.innerText.includes(patronTexto)),
      { timeout: tiempo },
      patron,
      esRegex,
    )
    .catch(() => {
      throw new Error(`No apareció el texto: ${String(buscado)}`);
    });
}

// Hace clic en el botón (o elemento con rol de botón) cuyo texto coincide,
// dentro del contenedor indicado; si hay varios, en el último (por ejemplo, el
// diálogo que se abrió encima).
async function clic(pagina: Page, textoBoton: string, contenedor = "body", cual: "primero" | "ultimo" = "primero") {
  const hecho = await pagina.evaluate(
    (buscado: string, selector: string, posicion: string) => {
      const contenedores = Array.from(document.querySelectorAll(selector));
      const raizBusqueda = contenedores[contenedores.length - 1] ?? document.body;
      const candidatos = Array.from(raizBusqueda.querySelectorAll<HTMLElement>("button, [role=button], a, [role=menuitemradio], [role=menuitem], [role=switch]")).filter(
        (elemento) => elemento.innerText.trim().replace(/\s+/g, " ").includes(buscado) && !(elemento as HTMLButtonElement).disabled,
      );
      const elegido = posicion === "ultimo" ? candidatos[candidatos.length - 1] : candidatos[0];
      if (!elegido) return false;
      elegido.scrollIntoView({ block: "center" });
      elegido.click();
      return true;
    },
    textoBoton,
    contenedor,
    cual,
  );
  afirmar(hecho, `No encontré el botón "${textoBoton}" en ${contenedor}`);
}

const dialogo = "[data-slot=dialog-content], [data-slot=sheet-content]";

// Escribe en un campo controlado por React.
async function escribir(pagina: Page, selector: string, valor: string) {
  await pagina.waitForSelector(selector);
  await pagina.$eval(
    selector,
    (elemento, nuevo) => {
      const campo = elemento as HTMLInputElement | HTMLTextAreaElement;
      const prototipo = campo instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
      Object.getOwnPropertyDescriptor(prototipo, "value")!.set!.call(campo, nuevo);
      campo.dispatchEvent(new Event("input", { bubbles: true }));
    },
    valor,
  );
}

async function cambiarRol(pagina: Page, rol: "Gerente" | "Administración" | "Ventas") {
  await pagina.evaluate(() => {
    const disparadores = Array.from(document.querySelectorAll<HTMLElement>("header [data-slot=dropdown-menu-trigger]"));
    disparadores[disparadores.length - 1]?.click();
  });
  await pagina.waitForSelector("[role=menuitemradio]");
  await clic(pagina, `${rol} ·`, "[data-slot=dropdown-menu-content]");
  await new Promise((resolver) => setTimeout(resolver, 300));
}

const numeroEn = async (pagina: Page, patron: RegExp) => {
  const coincidencia = (await texto(pagina)).match(patron);
  afirmar(coincidencia, `No encontré ${patron}`);
  return Number(coincidencia[1]);
};

// --- Servidor ---

function iniciarServidor(): Promise<ChildProcess> {
  const proceso = spawn("pnpm", ["exec", "next", "start", "-p", String(puerto)], { cwd: raiz, shell: true, stdio: "pipe" });
  return new Promise((resolver, rechazar) => {
    const limite = setTimeout(() => rechazar(new Error("El servidor no arrancó en 60 segundos")), 60000);
    const revisar = async () => {
      try {
        const respuesta = await fetch(base);
        if (respuesta.ok) {
          clearTimeout(limite);
          resolver(proceso);
          return;
        }
      } catch {
        // Todavía no responde.
      }
      setTimeout(revisar, 500);
    };
    revisar();
  });
}

function detenerServidor(proceso: ChildProcess) {
  if (process.platform === "win32" && proceso.pid) spawnSync("taskkill", ["/pid", String(proceso.pid), "/T", "/F"]);
  else proceso.kill();
}

// --- Pruebas ---

const rutas = [
  "/", "/personal", "/personal/per-01", "/vacaciones", "/vacaciones?vista=saldos", "/vacaciones?vista=calendario", "/dias-libres",
  "/planilla", `/planilla/${mes}/per-01`, "/mis-vacaciones", "/clientes", "/clientes/cli-001", "/embudo", "/seguimientos",
  "/ciclo-ventas", "/facturas", "/facturas/fac-1202", "/cobros", "/plan-cuentas", "/libro-diario", "/libro-mayor",
  "/reportes", "/reportes?vista=resultados", "/activos", "/activos/af-002", "/depreciacion", "/configuracion",
];

async function recorrerPantallas(navegador: Browser) {
  const pagina = await abrir(navegador);
  for (const ruta of rutas) {
    await prueba(`Pantalla ${ruta} carga sin errores ni desborde`, async () => {
      const antes = erroresDeConsola.length;
      await ir(pagina, ruta);
      const contenido = await texto(pagina);
      afirmar(!/Application error|Unhandled Runtime Error|No encontramos/.test(contenido), "La pantalla muestra un error");
      const desborde = await pagina.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      afirmar(desborde <= 1, `Desborde horizontal de ${desborde}px`);
      afirmar(erroresDeConsola.length === antes, `Errores de consola: ${erroresDeConsola.slice(antes).join(" | ")}`);
    });
  }
  await pagina.close();

  const celular = await abrir(navegador, 390, 844);
  for (const ruta of ["/", "/embudo", "/clientes", "/planilla", "/facturas/fac-1202", `/planilla/${mes}/per-01`, "/ciclo-ventas"]) {
    await prueba(`Pantalla ${ruta} a ancho de celular sin desborde`, async () => {
      await ir(celular, ruta);
      const desborde = await celular.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      afirmar(desborde <= 1, `Desborde horizontal de ${desborde}px`);
    });
  }
  await celular.close();
}

async function recorridoDeLaPresentacion(navegador: Browser, carpetaDescargas: string) {
  const pagina = await abrir(navegador);
  const sesion = await pagina.createCDPSession();
  await sesion.send("Browser.setDownloadBehavior", { behavior: "allow", downloadPath: carpetaDescargas });

  await prueba("Inicio del gerente con avisos en la campana", async () => {
    await ir(pagina, "/");
    await esperarTexto(pagina, "Vista de Gerente");
    const avisos = await pagina.$eval("header [aria-label^='Avisos']", (elemento) => elemento.getAttribute("aria-label"));
    afirmar(avisos && /Avisos: [1-9]/.test(avisos), `La campana no tiene avisos (${avisos})`);
  });

  await prueba("Registrar un seguimiento vencido y agendar el próximo", async () => {
    await ir(pagina, "/seguimientos");
    // El título va en mayúsculas por CSS, así que se busca sin distinguirlas.
    const antes = await numeroEn(pagina, /Vencidos \((\d+)\)/i);
    await clic(pagina, "Registrar");
    await escribir(pagina, "#descripcion-actividad", "Llamada con el cliente: revisan la propuesta el viernes.");
    await clic(pagina, "Registrar", dialogo, "ultimo");
    await esperarTexto(pagina, "registrada");
    const despues = await numeroEn(pagina, /Vencidos \((\d+)\)/i);
    afirmar(despues === antes - 1, `Vencidos pasó de ${antes} a ${despues}`);
  });

  let numeroFactura = 0;
  let rutaFactura = "";
  await prueba("Ganar una oportunidad en el embudo y emitir su factura", async () => {
    await ir(pagina, "/embudo");
    await pagina.click("section[aria-label='Negociación'] [role=button]");
    await pagina.waitForSelector("[data-slot=sheet-content]");
    await clic(pagina, "Ganada", "[data-slot=sheet-content]");
    await esperarTexto(pagina, "todavía sin facturar");
    await clic(pagina, "Emitir factura", "[data-slot=sheet-content]");
    await pagina.waitForSelector("#documento-factura");
    await clic(pagina, "Emitir factura", "[data-slot=dialog-content]", "ultimo");
    await pagina.waitForFunction(() => location.pathname.startsWith("/facturas/"), { timeout: 10000 });
    await esperarTexto(pagina, "FACTURA SIMULADA");
    await esperarTexto(pagina, "Asientos contables");
    numeroFactura = await numeroEn(pagina, /FACTURA N°\s*(\d+)/);
    rutaFactura = new URL(pagina.url()).pathname;
  });

  await prueba("El asiento de la factura ya está en el libro diario", async () => {
    afirmar(numeroFactura > 0, "No hay factura emitida");
    await ir(pagina, "/libro-diario");
    await esperarTexto(pagina, `Factura N° ${numeroFactura}`);
  });

  await prueba("Descargar la factura en PDF", async () => {
    await ir(pagina, rutaFactura);
    await clic(pagina, "PDF");
    await new Promise((resolver) => setTimeout(resolver, 1500));
    afirmar(readdirSync(carpetaDescargas).some((archivo) => archivo === `factura-${numeroFactura}.pdf`), "No se descargó el PDF de la factura");
  });

  await prueba("Desactivar y activar el módulo de facturación", async () => {
    await ir(pagina, "/configuracion");
    await pagina.click("[role=switch]");
    await esperarTexto(pagina, "Inactivo");
    const menu = await pagina.$eval("[data-slot=sidebar]", (elemento) => (elemento as HTMLElement).innerText);
    afirmar(!menu.includes("Facturas"), "El menú sigue mostrando Facturas");
    await ir(pagina, "/facturas");
    await esperarTexto(pagina, "está desactivado");
    await ir(pagina, "/configuracion");
    await pagina.click("[role=switch]");
    await esperarTexto(pagina, "Activo");
  });

  await prueba("Ventas pide vacaciones y el gerente las aprueba", async () => {
    await cambiarRol(pagina, "Ventas");
    await ir(pagina, "/mis-vacaciones");
    await clic(pagina, "Solicitar vacaciones");
    await pagina.waitForSelector("#desde-vacacion");
    await clic(pagina, "Enviar solicitud", dialogo, "ultimo");
    await esperarTexto(pagina, "Pendiente");
    await cambiarRol(pagina, "Gerente");
    await ir(pagina, "/vacaciones");
    const pendientes = await numeroEn(pagina, /Solicitudes por aprobar\s*(\d+)/);
    afirmar(pendientes === 2, `Se esperaban 2 solicitudes por aprobar y hay ${pendientes}`);
    await clic(pagina, "Aprobar");
    await esperarTexto(pagina, "Vacaciones aprobadas");
    afirmar((await numeroEn(pagina, /Solicitudes por aprobar\s*(\d+)/)) === 1, "La solicitud no salió de pendientes");
  });

  await prueba("Cerrar la planilla del mes y abrir una boleta", async () => {
    await ir(pagina, "/planilla");
    await esperarTexto(pagina, "sin goce");
    await clic(pagina, "Cerrar planilla");
    await pagina.waitForSelector("[data-slot=dialog-content]");
    await clic(pagina, "Cerrar planilla", "[data-slot=dialog-content]", "ultimo");
    await esperarTexto(pagina, /Cerrada\s/);
    await ir(pagina, `/planilla/${mes}/per-07`);
    await esperarTexto(pagina, "BOLETA DE PAGO");
    await esperarTexto(pagina, "Días no pagados");
    afirmar(!(await texto(pagina)).includes("Vista previa"), "La boleta sigue como vista previa tras cerrar");
    await clic(pagina, "Descargar PDF");
    await new Promise((resolver) => setTimeout(resolver, 1500));
    afirmar(readdirSync(carpetaDescargas).some((archivo) => archivo.startsWith(`boleta-${mes}`)), "No se descargó el PDF de la boleta");
  });

  await prueba("Registrar la depreciación del mes", async () => {
    await ir(pagina, "/depreciacion");
    await clic(pagina, "Registrar depreciación");
    await esperarTexto(pagina, "Registrada");
  });

  await prueba("Los reportes siguen cuadrando después de todo", async () => {
    await ir(pagina, "/reportes");
    await esperarTexto(pagina, "Las sumas y los saldos cuadran");
  });

  await prueba("Administración no entra al CRM", async () => {
    await cambiarRol(pagina, "Administración");
    await ir(pagina, "/clientes");
    await esperarTexto(pagina, "no está disponible para su rol");
  });

  await prueba("Ventas ve solo sus clientes", async () => {
    await cambiarRol(pagina, "Ventas");
    await ir(pagina, "/clientes");
    await esperarTexto(pagina, "Mis clientes");
    const total = await numeroEn(pagina, /(\d+) clientes ·/);
    afirmar(total > 0 && total < 100, `Ventas ve ${total} clientes`);
    await cambiarRol(pagina, "Gerente");
  });

  await prueba("Reiniciar la demo vuelve al estado inicial", async () => {
    await ir(pagina, "/planilla");
    await clic(pagina, "Reiniciar demo");
    await clic(pagina, "Reiniciar", "[data-slot=dialog-content]", "ultimo");
    await esperarTexto(pagina, "Por cerrar");
  });

  await pagina.close();
}

async function principal() {
  if (!process.argv.includes("--sin-build")) {
    console.log("Compilando…");
    const compilacion = spawnSync("pnpm", ["build"], { cwd: raiz, shell: true, stdio: "inherit" });
    if (compilacion.status !== 0) process.exit(1);
  }
  const chrome = rutasDeChrome.find((ruta) => existsSync(ruta));
  if (!chrome) {
    console.error("No encontré Chrome. Indique su ruta en la variable CHROME_PATH.");
    process.exit(1);
  }

  console.log(`Levantando la demo en ${base}…`);
  const servidor = await iniciarServidor();
  const carpetaDescargas = mkdtempSync(join(tmpdir(), "ordia-pruebas-"));
  const navegador = await puppeteer.launch({ executablePath: chrome, headless: true, args: ["--no-first-run"] });
  try {
    console.log("\nPantallas");
    await recorrerPantallas(navegador);
    console.log("\nRecorrido de la presentación");
    await recorridoDeLaPresentacion(navegador, carpetaDescargas);
  } finally {
    await navegador.close();
    detenerServidor(servidor);
  }

  const fallidas = resultados.filter((resultado) => !resultado.ok);
  console.log(`\n${resultados.length - fallidas.length} de ${resultados.length} pruebas pasaron.`);
  if (erroresDeConsola.length > 0) console.log(`Errores de consola registrados: ${erroresDeConsola.length}`);
  process.exit(fallidas.length === 0 ? 0 : 1);
}

await principal();
