import {
  BookOpen,
  BookText,
  Calculator,
  CalendarDays,
  CalendarHeart,
  ChartNoAxesCombined,
  Coins,
  FileText,
  Kanban,
  LayoutDashboard,
  ListTree,
  Monitor,
  Settings,
  TrendingDown,
  UserRoundCheck,
  Users,
  Wallet,
  BellRing,
  Building2,
  type LucideIcon,
} from "lucide-react";
import type { ModuloOpcional, Rol } from "@/datos/tipos";

export interface SeccionNavegacion {
  titulo: string;
  ruta: string;
  icono: LucideIcon;
  roles: Rol[];
  // Solo aparece si el módulo opcional está activo (Configuración > Módulos).
  modulo?: ModuloOpcional;
}

export interface GrupoNavegacion {
  titulo: string;
  secciones: SeccionNavegacion[];
}

const todos: Rol[] = ["gerente", "administracion", "ventas"];
const gerenciaYAdministracion: Rol[] = ["gerente", "administracion"];
const gerenciaYVentas: Rol[] = ["gerente", "ventas"];

// Los cinco módulos de Ordia. Gerente ve todo; Administración, recursos
// humanos, facturación, contabilidad y activos; Ventas, el CRM con sus clientes.
export const gruposNavegacion: GrupoNavegacion[] = [
  {
    titulo: "General",
    secciones: [{ titulo: "Inicio", ruta: "/", icono: LayoutDashboard, roles: todos }],
  },
  {
    titulo: "Recursos humanos",
    secciones: [
      { titulo: "Personal", ruta: "/personal", icono: Users, roles: gerenciaYAdministracion },
      { titulo: "Vacaciones", ruta: "/vacaciones", icono: CalendarDays, roles: gerenciaYAdministracion },
      { titulo: "Días libres y permisos", ruta: "/dias-libres", icono: UserRoundCheck, roles: gerenciaYAdministracion },
      { titulo: "Planilla del mes", ruta: "/planilla", icono: Wallet, roles: gerenciaYAdministracion },
      { titulo: "Mis vacaciones", ruta: "/mis-vacaciones", icono: CalendarHeart, roles: todos },
    ],
  },
  {
    titulo: "CRM y ventas",
    secciones: [
      { titulo: "Clientes", ruta: "/clientes", icono: Building2, roles: gerenciaYVentas },
      { titulo: "Embudo de ventas", ruta: "/embudo", icono: Kanban, roles: gerenciaYVentas },
      { titulo: "Seguimientos", ruta: "/seguimientos", icono: BellRing, roles: gerenciaYVentas },
      { titulo: "Ciclo de ventas", ruta: "/ciclo-ventas", icono: ChartNoAxesCombined, roles: ["gerente"] },
    ],
  },
  {
    titulo: "Facturación",
    secciones: [
      { titulo: "Facturas", ruta: "/facturas", icono: FileText, roles: gerenciaYAdministracion, modulo: "facturacion" },
      { titulo: "Cobros", ruta: "/cobros", icono: Coins, roles: gerenciaYAdministracion, modulo: "facturacion" },
    ],
  },
  {
    titulo: "Contabilidad",
    secciones: [
      { titulo: "Plan de cuentas", ruta: "/plan-cuentas", icono: ListTree, roles: gerenciaYAdministracion },
      { titulo: "Libro diario", ruta: "/libro-diario", icono: BookOpen, roles: gerenciaYAdministracion },
      { titulo: "Libro mayor", ruta: "/libro-mayor", icono: BookText, roles: gerenciaYAdministracion },
      { titulo: "Reportes", ruta: "/reportes", icono: Calculator, roles: gerenciaYAdministracion },
    ],
  },
  {
    titulo: "Activos fijos",
    secciones: [
      { titulo: "Activos", ruta: "/activos", icono: Monitor, roles: gerenciaYAdministracion },
      { titulo: "Depreciación del mes", ruta: "/depreciacion", icono: TrendingDown, roles: gerenciaYAdministracion },
    ],
  },
  {
    titulo: "Configuración",
    secciones: [{ titulo: "Módulos", ruta: "/configuracion", icono: Settings, roles: ["gerente"] }],
  },
];

const todasLasSecciones = gruposNavegacion.flatMap((grupo) => grupo.secciones);

// Sección a la que pertenece una ruta, incluidas sus subrutas (/personal/per-01).
export function seccionDeRuta(ruta: string) {
  if (ruta === "/") return todasLasSecciones[0];
  return todasLasSecciones.find((seccion) => seccion.ruta !== "/" && (ruta === seccion.ruta || ruta.startsWith(`${seccion.ruta}/`)));
}

export function puedeVerRuta(rol: Rol, ruta: string) {
  const seccion = seccionDeRuta(ruta);
  return !seccion || seccion.roles.includes(rol);
}

export function seccionVisible(seccion: SeccionNavegacion, rol: Rol, modulos: Record<ModuloOpcional, boolean>) {
  return seccion.roles.includes(rol) && (!seccion.modulo || modulos[seccion.modulo]);
}
