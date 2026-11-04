import type { Metadata } from "next";
import { VistaModulos } from "@/components/configuracion/vista-modulos";

export const metadata: Metadata = { title: "Módulos" };

export default function PaginaConfiguracion() {
  return <VistaModulos />;
}
