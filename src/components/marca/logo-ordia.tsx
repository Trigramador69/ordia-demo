import { cn } from "@/lib/utils";

// Marca de Ordia: un anillo formado por tramos que encajan, por los módulos de
// la gestión administrativa que trabajan conectados.
export function IsotipoOrdia({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" className="size-[64%]" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round">
        <path d="M12 4a8 8 0 0 1 7.6 5.5" />
        <path d="M19.6 14.5A8 8 0 0 1 9.5 19.6" opacity="0.8" />
        <path d="M5.4 16.6A8 8 0 0 1 8.2 5" opacity="0.6" />
      </svg>
    </span>
  );
}

export function LogoOrdia({ subtitulo = "Gestión administrativa" }: { subtitulo?: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <IsotipoOrdia />
      <span className="flex flex-col leading-tight">
        <span className="font-heading text-base font-semibold tracking-tight">Ordia</span>
        <span className="text-xs text-muted-foreground">{subtitulo}</span>
      </span>
    </span>
  );
}
