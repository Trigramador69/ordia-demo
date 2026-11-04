import type { Metadata } from "next";
import { PlanDeCuentas } from "@/components/contabilidad/plan-de-cuentas";

export const metadata: Metadata = { title: "Plan de cuentas" };

export default function PaginaPlanDeCuentas() {
  return <PlanDeCuentas />;
}
