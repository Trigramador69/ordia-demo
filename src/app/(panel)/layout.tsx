import { Suspense } from "react";
import { PuertaNavegador } from "@/components/demo/puerta-navegador";
import { EsqueletoPanel } from "@/components/panel/esqueleto-panel";
import { MarcoPanel } from "@/components/panel/marco-panel";

export default function LayoutPanel({ children }: LayoutProps<"/">) {
  return (
    <Suspense fallback={<EsqueletoPanel />}>
      <PuertaNavegador>
        <MarcoPanel>{children}</MarcoPanel>
      </PuertaNavegador>
    </Suspense>
  );
}
