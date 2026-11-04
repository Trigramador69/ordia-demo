import type { Metadata } from "next";
import { VistaVacaciones } from "@/components/rrhh/vista-vacaciones";

export const metadata: Metadata = { title: "Vacaciones" };

export default function PaginaVacaciones() {
  return <VistaVacaciones />;
}
