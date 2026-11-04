import Link from "next/link";
import { LogoOrdia } from "@/components/marca/logo-ordia";
import { Button } from "@/components/ui/button";

export default function PaginaNoEncontrada() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center gap-6 px-4 text-center">
      <LogoOrdia />
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-2xl font-semibold tracking-tight">No encontramos esta página</h1>
        <p className="text-sm text-muted-foreground">Puede que la dirección esté mal escrita o que la página ya no exista.</p>
      </div>
      <Button nativeButton={false} render={<Link href="/" />}>
        Ir al inicio
      </Button>
    </main>
  );
}
