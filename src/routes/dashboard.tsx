import { useQuery } from "@tanstack/react-query"
import { Gamepad2, Clock, Wifi, WifiOff, Crown, Zap, ChevronRight, Sparkles } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GameCatalog } from "@/components/dashboard/game-catalog"
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

export function DashboardPage() {
  const user = getUser()

  const { data: status } = useQuery({
    queryKey: ["session-status"],
    queryFn: api.session.status,
    retry: false,
  })

  const sessionActive = status?.status === "active"

  const planLabel =
    user?.plan === "PRO" ? "Pro" : user?.plan === "BASIC" ? "Basic" : "Free"

  const isPro = user?.plan === "PRO"
  const isBasic = user?.plan === "BASIC"

  return (
    <div className="min-h-screen">
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-white/5">
        {/* Ambient glows */}
        <div className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 right-1/4 size-64 rounded-full bg-accent/8 blur-3xl" />

        <div className="mx-auto max-w-5xl px-6 py-12">
          <div className="flex items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">
                Arcade Cloud Gaming
              </p>
              <h1 className="text-4xl font-bold tracking-tight">
                Bienvenido,{" "}
                <span
                  className="bg-linear-to-r from-primary to-accent bg-clip-text text-transparent"
                  style={{ WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
                >
                  {user?.email?.split("@")[0] ?? "jugador"}
                </span>
              </h1>
              <p className="text-muted-foreground">
                Elige un juego y empieza a jugar al instante — sin descargas, sin esperas.
              </p>
            </div>

            {/* Plan badge */}
            <div
              className={cn(
                "hidden sm:flex shrink-0 items-center gap-2 rounded-xl border px-4 py-3",
                isPro
                  ? "border-yellow-500/30 bg-yellow-500/[0.07]"
                  : isBasic
                    ? "border-primary/30 bg-primary/[0.07]"
                    : "border-white/10 bg-white/4",
              )}
            >
              {isPro ? (
                <Crown className="size-5 text-yellow-400" />
              ) : isBasic ? (
                <Zap className="size-5 text-primary" />
              ) : (
                <Sparkles className="size-5 text-muted-foreground" />
              )}
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-0.5">Plan activo</p>
                <p className={cn(
                  "font-bold text-sm",
                  isPro ? "text-yellow-400" : isBasic ? "text-primary" : "",
                )}>
                  {planLabel}
                </p>
              </div>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-8 grid grid-cols-3 gap-3 sm:gap-4">
            <StatCard
              label="Plan"
              value={planLabel}
              sub={isPro ? "Acceso completo" : isBasic ? "1080p stream" : "720p stream"}
              accent={isPro ? "yellow" : isBasic ? "cyan" : "neutral"}
              icon={isPro ? <Crown className="size-4" /> : isBasic ? <Zap className="size-4" /> : <Sparkles className="size-4" />}
            />
            <StatCard
              label="Sesión"
              value={sessionActive ? "Activa" : (status?.status ?? "Inactiva")}
              sub={sessionActive ? "Stream en vivo" : "Sin sesión abierta"}
              accent={sessionActive ? "green" : "neutral"}
              icon={sessionActive
                ? <Wifi className="size-4" />
                : <WifiOff className="size-4" />}
            />
            <StatCard
              label="Límite diario"
              value={isPro ? "∞" : isBasic ? "10 h" : "1 h"}
              sub={isPro ? "Sin restricciones" : isBasic ? "por día" : "por día"}
              accent={isPro ? "yellow" : "cyan"}
              icon={<Clock className="size-4" />}
            />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Active session banner */}
        {sessionActive && (
          <div className="flex items-center gap-4 rounded-2xl border border-green-500/20 bg-green-500/6 px-5 py-4">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 border border-green-500/20">
              <span className="size-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_var(--color-green-400)]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-400 text-sm">Sesión activa en curso</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Selecciona el mismo juego para retomar tu stream.
              </p>
            </div>
            <ChevronRight className="size-4 text-green-400/50 shrink-0" />
          </div>
        )}

        {/* Catalog section */}
        <section className="space-y-5">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
              <Gamepad2 className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight">Catálogo de juegos</h2>
              <p className="text-xs text-muted-foreground">Haz clic en cualquier título para jugar</p>
            </div>
            <Badge
              className="ml-auto border-primary/20 bg-primary/10 text-primary text-xs px-2.5"
            >
              {isPro ? "4K Ultra" : isBasic ? "1080p HD" : "720p"}
            </Badge>
          </div>

          <GameCatalog />
        </section>
      </div>
    </div>
  )
}

type Accent = "cyan" | "yellow" | "green" | "neutral"

function StatCard({
  label,
  value,
  sub,
  accent,
  icon,
}: {
  label: string
  value: string
  sub: string
  accent: Accent
  icon: React.ReactNode
}) {
  const colors: Record<Accent, string> = {
    cyan: "text-primary border-primary/20 bg-primary/10",
    yellow: "text-yellow-400 border-yellow-500/20 bg-yellow-500/10",
    green: "text-green-400 border-green-500/20 bg-green-500/10",
    neutral: "text-muted-foreground border-white/10 bg-white/5",
  }

  const valueColors: Record<Accent, string> = {
    cyan: "text-primary",
    yellow: "text-yellow-400",
    green: "text-green-400",
    neutral: "text-foreground",
  }

  return (
    <div className="gaming-card rounded-xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">
          {label}
        </span>
        <div className={cn("flex size-7 items-center justify-center rounded-lg border", colors[accent])}>
          {icon}
        </div>
      </div>
      <div>
        <p className={cn("text-2xl font-bold tracking-tight", valueColors[accent])}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </div>
  )
}
