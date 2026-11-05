"use client";

import { ChevronsUpDown } from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { descripcionesRol, nombresRol } from "@/datos/catalogos";
import { personaPorRol } from "@/datos/equipo";
import type { EstadoDemo, Rol } from "@/datos/tipos";
import { actualizarEstado, useEstadoDemo } from "@/lib/demo/almacen";
import { iniciales, nombreCompleto } from "@/lib/formato";

const roles = Object.keys(nombresRol) as Rol[];

// Persona del equipo que usa la demo en cada rol. No hay inicio de sesión: el
// selector muestra lo que ve cada uno.
export function usuarioDelRol(estado: EstadoDemo, rol: Rol = estado.rol) {
  return estado.personas.find((persona) => persona.id === personaPorRol[rol]) ?? estado.personas[0];
}

export function cambiarRol(rol: Rol) {
  actualizarEstado((estado) => ({ ...estado, rol }));
  toast.info(`Ahora ve la demo como ${nombresRol[rol]}.`);
}

export function SelectorRol() {
  const estado = useEstadoDemo();
  const usuario = usuarioDelRol(estado);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-left outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring aria-expanded:bg-muted">
        <Avatar className="size-8">
          <AvatarFallback className="bg-marca-suave text-xs font-medium text-primary">{iniciales(usuario)}</AvatarFallback>
        </Avatar>
        <span className="hidden flex-col leading-tight sm:flex">
          <span className="text-sm font-medium">{nombreCompleto(usuario)}</span>
          <span className="text-xs text-muted-foreground">{nombresRol[estado.rol]}</span>
        </span>
        <ChevronsUpDown className="size-4 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel>Ver la demo como</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={estado.rol} onValueChange={(valor) => cambiarRol(valor as Rol)}>
            {roles.map((opcion) => {
              const persona = usuarioDelRol(estado, opcion);
              return (
                <DropdownMenuRadioItem key={opcion} value={opcion} closeOnClick>
                  <span className="flex flex-col">
                    <span>
                      {nombresRol[opcion]} · {nombreCompleto(persona)}
                    </span>
                    <span className="text-xs text-muted-foreground">{descripcionesRol[opcion]}</span>
                  </span>
                </DropdownMenuRadioItem>
              );
            })}
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
