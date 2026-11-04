import type { Metadata } from "next";
import { MisVacaciones } from "@/components/rrhh/mis-vacaciones";

export const metadata: Metadata = { title: "Mis vacaciones" };

export default function PaginaMisVacaciones() {
  return <MisVacaciones />;
}
