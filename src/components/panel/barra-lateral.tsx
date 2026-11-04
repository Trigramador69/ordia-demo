"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoOrdia } from "@/components/marca/logo-ordia";
import { BotonReiniciarDemo } from "@/components/panel/boton-reiniciar-demo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { empresa } from "@/datos/catalogos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { gruposNavegacion, seccionDeRuta, seccionVisible } from "@/lib/navegacion";

export function BarraLateral() {
  const ruta = usePathname();
  const { rol, modulos } = useEstadoDemo();
  const seccionActiva = seccionDeRuta(ruta);

  return (
    <Sidebar>
      <SidebarHeader className="px-3 py-4">
        <Link href="/" className="rounded-md outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring">
          <LogoOrdia subtitulo={empresa.nombre} />
        </Link>
      </SidebarHeader>

      <SidebarContent>
        {gruposNavegacion.map((grupo) => {
          const secciones = grupo.secciones.filter((seccion) => seccionVisible(seccion, rol, modulos));
          if (secciones.length === 0) return null;
          return (
            <SidebarGroup key={grupo.titulo}>
              <SidebarGroupLabel>{grupo.titulo}</SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {secciones.map((seccion) => (
                    <SidebarMenuItem key={seccion.ruta}>
                      <SidebarMenuButton isActive={seccion === seccionActiva} tooltip={seccion.titulo} render={<Link href={seccion.ruta} />}>
                        <seccion.icono />
                        <span>{seccion.titulo}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="p-3">
        <div className="rounded-lg border bg-background p-3 text-xs text-muted-foreground">
          <p className="font-medium text-foreground">Modo demostración</p>
          <p className="mt-1">Los datos son de ejemplo y los cambios se guardan en este navegador.</p>
          <BotonReiniciarDemo className="mt-3 w-full" />
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
