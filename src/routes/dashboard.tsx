import { useQuery } from "@tanstack/react-query"
import { useNavigate } from "@tanstack/react-router"
import { Gamepad2, Clock, Wifi, WifiOff, Crown, Zap, ChevronRight, Sparkles, Users } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { GameCatalog } from "@/components/dashboard/game-catalog"
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { cn } from "@/lib/utils"

const POLL_INTERVAL = 5_000

export function DashboardPage() {
  const user = getUser()
  const navigate = useNavigate()

  const { data: status } = useQuery({
    queryKey: ["session-status"],
    queryFn: api.session.status,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === "queued" || s === "pending" ? POLL_INTERVAL : false
    },
    retry: false,
  })

  const sessionGameId = status && status.status !== "idle" ? status.gameId : null

  const { data: sessionGameData } = useQuery({
    queryKey: ["game", sessionGameId],
    queryFn: () => api.games.get(sessionGameId!),
    enabled: !!sessionGameId,
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
            <DailyLimitCard status={status} isPro={isPro} isBasic={isBasic} />
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-5xl px-6 py-10 space-y-10">
        {/* Active session banner */}
        {sessionActive && (
          <button
            className="w-full text-left flex items-center gap-4 rounded-2xl border border-green-500/20 bg-green-500/6 px-5 py-4 hover:bg-green-500/10 transition-colors cursor-pointer"
            onClick={() => sessionGameId && navigate({ to: "/game/$gameId", params: { gameId: sessionGameId } })}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-green-500/15 border border-green-500/20">
              <span className="size-2.5 rounded-full bg-green-400 animate-pulse shadow-[0_0_10px_var(--color-green-400)]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-green-400 text-sm">Sesión activa en curso</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sessionGameData?.game.title
                  ? <>Jugando <span className="text-foreground font-medium">{sessionGameData.game.title}</span> — haz clic para retomar tu stream.</>
                  : "Haz clic para retomar tu stream."}
              </p>
            </div>
            <ChevronRight className="size-4 text-green-400/50 shrink-0" />
          </button>
        )}

        {/* Queue banner */}
        {status?.status === "queued" && (
          <button
            className="w-full text-left flex items-center gap-4 rounded-2xl border border-yellow-500/20 bg-yellow-500/6 px-5 py-4 hover:bg-yellow-500/10 transition-colors cursor-pointer"
            onClick={() => sessionGameId && navigate({ to: "/game/$gameId", params: { gameId: sessionGameId } })}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-yellow-500/15 border border-yellow-500/20">
              <Users className="size-4 text-yellow-400" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-yellow-400 text-sm">
                En cola — posición #{(status as { position: number }).position}
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sessionGameData?.game.title
                  ? <>Esperando GPU para <span className="text-foreground font-medium">{sessionGameData.game.title}</span>. Los usuarios PRO tienen prioridad.</>
                  : "Esperando GPU disponible. Los usuarios PRO tienen prioridad."}
              </p>
            </div>
            <ChevronRight className="size-4 text-yellow-400/50 shrink-0" />
          </button>
        )}

        {/* Pending banner */}
        {status?.status === "pending" && (
          <button
            className="w-full text-left flex items-center gap-4 rounded-2xl border border-primary/20 bg-primary/6 px-5 py-4 hover:bg-primary/10 transition-colors cursor-pointer"
            onClick={() => sessionGameId && navigate({ to: "/game/$gameId", params: { gameId: sessionGameId } })}
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 border border-primary/20">
              <span className="size-2.5 rounded-full bg-primary animate-pulse" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-primary text-sm">Aprovisionando GPU…</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {sessionGameData?.game.title
                  ? <>Preparando instancia para <span className="text-foreground font-medium">{sessionGameData.game.title}</span>. Esto toma unos segundos.</>
                  : "Tu instancia está siendo preparada. Esto toma unos segundos."}
              </p>
            </div>
            <ChevronRight className="size-4 text-primary/50 shrink-0" />
          </button>
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

function DailyLimitCard({
  status,
  isPro,
  isBasic,
}: {
  status: { dailyUsedSeconds?: number; dailyLimitSeconds?: number | null } | undefined
  isPro: boolean
  isBasic: boolean
}) {
  if (isPro) {
    return (
      <StatCard
        label="Límite diario"
        value="∞"
        sub="Sin restricciones"
        accent="yellow"
        icon={<Clock className="size-4" />}
      />
    )
  }

  const limitSeconds = status?.dailyLimitSeconds ?? (isBasic ? 36000 : 3600)
  const usedSeconds = status?.dailyUsedSeconds ?? 0
  const remainingSeconds = Math.max(0, limitSeconds - usedSeconds)
  const remainingHours = Math.floor(remainingSeconds / 3600)
  const remainingMins = Math.floor((remainingSeconds % 3600) / 60)

  const value =
    remainingSeconds === 0
      ? "0 min"
      : remainingHours > 0
        ? `${remainingHours}h ${remainingMins}m`
        : `${remainingMins} min`

  const pct = Math.min(100, (usedSeconds / limitSeconds) * 100)
  const accent: Accent = pct >= 100 ? "neutral" : isBasic ? "cyan" : "cyan"

  return (
    <StatCard
      label="Límite diario"
      value={value}
      sub={pct >= 100 ? "Límite alcanzado" : `${Math.round(pct)}% usado · ${isBasic ? "10h" : "1h"} total`}
      accent={accent}
      icon={<Clock className="size-4" />}
    />
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
