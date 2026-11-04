import type { Metadata } from "next";
import { VistaSeguimientos } from "@/components/crm/vista-seguimientos";

export const metadata: Metadata = { title: "Seguimientos y alarmas" };

export default function PaginaSeguimientos() {
  return <VistaSeguimientos />;
}
