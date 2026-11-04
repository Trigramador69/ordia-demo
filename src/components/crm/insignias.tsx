import { Mail, MessageSquare, Phone, Users, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { nombresEstadoCliente, nombresEtapa } from "@/datos/catalogos";
import type { EstadoCliente, EtapaOportunidad, TipoActividad } from "@/datos/tipos";
import { formatearFecha, formatearFechaRelativa } from "@/lib/formato";
import { cn } from "@/lib/utils";

const clasesEstadoCliente: Record<EstadoCliente, string> = {
  prospecto: "bg-marca-suave text-primary",
  activo: "bg-exito-suave text-exito",
  inactivo: "bg-muted text-muted-foreground",
};

export function InsigniaEstadoCliente({ estado }: { estado: EstadoCliente }) {
  return <Badge className={clasesEstadoCliente[estado]}>{nombresEstadoCliente[estado]}</Badge>;
}

export const clasesEtapa: Record<EtapaOportunidad, string> = {
  prospecto: "bg-muted text-muted-foreground",
  contactado: "bg-marca-suave text-primary",
  propuesta: "bg-advertencia-suave text-advertencia",
  negociacion: "bg-primary/15 text-primary",
  ganada: "bg-exito-suave text-exito",
  perdida: "bg-peligro-suave text-destructive",
};

export function InsigniaEtapa({ etapa, className }: { etapa: EtapaOportunidad; className?: string }) {
  return <Badge className={cn(clasesEtapa[etapa], className)}>{nombresEtapa[etapa]}</Badge>;
}

export const iconoActividad: Record<TipoActividad, LucideIcon> = {
  llamada: Phone,
  reunion: Users,
  correo: Mail,
  nota: MessageSquare,
};

// Fecha de un seguimiento con su urgencia: vencido en rojo, hoy resaltado.
export function FechaSeguimiento({ fecha, hoy, className }: { fecha: string; hoy: string; className?: string }) {
  const clases =
    fecha < hoy ? "bg-peligro-suave text-destructive" : fecha === hoy ? "bg-marca-suave text-primary" : "bg-muted text-muted-foreground";
  return (
    <Badge className={cn(clases, className)} title={formatearFecha(fecha)}>
      {fecha < hoy ? `Vencido ${formatearFechaRelativa(fecha, hoy)}` : fecha === hoy ? "Hoy" : formatearFecha(fecha)}
    </Badge>
  );
}
