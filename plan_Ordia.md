# Ordia, demo de gestión administrativa — Plan de trabajo y contexto

Preparado el 04/11/2026 para arrancar el proyecto en un **repositorio nuevo**, separado de Yaku y de Tercia. Este documento se sostiene solo: quien lo lea no necesita conocer Yaku, Tercia ni las conversaciones en las que se decidió.

---

## 1. Contexto

### Quiénes somos

- **Zékiri** es la empresa que desarrolla software.
  - **Yaku** es su plataforma SaaS para negocios: inventario, pedidos, entregas, CRM, contenido para redes, personal y sucursales.
  - **Tercia** es su demo de recursos humanos para tercerizadoras de personal: reclutamiento, asignación a clientes, conciliación de asistencia y planilla.
- **Diego Trigo** es el desarrollador a cargo.
- **Dani** lleva la relación con el cliente.
- **Line** (Zékiri) ya trabajó antes en facturación. Es la referencia para ese módulo.

### El cliente

- **Alianza** es una empresa con un equipo interno de **10 personas** que maneja unos **100 clientes**.
- **El pedido original:** "Preparar demo plataforma de RRHH que calcule vacaciones, días libres, planilla de pagos. Gestión de activos fijos, contabilidad, facturación. CRM para registro de clientes que tenga alarmas para notificar cuándo hacer seguimiento, monitorear y controlar ciclo de ventas."

### Lo que precisó Dani (04/11/2026)

- **Casi no reclutan:** son un equipo chico, así que el reclutamiento de Tercia no les sirve.
- **Lo importante de recursos humanos es lo administrativo:** planillas, control de vacaciones, días libres.
- **Facturación:** quieren ver cómo sería la plataforma **con y sin ese módulo**. Line ya hizo algo parecido antes.

### Por qué una demo aparte y no una ampliación de Tercia

- **Son productos distintos.** Tercia resuelve el problema de una tercerizadora: reclutar en volumen, repartir personal entre los clientes y cruzar la asistencia con la de ellos. Alianza necesita la gestión interna de una empresa chica: CRM, sueldos, facturación, contabilidad y activos.
- **"Cliente" significa otra cosa.** En Tercia es la empresa donde trabaja el personal; en Alianza es una cuenta comercial del CRM.
- **Tercia queda estable** para mostrarla a tercerizadoras y a empresas de limpieza.

La demo nueva sí **parte de la base de Tercia** (ver la sección 6), lo que ahorra unos dos días.

### Para quién es

No lleva el nombre de Alianza: se presenta como **Ordia**, la plataforma de gestión administrativa de Zékiri, con una empresa de ejemplo genérica. Así sirve para otros clientes parecidos:

- **Empresas chicas o medianas** (de 5 a 50 personas) que venden a otras empresas y necesitan ordenar su gestión interna.
- **Lo que tienen en común:** sueldos y vacaciones, seguimiento comercial de sus clientes, facturación y contabilidad, hoy repartidos en hojas de cálculo y en herramientas sueltas.

Los textos, los datos de ejemplo y los nombres de las pantallas no mencionan a Alianza ni a su rubro.

### Qué tipo de demo

- **Un frontend con datos de ejemplo, recorrible y accionable**, igual que Tercia.
- **Muestra todo lo que tendría la plataforma y cómo funcionaría.** El trabajo va en las pantallas; solo se hace funcional lo que de verdad lo necesite para convencer.

### Fecha

**Sin confirmar.** El cronograma de la sección 7 está en días de trabajo, ordenado para que, si la fecha llega antes, lo que falte sea lo menos importante.

---

## 2. Qué dolores resuelve

1. **Vacaciones llevadas a mano.** Cuántos días le tocan a cada persona según su antigüedad, cuántos tomó y cuántos le quedan.
2. **Días libres y permisos sin control de saldo.**
3. **Planilla de sueldos armada en hojas de cálculo:** haber básico, bono de antigüedad, descuentos, aportes y líquido pagable, cada mes.
4. **Seguimientos comerciales que se olvidan.** Con 100 clientes, nadie recuerda a quién había que llamar el jueves.
5. **Sin visibilidad del ciclo de ventas:** en qué etapa está cada oportunidad, cuáles están estancadas y cuánto tarda en cerrarse una venta.
6. **Facturación, contabilidad y activos fijos sueltos,** cada uno en su herramienta, sin que una venta o un sueldo se reflejen solos en la contabilidad.

---

## 3. Qué muestra la demo

Ordenado por prioridad. Lo **esencial** es lo que Dani marcó como importante; lo demás va **liviano pero conectado**: muestra la integración sin construir un sistema completo.

### 3.1 Recursos humanos administrativo (esencial, lo más importante para Alianza)

| Pantalla | Qué hace |
|---|---|
| Personal | Las 10 personas, con cargo, área, fecha de ingreso, antigüedad, sueldo básico y saldos de vacaciones y días libres |
| Ficha de la persona | Datos de contacto y contrato, antigüedad, historial de vacaciones, días libres y permisos, y sus boletas de pago |
| Vacaciones | Días que le corresponden a cada persona según su antigüedad, días tomados y saldo. Solicitud, aprobación o rechazo, y un calendario del equipo para ver quién está fuera y cuándo |
| Días libres y permisos | Días libres ganados (por ejemplo, por trabajar un feriado o un fin de semana) y su uso, y permisos con o sin goce de haber, cada uno con su saldo |
| Planilla del mes | Por persona: haber básico, bono de antigüedad, total ganado, descuentos (AFP, RC-IVA, días sin goce de haber) y líquido pagable. Totales del mes, aportes patronales y provisiones de aguinaldo e indemnización. Cerrar la planilla la deja fija y genera su asiento contable, con las provisiones incluidas |
| Boleta de pago | La boleta de cada persona, lista para imprimir o descargar en PDF |

**Cálculo de vacaciones (art. 44 de la Ley General del Trabajo; revisado el 04/11/2026):**

| Antigüedad | Días hábiles por gestión |
|---|---|
| Menos de 1 año | Todavía no corresponden; se muestra cuándo se cumplen |
| De 1 a menos de 5 años | 15 |
| De 5 a menos de 10 años | 20 |
| 10 años o más | 30 |

La vacación no se acumula, salvo acuerdo escrito o si el empleador no la otorgó, y como máximo por dos gestiones (art. 33 del Reglamento de la Ley General del Trabajo y D.S. 4709). La demo cuenta en el saldo las dos últimas gestiones cumplidas.

**Parámetros de la planilla (revisados contra la normativa el 04/11/2026; lo marcado "a validar" se confirma con Line o con un contador):**

- **Salario mínimo nacional:** Bs 3.300 desde el 1 de enero de 2026 (D.S. 5516). Es la base del bono de antigüedad y del RC-IVA.
- **Bono de antigüedad:** un porcentaje de 3 salarios mínimos (Bs 9.900), según los años de servicio. La escala es la del D.S. 21060; la base de 3 salarios mínimos la fija el D.S. 23474 para empresas productivas, y la jurisprudencia la extiende a las de servicios (a validar para el cliente):

  | Años de servicio | Porcentaje |
  |---|---|
  | Menos de 2 | Sin bono |
  | 2 a 4 | 5% |
  | 5 a 7 | 11% |
  | 8 a 10 | 18% |
  | 11 a 14 | 26% |
  | 15 a 19 | 34% |
  | 20 a 24 | 42% |
  | 25 o más | 50% |

- **Aporte laboral (Gestora):** 12,71% del total ganado.
- **Aporte nacional solidario:** 1,15% de lo que el total ganado excede Bs 13.000, más 5,74% de lo que excede Bs 25.000, más 11,48% de lo que excede Bs 35.000 (Ley 1582 y D.S. 5280, desde octubre de 2024). En la demo solo el gerente pasa el primer tramo.
- **RC-IVA:** se calcula como en la planilla tributaria:
  1. Sueldo neto: total ganado menos los aportes laborales.
  2. Se le resta el mínimo no imponible, que son 2 salarios mínimos.
  3. Se aplica el 13% a la diferencia.
  4. A ese impuesto se le resta el 13% de 1 salario mínimo (antes eran 2; lo cambió el D.S. 5383 desde mayo de 2025).

  En la práctica paga quien tiene un sueldo neto de más de 3 salarios mínimos. En la demo se simplifica, sin el descargo con facturas (formulario 110).
- **Aportes patronales (17,21% en total):**
  - Caja de salud: 10%.
  - Riesgo profesional: 1,71%.
  - Aporte patronal solidario: 3,5% (era 3% hasta septiembre de 2024; Ley 1582 y D.S. 5280).
  - Vivienda: 2%.
- **Provisiones mensuales:** aguinaldo 8,33% e indemnización 8,33% del total ganado. No se descuentan al trabajador; van en el asiento de la planilla.
- **Días sin goce de haber (a validar):** se descuentan del haber básico y del bono de antigüedad antes de calcular los aportes y el RC-IVA.
- **Permisos con goce de haber (a validar):** 3 días por año, como política de la empresa de ejemplo.
- **Feriados:** los nacionales, el departamental de Cochabamba y los cambios del decreto de cada año (para 2026, el D.S. 5521: el 22 de enero pasa al 23, el 21 de junio al 22, y se suman el 5 de junio y el 7 de agosto).

Todos van en un archivo de parámetros, así que corregirlos no toca la lógica.

### 3.2 CRM y ciclo de ventas (esencial)

| Pantalla | Qué hace |
|---|---|
| Clientes | Los 100 clientes, con rubro, ciudad, contacto, vendedor a cargo, estado (prospecto, activo, inactivo) y fecha del próximo seguimiento. Búsqueda y filtros |
| Ficha del cliente | Datos y contactos, oportunidades, historial de actividades (llamadas, reuniones, correos, notas) y seguimientos pendientes. Si el módulo de facturación está activo, también sus facturas y su saldo por cobrar |
| Embudo de ventas | Tablero por etapas: prospecto, contactado, propuesta enviada, negociación, ganada y perdida. Las oportunidades se arrastran de una etapa a otra, con monto y probabilidad |
| Seguimientos y alarmas | La lista de hoy, las de esta semana y las vencidas, resaltadas. Una campana en el encabezado avisa cuántas hay. Desde una alarma se registra la actividad y se agenda el próximo seguimiento |
| Alarmas automáticas | Además de las que agenda cada vendedor: oportunidades sin actividad en más de N días, propuestas sin respuesta y clientes activos sin contacto en el último mes |
| Control del ciclo de ventas | Monto en cada etapa, tasa de conversión entre etapas, días promedio hasta cerrar, oportunidades estancadas y resultados por vendedor |

**De dónde sale:** Yaku ya tiene un CRM. Antes de construir esta parte, hay que revisar cuánto se puede trasladar (modelo de datos, pantallas, componentes).

### 3.3 Facturación (simulada, con interruptor de módulo)

**Mientras se confirma cómo lo hizo Line, la facturación es solo una simulación.** No hay conexión con Impuestos Nacionales ni con el SIAT.

| Pantalla | Qué hace |
|---|---|
| Facturas | Lista de facturas emitidas, con cliente, fecha, monto y estado (vigente, anulada, cobrada, por cobrar) |
| Emitir factura | Desde una oportunidad ganada o desde la ficha del cliente: NIT o carnet, razón social, detalle y monto. Se ve con el formato de una factura en línea del SIAT: número, CUF (código único de factura) simulado, código QR, la leyenda de la Ley 453 y la nota de representación gráfica de un documento fiscal digital. Lista para descargar en PDF |
| Anular factura | Con motivo; revierte su asiento contable |
| Cobros | Registrar el pago de una factura. El saldo por cobrar se ve en la ficha del cliente |

**Con y sin el módulo (a confirmar con Dani y con lo que haga Line):**

Un interruptor en "Configuración > Módulos" activa o desactiva la facturación en vivo durante la presentación.

| | Sin facturación | Con facturación |
|---|---|---|
| Menú | No aparece "Facturación" | Aparece "Facturación" |
| Venta ganada en el CRM | Se registra el monto; la factura se emite en el sistema que ya usan | Se emite la factura desde la misma oportunidad |
| Contabilidad | El ingreso se registra con un asiento manual | El asiento del ingreso y la cuenta por cobrar se generan solos |
| Ficha del cliente | Sin facturas ni saldo | Facturas y saldo por cobrar |

Aunque al final no se use el interruptor, construir la facturación como un módulo aislado no cuesta más. Quitarla o mostrarla sola queda resuelto.

### 3.4 Contabilidad (liviana, conectada)

| Pantalla | Qué hace |
|---|---|
| Plan de cuentas | Un plan de cuentas simplificado de una empresa de servicios |
| Libro diario | Asientos con su origen: automáticos (factura, cobro, planilla, depreciación) y manuales. Se pueden registrar asientos manuales con validación de debe igual a haber |
| Libro mayor | Movimientos y saldo por cuenta |
| Reportes | Balance de comprobación y estado de resultados del mes |

Lo que vende es el circuito: **emitir una factura, cerrar la planilla o depreciar los activos genera el asiento solo.**

### 3.5 Activos fijos (liviano, conectado)

| Pantalla | Qué hace |
|---|---|
| Activos | Lista con categoría, fecha y valor de compra, responsable (una persona del personal), ubicación, valor actual y estado (en uso, en reparación, dado de baja) |
| Ficha del activo | Datos, responsable, cuadro de depreciación mes a mes e historial (asignaciones, reparaciones, baja) |
| Depreciación del mes | Depreciación lineal por categoría según la vida útil de la normativa boliviana (por ejemplo, equipos de computación 4 años, vehículos 5 años, muebles 10 años; a validar). Genera su asiento contable |

### 3.6 Inicio y roles (si da el tiempo)

- **Inicio:** un tablero con los seguimientos de hoy y los vencidos, el embudo resumido, las ventas del mes, quién está de vacaciones, el estado de la planilla y, si el módulo está activo, lo facturado y lo pendiente de cobro.
- **Roles, sin inicio de sesión real:**
  - **Gerente:** ve todo y aprueba vacaciones.
  - **Administración:** recursos humanos, planilla, facturación, contabilidad y activos.
  - **Ventas:** CRM, solo con sus clientes y seguimientos.
- **Solicitud de vacaciones por la propia persona:** una vista simple, "Mis vacaciones", donde alguien del equipo pide días y el gerente los aprueba. Muestra el circuito completo.

---

## 4. Qué funciona de verdad y qué es simulado

| Pieza | Propuesta |
|---|---|
| Navegación, listas, fichas, filtros y cambios de estado | Funcionan sobre los datos de ejemplo. Lo que se cambia queda guardado en el navegador, y un botón "Reiniciar demo" vuelve al estado inicial |
| Vacaciones, días libres y saldos | **Funcional:** el cálculo por antigüedad y los saldos se actualizan al aprobar una solicitud |
| Planilla y boletas | **Funcional:** se calcula a partir de los sueldos, la antigüedad, los parámetros y las ausencias del mes |
| Alarmas del CRM | **Funcional:** se calculan contra la fecha de la demo. Las automáticas salen de la última actividad de cada oportunidad |
| Embudo de ventas | **Funcional:** mover una oportunidad cambia los indicadores del ciclo de ventas |
| Facturación | **Simulada:** la factura se ve real (número, CUF, QR, PDF), pero no se envía a ningún lado |
| Asientos automáticos | **Funcionales:** factura, cobro, planilla cerrada y depreciación generan su asiento, y los reportes se recalculan |
| Interruptor del módulo de facturación | **Funcional**, si se confirma la idea |
| Notificaciones | Dentro de la plataforma (campana y lista). Sin correos ni mensajes reales |

---

## 5. Datos de ejemplo

- **Empresa:** una empresa de servicios genérica, con oficina en Cochabamba. El nombre es provisional (por ejemplo, "Empresa ADC", como en Tercia).
- **Equipo de 10 personas:** gerente, 3 o 4 vendedores, administración y contabilidad, y operaciones. Con antigüedades variadas para que se vean los tres tramos de vacaciones:
  - al menos una persona con menos de 1 año;
  - varias entre 1 y 5 años;
  - una con más de 5 años;
  - una con más de 10 años.
- **Vacaciones y días libres:** historial de la gestión, una solicitud pendiente de aprobar y alguien de vacaciones en la fecha de la demo.
- **Planilla:** los meses anteriores cerrados y el mes actual por cerrar, con algún permiso sin goce de haber que descuente.
- **CRM:**
  - **Clientes:** 100, entre prospectos, activos e inactivos, de rubros y ciudades variadas.
  - **Oportunidades:** unas 40 abiertas, repartidas en el embudo, y un historial de ganadas y perdidas de los últimos 6 meses para que los indicadores muestren algo.
  - **Actividades:** varias por cliente.
  - **Seguimientos:** algunos para hoy, algunos vencidos y algunas oportunidades estancadas que disparen alarmas automáticas.
- **Facturas:** de los últimos 6 meses, los mismos de la historia contable, para que cada mes del estado de resultados tenga sus ingresos. Entre las recientes hay una anulada y reemitida, algunas por cobrar, una vencida y una cobrada en parte.
- **Activos fijos:** unos 25 (computadoras, muebles, un vehículo, equipos de oficina), cada uno con su responsable y uno dado de baja.
- **Contabilidad:** los asientos que generan todo lo anterior, más algunos manuales (alquiler, servicios básicos).
- **Nombres:** realistas de Bolivia, pero inventados. **Nada de datos reales de Alianza.**
- **Fechas relativas al día en que se abre la demo,** no fijas. Como la fecha de la presentación no está confirmada, así siempre hay seguimientos de hoy, alguno vencido, alguien de vacaciones y una planilla del mes por cerrar, se presente cuando se presente.

---

## 6. Cómo construirlo

### Qué se reutiliza de Tercia

| Pieza de Tercia | Uso en Ordia |
|---|---|
| Configuración del proyecto | Next.js 16 con App Router, Cache Components, React Compiler, Tailwind y shadcn/ui sobre Base UI. Se copia tal cual |
| Marco del panel | Barra lateral, encabezado de página, selector de rol, botón "Reiniciar demo" y esqueletos de carga |
| Estado de la demo | Almacén en el navegador con `useSyncExternalStore`, sincronización entre pestañas y versión del estado |
| Datos de ejemplo | Generador con semilla fija, nombres e identidades bolivianas y utilidades de fechas |
| Filtros en la dirección | `useFiltroUrl` y sus variantes, para que los filtros sobrevivan al volver atrás |
| Personal | La lista y la ficha de la persona, sin asignaciones a clientes ni calificación. Se agregan contrato, sueldo y saldos |
| Permisos y ausencias | El registro de ausencias de la ficha, como base de días libres y permisos |
| Planilla | La estructura de la vista. El cálculo cambia: sueldo mensual con descuentos y aportes en lugar de tarifa por día |
| Formato | Fechas, montos en bolivianos y pluralización |
| PDF | `scripts/pdf-simple.ts`, el generador de PDF de una página que usan los currículums, como base de las boletas de pago. Hoy solo dibuja texto y líneas: para el QR de la factura hay que agregarle rectángulos rellenos o una imagen |

**Pruebas de punta a punta:** el repositorio de Tercia no tiene un arnés de pruebas (no está Puppeteer en las dependencias ni hay scripts de prueba en `scripts/`). Si se armó en la sesión de Tercia, hay que buscarlo; si no, se arma para Ordia el día 7.

**Gestor de paquetes:** Tercia se instaló con npm (tiene `package-lock.json`). La convención de Zékiri es pnpm; Ordia arranca con pnpm.

**Lo que no se copia:** reclutamiento, postulación pública, clientes con sucursales y cobertura, asignaciones, conciliación de asistencia y currículums de ejemplo.

### Lo nuevo

CRM (o lo que se traslade del de Yaku), facturación simulada con PDF y QR, contabilidad, activos fijos, el interruptor de módulos y las notificaciones.

### Sin base de datos

Igual que Tercia:

- los datos de ejemplo van en archivos TypeScript del proyecto;
- lo que se cambia en la demo se guarda en el navegador;
- no hay nada que cuidar después de la demo.

### Despliegue

Vercel, en un proyecto propio.

### Convenciones de Zékiri

- **Interfaz:** en español neutro, sin voseo ni regionalismos.
- **Sin emojis:** se usan íconos (lucide-react).
- **Nombres en el código:** también en español, completos y sin abreviaturas crípticas.
- **Documentos de trabajo:** en Markdown.
- **Commits y push:** los hace Diego; Claude le pasa los comandos.

---

## 7. Cronograma (sin fecha de demo, en días de trabajo)

Va primero lo que Dani marcó como importante. Si la fecha llega antes de terminar, se recorta desde el final.

| Día | Trabajo |
|---|---|
| **Día 1** | Repositorio `ordia-demo` a partir de la base de Tercia, limpieza de lo que no aplica, navegación de los 5 módulos y datos de ejemplo: equipo, clientes y oportunidades. También el plan de cuentas y el modelo de asiento, porque la planilla (día 3) y la factura (día 5) ya generan asientos |
| **Día 2** | Recursos humanos: personal, ficha, vacaciones con cálculo por antigüedad, solicitudes, calendario del equipo, días libres y permisos |
| **Día 3** | Planilla del mes con parámetros, cierre y boletas en PDF |
| **Día 4** | CRM: clientes, ficha, actividades, embudo de ventas, seguimientos y alarmas (las agendadas y las automáticas) |
| **Día 5** | Control del ciclo de ventas. Facturación simulada: emitir, anular, cobrar y PDF. Interruptor de módulos |
| **Día 6** | Pantallas de contabilidad (plan de cuentas, libro diario con asientos manuales, mayor y reportes) y activos fijos con depreciación. Inicio y roles |
| **Día 7** | Pruebas de punta a punta, plan de pruebas manuales, correcciones, despliegue y guion de la presentación |

Si hay que recortar, lo primero que se simplifica es contabilidad y activos fijos: solo listas y asientos automáticos, sin reportes.

---

## 8. Recorrido sugerido para presentarla

1. **Inicio:** "esto es lo que ve el gerente al entrar": seguimientos de hoy, ventas del mes y quién está de vacaciones.
2. **CRM:** abrir una alarma vencida, registrar la llamada y agendar el próximo seguimiento. Mover una oportunidad a "Ganada" en el embudo.
3. **Facturación:** emitir la factura de esa venta y descargar el PDF.
4. **Contabilidad:** ver que el asiento de la factura ya está en el libro diario.
5. **Con y sin el módulo:** desactivar la facturación y mostrar cómo queda el mismo circuito sin ella.
6. **Vacaciones:** una persona pide días, el gerente los aprueba y el saldo se actualiza. Mostrar a alguien con 20 días por su antigüedad.
7. **Planilla:** revisar el mes, ver el descuento de un permiso sin goce de haber, cerrarla, abrir una boleta y ver su asiento.
8. **Activos fijos:** una computadora con su responsable y su cuadro de depreciación.
9. **Control del ciclo de ventas:** cerrar con los indicadores.

---

## 9. Decisiones

### Tomadas (04/11/2026)

1. **Demo aparte, no una ampliación de Tercia,** partiendo de su base técnica.
2. **Sin reclutamiento.** Recursos humanos se enfoca en lo administrativo: vacaciones, días libres, permisos y planilla.
3. **Facturación simulada por ahora,** sin conexión con el SIAT, hasta confirmar cómo lo hizo Line.
4. **Nombre genérico:** la plataforma se llama **Ordia** y usa una empresa de ejemplo genérica, para poder mostrarla a otros clientes.

### Pendientes

1. **Fecha de la demo.**
2. **Con y sin el módulo de facturación:** Diego confirma si le parece el interruptor en vivo, y qué hizo Line antes (demo, sistema en producción, integración con el SIAT, código o capturas reutilizables, cómo se mostró la diferencia).
3. **Nombre de la empresa de ejemplo:** ¿queda "Empresa ADC" o se le pone otro?
4. **Rubro de Alianza,** para que los clientes y las oportunidades de ejemplo se parezcan a los suyos sin nombrarlos.
5. **"Controlar el ciclo de ventas":** confirmar que se refiere al embudo por etapas, o si esperan también metas por vendedor.
6. **"Días libres":** confirmar si son días compensatorios (por trabajar feriados o fines de semana) o algo propio de la empresa.
7. **Profundidad de contabilidad y activos fijos:** si llevan contabilidad propia o tienen un contador externo, y qué esperan ver.
8. **Parámetros de la planilla, vacaciones y depreciación:** revisados contra la normativa el 04/11/2026 (salario mínimo, aportes, RC-IVA, bono de antigüedad, vacaciones y feriados). Quedan a validar con Line o con un contador: si los días sin goce también descuentan del bono, si la base de 3 salarios mínimos del bono aplica al cliente, el cupo de permisos con goce y la vida útil de los activos.
9. **CRM de Yaku (revisado el 04/11/2026, repositorio `autoflow`):** sus componentes dependen de la base de datos (server actions, tipos de Drizzle, editor de texto enriquecido), así que no se copiaron. Se trasladaron los patrones: tablero del embudo con arrastre nativo del navegador, días sin actividad en cada tarjeta (con el mismo umbral de 14 días) y línea de tiempo de actividades con un ícono por tipo.
10. **Dominio del despliegue.**
