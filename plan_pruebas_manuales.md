# Plan de pruebas manuales de Ordia

Recorrido completo de la demo antes de presentarla. Cada paso dice qué hacer y qué debería verse. Si algo no coincide, anótalo en la columna de observaciones con el número del paso.

**Antes de empezar:**

- Las fechas de los datos son relativas al día en que se abre la demo. Las cantidades de este plan son las que se mantienen iguales cualquier día. Donde un número depende de la fecha, el paso lo dice.
- Cada sección cambia datos que usan las siguientes. Si te salteas algo o repites un paso, usa **Reiniciar demo** y retoma desde el inicio de esa sección. Las secciones que necesitan empezar de cero lo indican.
- Las pruebas automáticas (`pnpm pruebas`) ya cubren que todas las pantallas carguen sin errores ni desborde y el recorrido principal. Este plan cubre lo que conviene ver con ojos: textos, diseño, diálogos, selectores, impresión y el celular.

---

## 0. Preparación

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 0.1 | `pnpm install` y `pnpm dev`. Abrir http://localhost:3000 en Chrome | Un esqueleto un instante y luego el Inicio | | |
| 0.2 | Menú lateral → **Reiniciar demo** → Reiniciar | Aviso "La demo volvió a su estado inicial" | | |
| 0.3 | Arriba a la derecha, el selector de rol | Gerente · Raúl Céspedes Guzmán | | |

---

## 1. Inicio y navegación

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 1.1 | Mirar los indicadores del Inicio | Seguimientos para hoy **6** (9 vencidos · 14 alarmas); En el embudo **Bs 1 M** (40 oportunidades abiertas); Ventas del mes con **4** oportunidades ganadas; Fuera hoy con **1** solicitud por aprobar; Planilla del mes "Por cerrar"; Facturado este mes con lo que falta cobrar y **1 vencida** | | |
| 1.2 | Mirar "Para hoy y vencido" | 6 seguimientos vencidos (en rojo) y 3 alarmas "Cliente activo sin contacto" | | |
| 1.3 | Mirar "Quién está fuera hoy" y "Pendientes del mes" | María Elena Pinto Terrazas de vacaciones (y Gonzalo Terrazas Aguilar con permiso sin goce si hoy es uno de los primeros días hábiles del mes). Pendientes: 1 solicitud por aprobar, cerrar la planilla, registrar la depreciación, cobrar 1 factura vencida, facturar 1 venta ganada | | |
| 1.4 | Recorrer todas las opciones del menú lateral | Cada una abre su pantalla y se marca como activa en el menú. Ninguna dice "en preparación" | | |
| 1.5 | Ocultar y mostrar el menú con el botón de la esquina superior izquierda | El menú se oculta y vuelve | | |
| 1.6 | Escribir en la barra una dirección inexistente, por ejemplo `/algo` | "No encontramos esta página" con botón al inicio | | |

---

## 2. Roles

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 2.1 | Selector de rol → **Administración** | Aviso de cambio de rol. Arriba: Claudia Jiménez Limachi. Menú: Inicio, Recursos humanos (5), Facturación, Contabilidad, Activos fijos. Sin CRM ni Configuración. Sin campana | | |
| 2.2 | Mirar el Inicio de Administración | Indicadores de Fuera hoy, Planilla y Facturado; "Quién está fuera hoy" y "Pendientes del mes" | | |
| 2.3 | Como Administración, escribir `/clientes` en la barra | "Esta sección no está disponible para su rol" con botón para cambiar de rol | | |
| 2.4 | Selector de rol → **Ventas** | Viviana Zurita Flores. Menú: Inicio, Mis vacaciones, Clientes, Embudo de ventas, Seguimientos. Campana con sus avisos | | |
| 2.5 | Como Ventas, abrir Clientes | Título "Mis clientes", solo los suyos, sin columna ni filtro de vendedor | | |
| 2.6 | Recargar la página (F5) | Sigue como Ventas | | |
| 2.7 | Volver a **Gerente** | Menú completo, con Configuración | | |

---

## 3. Personal y vacaciones

Empezar con **Reiniciar demo**.

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 3.1 | Abrir **Personal** | 10 personas con área, ingreso y antigüedad, sueldo básico, saldo de vacaciones, días libres y estado de hoy | | |
| 3.2 | Filtrar por área "Comercial" y buscar "Viviana" | Se reduce la lista; al limpiar vuelve. Los filtros quedan en la dirección | | |
| 3.3 | Abrir la ficha de **Claudia Jiménez Limachi** (6 años) | Le corresponden **20 días** por gestión; bono de antigüedad del 11% (**Bs 1.089**); sus vacaciones aprobadas | | |
| 3.4 | Abrir la ficha de **Raúl Céspedes Guzmán** (12 años) | **30 días** por gestión, sin aviso de un próximo tramo (ya está en el más alto) | | |
| 3.5 | Abrir la ficha de **Edwin Paredes Huanca** | "Todavía no le corresponden: cumple un año el …". Aviso de contrato a plazo fijo que vence | | |
| 3.6 | Volver con "← Personal" | La lista conserva los filtros que tenía | | |
| 3.7 | Abrir **Vacaciones** | 1 solicitud por aprobar, 1 de vacaciones hoy, 1 programada en 30 días | | |
| 3.8 | Pestaña **Saldos por persona** | Antigüedad, días por gestión (15, 20 o 30), derecho, tomados, saldo y "próximo cambio" (Rodrigo Camacho pasa a 20 días pronto) | | |
| 3.9 | Pestaña **Calendario** | Mes en curso con fines de semana y feriados en gris; vacaciones en verde; flechas para cambiar de mes | | |
| 3.10 | Pestaña Solicitudes → **Rechazar** la de Verónica Condori Ríos sin motivo | El botón Rechazar del diálogo está deshabilitado | | |
| 3.11 | Escribir un motivo y rechazar | Queda "Rechazada" con el motivo; aviso con Deshacer | | |
| 3.12 | Deshacer desde el aviso | Vuelve a "Pendiente" | | |
| 3.13 | **Aprobar** la solicitud | Queda "Aprobada"; el saldo de Verónica baja 4 días en Saldos | | |
| 3.14 | **Nueva solicitud** para Edwin Paredes Huanca | Mensaje "Todavía no le corresponden vacaciones" y botón deshabilitado | | |
| 3.15 | **Nueva solicitud** para Raúl Céspedes, de un viernes al lunes siguiente | Cuenta 2 días hábiles (sin sábado ni domingo) | | |

---

## 4. Mis vacaciones

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 4.1 | Cambiar a **Ventas** → Mis vacaciones | Días disponibles **25**, sus solicitudes | | |
| 4.2 | **Solicitar vacaciones** de 5 días hábiles desde la semana próxima | Aviso "Solicitud de 5 días enviada"; aparece "Pendiente" | | |
| 4.3 | Pedir otra que se superponga con la anterior | "Ya tiene una solicitud en esas fechas" | | |
| 4.4 | **Retirar** la pendiente y volver a pedirla | Desaparece y vuelve a aparecer | | |
| 4.5 | Abrir una segunda pestaña en `/vacaciones` y cambiar ahí el rol a **Gerente** | El rol se comparte entre pestañas: la primera también pasa a Gerente sin recargar. En la segunda, la solicitud de Viviana ya está; al aprobarla, en la primera (ir a Vacaciones) figura "Aprobada" sin recargar | | |

---

## 5. Días libres y permisos

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 5.1 | Abrir **Días libres y permisos** | Saldos por persona; Gonzalo Terrazas con "2 en [mes]: descuenta" | | |
| 5.2 | **Registrar día libre**: Franz Mercado, ganado, un día hábil | Mensaje "Se gana trabajando un feriado o un fin de semana" y botón deshabilitado | | |
| 5.3 | Ganado un sábado | Se registra; su saldo sube | | |
| 5.4 | **Registrar permiso** con goce de 4 días hábiles para Wendy Galarza (el cupo es de 3 al año) | Mensaje de que supera el cupo, con los días que le quedan, y botón deshabilitado | | |
| 5.5 | Permiso **sin goce** de 1 día este mes para Viviana Zurita | Aviso "Se descuenta en la planilla del mes" | | |

---

## 6. Planilla y boletas

Hacer después de la sección 5 (el permiso sin goce de Viviana debe estar).

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 6.1 | Abrir **Planilla del mes** | "Por cerrar"; salario mínimo Bs 3.300; Gonzalo Terrazas con "2 días sin goce" y Viviana con 1 | | |
| 6.2 | Mirar la fila de Raúl Céspedes | Bono 26% Bs 2.574; total ganado Bs 13.074; aportes 1.662,56 "con 0,85 solidario"; RC-IVA **196,49**; líquido **11.214,95** | | |
| 6.3 | Mirar "A cargo de la empresa" y "Asiento contable" | Porcentajes 10%, 1,71%, 3,5%, 2%, 8,33%, 8,33%; asiento "Se registra al cerrar" y cuadrado | | |
| 6.4 | Elegir el mes anterior en el selector | "Cerrada" con fecha y quién la cerró; Edwin Paredes con 1 día sin goce | | |
| 6.5 | Volver al mes en curso → **Descargar** | Archivo `planilla-AAAA-MM.csv` que abre en Excel con tildes correctas | | |
| 6.6 | **Cerrar planilla** | El diálogo avisa si el mes no terminó; al confirmar: "Cerrada", aviso con el N° de asiento | | |
| 6.7 | Registrar un permiso sin goce nuevo para cualquier persona y volver a la planilla | La planilla cerrada no cambia | | |
| 6.8 | Ícono de boleta de Gonzalo Terrazas | Boleta con "Días no pagados (2 sin goce)", líquido y "Son: … BOLIVIANOS" | | |
| 6.9 | **Descargar PDF** | PDF de una página con los mismos montos | | |
| 6.10 | **Imprimir** | La vista previa muestra solo la boleta, sin menú ni encabezado | | |
| 6.11 | Ficha de Gonzalo Terrazas → "Boletas de pago" | Una por mes; "Ver boleta" abre cada una | | |

---

## 7. CRM: clientes y ficha

Empezar con **Reiniciar demo**.

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 7.1 | Abrir **Clientes** | 100 clientes · 45 activos · 35 prospectos · 20 inactivos; ordenados por el seguimiento más urgente | | |
| 7.2 | Filtrar por estado, vendedor, rubro y ciudad; buscar por NIT | La lista se reduce; "Mostrando X de 100" | | |
| 7.3 | Ordenar por "Monto en el embudo" | Los de mayor monto primero | | |
| 7.4 | Abrir un cliente con "Sin contacto hace más de un mes" | Arriba, el aviso rojo de la alarma | | |
| 7.5 | **Registrar actividad**: reunión, descripción, con "Agendar el próximo seguimiento" | Aviso con la fecha del próximo; aparece en el historial y en seguimientos pendientes; la alarma desaparece | | |
| 7.6 | **Agendar seguimiento** sin motivo | Botón deshabilitado; con motivo, se agenda | | |
| 7.7 | Oportunidades → **Nueva** | Se crea en Prospecto y aparece en la lista | | |
| 7.8 | Clic en una oportunidad | Se abre el panel lateral con su detalle | | |

---

## 8. Embudo de ventas

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 8.1 | Abrir **Embudo de ventas** | 6 columnas; En el embudo Bs 1.001.500; Estancadas **9** en rojo | | |
| 8.2 | Arrastrar una tarjeta de Contactado a Propuesta enviada | La columna se resalta al pasar; aviso con Deshacer; los totales cambian | | |
| 8.3 | Deshacer | Vuelve a su columna | | |
| 8.4 | Arrastrar una tarjeta a **Perdida** | Pide el motivo; con "Otro motivo" exige escribirlo | | |
| 8.5 | Abrir una tarjeta de Negociación → **Ganada** | Aviso "Ya se puede emitir su factura desde aquí"; en el panel, "Ganada y todavía sin facturar" | | |
| 8.6 | Filtrar por vendedor y buscar por cliente | Solo quedan sus tarjetas | | |
| 8.7 | **Nueva oportunidad** sin cliente o con monto 0 | Botón deshabilitado | | |

---

## 9. Seguimientos, alarmas y campana

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 9.1 | Abrir **Seguimientos** | Vencidos, Para hoy, Próximos 7 días y "Más adelante" (oculto con botón); alarmas a la derecha | | |
| 9.2 | **Registrar** el primer vencido | El diálogo dice "Registrar lo que se hizo" con el motivo; al guardar, baja la cuenta de vencidos y de la campana | | |
| 9.3 | En una alarma "Propuesta sin respuesta" → **Registrar** | La alarma desaparece | | |
| 9.4 | Abrir la **campana** | Lista de avisos; clic en uno lleva a la ficha del cliente | | |

---

## 10. Control del ciclo de ventas

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 10.1 | Abrir **Ciclo de ventas** (como Gerente) | Indicadores, 4 gráficos, resultados por vendedor y estancadas | | |
| 10.2 | Pasar el mouse por las barras y columnas | Tooltip con el valor y el detalle | | |
| 10.3 | Navegar con Tab por las barras | El tooltip aparece también con el teclado | | |
| 10.4 | "Ver como tabla" en cada gráfico | Tabla con los mismos valores | | |
| 10.5 | Cambiar a "Últimos 12 meses" | Cambian los indicadores y el gráfico mensual tiene 12 columnas | | |

---

## 11. Facturación

Hacer después de la sección 8 (la venta ganada del paso 8.5).

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 11.1 | Abrir **Facturas** | Indicadores; tarjeta "Ventas ganadas sin facturar" con 2 ventas (la de la semilla y la del paso 8.5) | | |
| 11.2 | **Emitir factura** desde esa tarjeta | Diálogo con NIT, razón social y una línea con el monto; "Incluye IVA (13%)" | | |
| 11.3 | Agregar una segunda línea y emitir | Abre la factura: franja "FACTURA SIMULADA … SIN VALIDEZ FISCAL", N°, CUF, QR, leyendas, total en letras; abajo el asiento | | |
| 11.4 | Escanear el QR con el celular | Texto que dice "FACTURA SIMULADA - DEMO ORDIA - SIN VALIDEZ FISCAL" | | |
| 11.5 | **PDF** e **Imprimir** | PDF con la franja de simulación; impresión sin menú | | |
| 11.6 | **Registrar cobro** por la mitad | "Cobrada en parte"; se puede seguir cobrando; ya no aparece "Anular" | | |
| 11.7 | Cobro por más del saldo | Mensaje de que supera el saldo; botón deshabilitado | | |
| 11.8 | Emitir otra factura y **Anular** | "ANULADA" sobre la factura; un segundo asiento que revierte el primero | | |
| 11.9 | Abrir **Cobros** | Cuentas por cobrar por antigüedad, con la vencida en rojo; historial de cobros | | |
| 11.10 | Ficha del cliente de esa factura (como Gerente) | Tarjeta "Facturación" con la factura y su saldo | | |

---

## 12. Con y sin el módulo de facturación

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 12.1 | **Configuración → Módulos** | Interruptor "Activo" y la tabla de qué cambia | | |
| 12.2 | Apagar el interruptor | El menú ya no muestra Facturación; Inicio sin "Facturado este mes" | | |
| 12.3 | Escribir `/facturas` en la barra | "El módulo de facturación está desactivado" con botón a Módulos | | |
| 12.4 | Ganar una oportunidad en el embudo y abrirla | "Sin el módulo de facturación: … asiento manual en el libro diario" | | |
| 12.5 | Ficha de un cliente | Sin tarjeta de Facturación | | |
| 12.6 | Volver a activarlo | Todo reaparece; las facturas emitidas siguen ahí | | |

---

## 13. Contabilidad

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 13.1 | **Plan de cuentas** | 5 grupos con saldos; las de depreciación acumulada marcadas "Regularizadora" | | |
| 13.2 | **Libro diario**, mes en curso | Asientos con su origen; clic abre las cuentas y el enlace al documento | | |
| 13.3 | **Asiento manual** en blanco: una cuenta en el debe por 100 y otra en el haber por 90 | "Diferencia entre debe y haber: 10,00" y botón deshabilitado | | |
| 13.4 | Elegir un rubro (por ejemplo "1.1 Activo corriente") como cuenta | No aparece: solo hay cuentas de movimiento | | |
| 13.5 | Plantilla "Ingreso por una venta facturada en otro sistema", monto 11.300 | Se completan 5 líneas (cuenta por cobrar, ingreso, IVA, IT); "Cuadra"; al registrar, aviso con el N° | | |
| 13.6 | **Libro mayor** de Banco, mes en curso | Saldo al inicio del mes, movimientos con saldo acumulado y saldo final | | |
| 13.7 | **Reportes** → Balance de comprobación | "Las sumas y los saldos cuadran" | | |
| 13.8 | Estado de resultados del mes anterior | Ingresos, gastos de personal, administración e impuestos; utilidad del mes | | |

---

## 14. Activos fijos

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 14.1 | Abrir **Activos** | 25 activos; 1 en reparación y 1 dado de baja; valor de compra Bs 447.200 | | |
| 14.2 | Filtrar por "Vehículos" | La camioneta doble cabina | | |
| 14.3 | Ficha de **AF-002** | Valores, cuadro mes a mes (el mes en curso "por registrar") e historial | | |
| 14.4 | **Reasignar** a otra persona y ubicación | Cambia el responsable; queda en el historial | | |
| 14.5 | **Enviar a reparación** y luego "Volvió de reparación" | Cambia el estado; dos eventos nuevos en el historial | | |
| 14.6 | Ficha de **AF-003** | "Totalmente depreciado" y sigue en uso | | |
| 14.7 | **Depreciación del mes** → Registrar | "Registrada" con el N° de asiento; el cuadro de AF-002 ya no dice "por registrar" en el mes | | |

---

## 15. Persistencia, reinicio, impresión y celular

| # | Qué hacer | Qué debería verse | ✔ | Observaciones |
|---|---|---|---|---|
| 15.1 | Recargar la página después de cualquier cambio | El cambio sigue | | |
| 15.2 | **Reiniciar demo** | Todo vuelve al estado inicial (planilla "Por cerrar", sin las facturas nuevas) | | |
| 15.3 | Abrir la demo en el celular (o el modo celular de Chrome, 390 px) | Menú lateral como panel; las tablas no desbordan la página; el embudo se desplaza de costado | | |
| 15.4 | Si se puede, abrir la demo al día siguiente | Los datos se regeneran con las fechas de ese día: siempre hay seguimientos de hoy, alguien de vacaciones y la planilla por cerrar | | |
