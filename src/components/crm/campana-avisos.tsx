"use client";

import { useRouter } from "next/navigation";
import { Bell, BellRing, Siren } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { nombresAlarma } from "@/lib/crm";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { avisosPendientes, clientePorId } from "@/lib/demo/consultas";
import { fechaDeHoy, formatearFechaRelativa } from "@/lib/formato";
import { puedeVerRuta } from "@/lib/navegacion";

// Cuántos avisos se listan en el menú; el resto está en Seguimientos.
const avisosEnLaCampana = 6;

// Campana del encabezado: seguimientos vencidos y de hoy, más las alarmas
// automáticas del CRM. Solo para los roles que trabajan el CRM.
export function CampanaAvisos() {
  const estado = useEstadoDemo();
  const router = useRouter();
  const hoy = fechaDeHoy();
  if (!puedeVerRuta(estado.rol, "/seguimientos")) return null;

  const { seguimientos, alarmas, total } = avisosPendientes(estado, hoy);
  const avisos = [
    ...seguimientos.map((seguimiento) => ({
      clave: seguimiento.id,
      icono: BellRing,
      titulo: seguimiento.motivo,
      detalle: `${clientePorId(estado, seguimiento.idCliente)?.razonSocial ?? ""} · ${seguimiento.fecha === hoy ? "hoy" : `vencido ${formatearFechaRelativa(seguimiento.fecha, hoy)}`}`,
      urgente: seguimiento.fecha < hoy,
      ruta: `/clientes/${seguimiento.idCliente}`,
    })),
    ...alarmas.map((alarma) => ({
      clave: `${alarma.tipo}-${alarma.idOportunidad ?? alarma.idCliente}`,
      icono: Siren,
      titulo: nombresAlarma[alarma.tipo],
      detalle: `${clientePorId(estado, alarma.idCliente)?.razonSocial ?? ""} · hace ${alarma.dias} días`,
      urgente: true,
      ruta: `/clientes/${alarma.idCliente}`,
    })),
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="relative" aria-label={`Avisos: ${total} pendientes`} />}
      >
        <Bell />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 flex min-w-4.5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] leading-4.5 font-semibold text-white tabular-nums">
            {total > 99 ? "99+" : total}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {total === 0 ? "Sin avisos pendientes" : `${seguimientos.length} seguimientos para hoy o vencidos · ${alarmas.length} alarmas`}
          </DropdownMenuLabel>
          {avisos.slice(0, avisosEnLaCampana).map((aviso) => (
            <DropdownMenuItem key={aviso.clave} onClick={() => router.push(aviso.ruta)} className="items-start gap-2.5 py-2">
              <aviso.icono className={aviso.urgente ? "mt-0.5 text-destructive" : "mt-0.5 text-primary"} />
              <span className="flex min-w-0 flex-col">
                <span className="truncate text-sm">{aviso.titulo}</span>
                <span className="truncate text-xs text-muted-foreground">{aviso.detalle}</span>
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => router.push("/seguimientos")} className="justify-center font-medium">
          {avisos.length > avisosEnLaCampana ? `Ver los ${avisos.length} avisos` : "Ir a Seguimientos"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
