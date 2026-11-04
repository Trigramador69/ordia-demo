"use client";

import { use } from "react";
import { browser } from "react-dom";

// Los datos de la demo viven en el navegador (localStorage), así que todo lo que
// depende de ellos se renderiza solo ahí. Durante el prerenderizado se muestra
// el fallback del <Suspense> que envuelve a este componente.
export function PuertaNavegador({ children }: { children: React.ReactNode }) {
  use(browser("Los datos de la demo se guardan en el navegador."));
  return children;
}
