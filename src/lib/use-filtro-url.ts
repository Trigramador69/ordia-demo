"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

// Guarda el valor de un filtro en la dirección de la página (?estado=nuevo), así
// se conserva al abrir una ficha y volver, y el enlace se puede compartir. El
// valor por defecto no se escribe, para que la dirección quede limpia.
export function useFiltroUrl<Valor extends string>(
  clave: string,
  porDefecto: Valor,
  valoresValidos?: readonly Valor[],
): [Valor, (valor: Valor) => void] {
  const parametros = useSearchParams();
  const leido = parametros.get(clave) as Valor | null;
  const valor = leido !== null && (!valoresValidos || valoresValidos.includes(leido)) ? leido : porDefecto;

  function cambiar(nuevo: Valor) {
    // Se parte de la dirección actual y no de `parametros`, para no pisar otro
    // filtro que haya cambiado en el mismo instante.
    const siguientes = new URLSearchParams(window.location.search);
    if (nuevo === porDefecto) siguientes.delete(clave);
    else siguientes.set(clave, nuevo);
    const consulta = siguientes.toString();
    window.history.replaceState(null, "", consulta ? `?${consulta}` : window.location.pathname);
  }

  return [valor, cambiar];
}

// Para campos de texto: el valor vive en el componente y se copia a la
// dirección. Si el campo leyera directo de la dirección, perdería letras al
// escribir rápido, porque la dirección se actualiza un instante después.
export function useFiltroUrlTexto(clave: string): [string, (valor: string) => void] {
  const [valorEnUrl, cambiarEnUrl] = useFiltroUrl<string>(clave, "");
  const [valor, setValor] = useState(valorEnUrl);
  return [
    valor,
    (nuevo) => {
      setValor(nuevo);
      cambiarEnUrl(nuevo.trim() === "" ? "" : nuevo);
    },
  ];
}

export function useFiltroUrlBooleano(clave: string): [boolean, (valor: boolean) => void] {
  const [valor, cambiar] = useFiltroUrl<"si" | "no">(clave, "no", ["si", "no"]);
  return [valor === "si", (nuevo) => cambiar(nuevo ? "si" : "no")];
}
