"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PackageX, ShieldAlert } from "lucide-react";
import { BarraLateral } from "@/components/panel/barra-lateral";
import { SelectorRol, cambiarRol } from "@/components/panel/selector-rol";
import { Button } from "@/components/ui/button";
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { nombresModulo, nombresRol } from "@/datos/catalogos";
import type { ModuloOpcional, Rol } from "@/datos/tipos";
import { useEstadoDemo } from "@/lib/demo/almacen";
import { puedeVerRuta, seccionDeRuta } from "@/lib/navegacion";

export function MarcoPanel({ children }: { children: React.ReactNode }) {
  const ruta = usePathname();
  const { rol, modulos } = useEstadoDemo();
  const seccion = seccionDeRuta(ruta);
  const moduloApagado = seccion?.modulo && !modulos[seccion.modulo] ? seccion.modulo : null;

  let contenido = children;
  if (moduloApagado) contenido = <ModuloDesactivado modulo={moduloApagado} puedeActivar={rol === "gerente"} />;
  else if (!puedeVerRuta(rol, ruta)) contenido = <AccesoRestringido rolNecesario={seccion?.roles[0]} />;

  return (
    <SidebarProvider>
      <BarraLateral />
      {/* min-w-0: sin esto, una tabla ancha estira el área de contenido y la página
          se desplaza hacia los costados, por debajo del menú lateral. */}
      <SidebarInset className="min-w-0">
        <header className="sticky top-0 z-10 flex print:hidden h-14 shrink-0 items-center gap-2 border-b bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/80">
          <SidebarTrigger className="-ml-1" />
          <span aria-hidden="true" className="mr-1 h-4 w-px bg-border" />
          <span className="truncate text-sm font-medium">{seccion?.titulo ?? "Ordia"}</span>
          <div className="ml-auto">
            <SelectorRol />
          </div>
        </header>
        <div className="flex min-w-0 flex-1 flex-col gap-6 p-4 md:p-6 lg:p-8 print:p-0">{contenido}</div>
      </SidebarInset>
    </SidebarProvider>
  );
}

function AccesoRestringido({ rolNecesario }: { rolNecesario?: Rol }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <ShieldAlert className="size-6 text-muted-foreground" />
      </span>
      <h1 className="font-heading text-lg font-semibold">Esta sección no está disponible para su rol</h1>
      <p className="text-sm text-muted-foreground">
        {rolNecesario
          ? `La ve el rol ${nombresRol[rolNecesario]}. Puede cambiar de rol para recorrerla.`
          : "Cambie de rol para recorrerla."}
      </p>
      {rolNecesario && (
        <Button variant="outline" onClick={() => cambiarRol(rolNecesario)}>
          Ver como {nombresRol[rolNecesario]}
        </Button>
      )}
    </div>
  );
}

function ModuloDesactivado({ modulo, puedeActivar }: { modulo: ModuloOpcional; puedeActivar: boolean }) {
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-3 py-16 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-muted">
        <PackageX className="size-6 text-muted-foreground" />
      </span>
      <h1 className="font-heading text-lg font-semibold">El módulo de {nombresModulo[modulo].toLowerCase()} está desactivado</h1>
      <p className="text-sm text-muted-foreground">
        {puedeActivar ? "Puede activarlo desde Configuración > Módulos." : "Lo activa el gerente desde Configuración > Módulos."}
      </p>
      {puedeActivar && (
        <Button variant="outline" nativeButton={false} render={<Link href="/configuracion" />}>
          Ir a Módulos
        </Button>
      )}
    </div>
  );
}
