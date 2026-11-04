# Ordia

Demo de la plataforma de gestión administrativa de Zékiri para empresas chicas o medianas: recursos humanos (vacaciones, días libres, permisos y planilla), CRM con seguimientos y ciclo de ventas, facturación simulada, contabilidad y activos fijos, conectados entre sí. El plan de trabajo y el contexto están en [plan_Ordia.md](plan_Ordia.md).

Es un frontend con datos de ejemplo: no hay base de datos ni inicio de sesión. Los cambios que se hacen durante la demo se guardan en el navegador, y el botón **Reiniciar demo** vuelve al estado inicial.

## Cómo levantarla

```bash
pnpm install
pnpm dev
```

Abre en http://localhost:3000.

## Estructura

| Carpeta o archivo | Contenido |
|---|---|
| `src/datos/tipos.ts` | Modelo de datos |
| `src/datos/parametros.ts` | Parámetros legales y de política (planilla, vacaciones, permisos, impuestos, depreciación). **Todos a validar** |
| `src/datos/plan-cuentas.ts` | Plan de cuentas y las cuentas que usan los asientos automáticos |
| `src/datos/` (resto) | Catálogos, feriados y generadores de los datos de ejemplo |
| `src/lib/contabilidad.ts` | Modelo de asiento: validación, numeración, saldos y asientos automáticos |
| `src/lib/vacaciones.ts` | Vacaciones por antigüedad, saldos de días libres y permisos |
| `src/lib/planilla.ts` | Cálculo de la planilla: bono de antigüedad, AFP, RC-IVA, aportes patronales y provisiones |
| `src/lib/demo/almacen.ts` | Estado de la demo en `localStorage`, sincronizado entre pestañas |
| `src/lib/navegacion.ts` | Módulos, pantallas y qué rol ve cada una |
| `src/components/` | Componentes de pantalla; `ui/` son los de shadcn/ui |
| `src/app/(panel)/` | Las pantallas |
| `scripts/` | Revisión de la planilla en consola y generador de PDF de una página (base de las boletas) |

## Revisar la planilla con un contador

```bash
pnpm revisar:planilla           # mes en curso
pnpm revisar:planilla 2026-10   # otro mes
```

Imprime la planilla de los datos de ejemplo concepto por concepto y el asiento que genera al cerrarse. Los porcentajes y montos salen de `src/datos/parametros.ts`: si algo no coincide, se corrige ahí.

## Datos de ejemplo

Las fechas son **relativas al día en que se abre la demo**: siempre hay seguimientos para hoy, alguno vencido, oportunidades estancadas y una planilla del mes por cerrar, se presente el día que se presente.

- Se generan con un generador pseudoaleatorio de semilla fija (`src/datos/semilla.ts`) a partir de la fecha de hoy. Con la misma fecha salen idénticos.
- Lo guardado en el navegador lleva la fecha en que se generó. Si la demo se abre otro día, se descarta y se vuelve a generar.
- Si se cambia la forma de los datos, hay que subir `versionEstadoDemo` en `src/datos/semilla.ts` para que los navegadores descarten lo guardado.

Los archivos de `src/datos/` y `src/lib/contabilidad.ts` importan con extensión `.ts` porque también los ejecuta Node directamente (por ejemplo, `node -e 'import("./src/datos/semilla.ts")'`).

## Roles

No hay inicio de sesión: el selector del encabezado cambia de rol.

- **Gerente:** ve todo y aprueba vacaciones.
- **Administración:** recursos humanos, planilla, facturación, contabilidad y activos.
- **Ventas:** el CRM, solo con sus clientes y seguimientos.

## Despliegue

En Vercel, importando el repositorio: detecta Next.js y pnpm solos, y no necesita variables de entorno ni base de datos.

## Notas técnicas

- La base técnica viene de Tercia: Next.js 16 con App Router, Cache Components, React Compiler, Tailwind y shadcn/ui sobre Base UI.
- Todo lo que depende de los datos de la demo se renderiza solo en el navegador, detrás de `<PuertaNavegador>` (`use(browser())`) dentro de un `<Suspense>`.
- `pnpm-workspace.yaml` está para que pnpm no tome como raíz otro `pnpm-workspace.yaml` de una carpeta superior.
- Antes de usar una API de Next.js, revisar `node_modules/next/dist/docs/`.
