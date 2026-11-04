import type { Metadata } from "next";
import { VistaCicloVentas } from "@/components/crm/vista-ciclo-ventas";

export const metadata: Metadata = { title: "Control del ciclo de ventas" };

export default function PaginaCicloVentas() {
  return <VistaCicloVentas />;
}
