import { Badge } from "@/components/ui/badge";
import { nombresEstadoSolicitud } from "@/datos/catalogos";
import type { EstadoSolicitud } from "@/datos/tipos";
import type { TipoAusenciaDelDia } from "@/lib/demo/consultas";
import { formatearFecha } from "@/lib/formato";
import { cn } from "@/lib/utils";

export const nombresAusenciaDelDia: Record<TipoAusenciaDelDia, string> = {
  vacacion: "De vacaciones",
  permiso_con_goce: "Con permiso",
  permiso_sin_goce: "Permiso sin goce",
  dia_libre: "Día libre",
};

// Colores compartidos por las insignias y el calendario del equipo.
export const clasesAusencia: Record<TipoAusenciaDelDia, string> = {
  vacacion: "bg-exito-suave text-exito",
  permiso_con_goce: "bg-marca-suave text-primary",
  permiso_sin_goce: "bg-peligro-suave text-destructive",
  dia_libre: "bg-advertencia-suave text-advertencia",
};

export const clasesCeldaAusencia: Record<TipoAusenciaDelDia, string> = {
  vacacion: "bg-exito/70",
  permiso_con_goce: "bg-primary/60",
  permiso_sin_goce: "bg-destructive/60",
  dia_libre: "bg-advertencia/70",
};

export function InsigniaAusencia({ tipo, className }: { tipo: TipoAusenciaDelDia; className?: string }) {
  return <Badge className={cn(clasesAusencia[tipo], className)}>{nombresAusenciaDelDia[tipo]}</Badge>;
}

const clasesEstadoSolicitud: Record<EstadoSolicitud, string> = {
  pendiente: "bg-advertencia-suave text-advertencia",
  aprobada: "bg-exito-suave text-exito",
  rechazada: "bg-peligro-suave text-destructive",
};

export function InsigniaEstadoSolicitud({ estado }: { estado: EstadoSolicitud }) {
  return <Badge className={clasesEstadoSolicitud[estado]}>{nombresEstadoSolicitud[estado]}</Badge>;
}

export function formatearRango(desde: string, hasta: string) {
  return desde === hasta ? formatearFecha(desde) : `${formatearFecha(desde)} al ${formatearFecha(hasta)}`;
}
