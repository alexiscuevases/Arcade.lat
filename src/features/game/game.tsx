import { useNavigate } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { ArrowLeft, Play, Users, Gamepad2, MonitorPlay, Cpu, Globe, AlertTriangle } from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Card, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { WebRTCPlayer } from "./components/webrtc-player"
import { QueueStatus } from "./components/queue-status"
import { api } from "@/shared/lib/api"
import { clearAuth } from "@/shared/lib/auth"
import { cn } from "@/shared/lib/utils"

const POLL_INTERVAL = 5_000

interface GamePageProps {
  gameId: string
}

export function GamePage({ gameId }: GamePageProps) {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: gameData, isLoading: gameLoading } = useQuery({
    queryKey: ["game", gameId],
    queryFn: () => api.games.get(gameId),
  })
  const game = gameData?.game

  const { data: status, isLoading } = useQuery({
    queryKey: ["session-status"],
    queryFn: api.session.status,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === "queued" || s === "pending" ? POLL_INTERVAL : false
    },
    retry: false,
    meta: {
      onError: (err: unknown) => {
        if (err instanceof Error && err.message === "Unauthorized") {
          clearAuth()
          navigate({ to: "/login" })
        }
      },
    },
  })

  const startMutation = useMutation({
    mutationFn: () => api.session.start(gameId),
    onSuccess: (data) => {
      if (data.status === "active") toast.success("¡GPU asignada! Iniciando stream…")
      if (data.status === "queued")
        toast.info(`En cola en posición #${"position" in data ? data.position : "?"}`)
      qc.invalidateQueries({ queryKey: ["session-status"] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error al iniciar sesión")
    },
  })

  const endMutation = useMutation({
    mutationFn: api.session.end,
    onSuccess: () => {
      toast.success("Sesión terminada.")
      qc.invalidateQueries({ queryKey: ["session-status"] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Error al terminar sesión")
    },
  })

  if (gameLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="space-y-3 text-center">
          <div className="mx-auto size-10 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Cargando juego…</p>
        </div>
      </div>
    )
  }

  if (!game) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-20 text-center space-y-4">
        <p className="text-muted-foreground">Juego no encontrado.</p>
        <Button variant="ghost" onClick={() => navigate({ to: "/dashboard" })}>
          <ArrowLeft className="mr-2 size-4" />
          Volver al catálogo
        </Button>
      </div>
    )
  }

  const sessionGameId = status && status.status !== "idle" ? status.gameId : null
  const sessionForThisGame = sessionGameId === gameId
  const sessionForOtherGame = sessionGameId !== null && !sessionForThisGame
  const sessionActive = status?.status === "active" && sessionForThisGame
  const isIdle = !status || status.status === "idle"

  return (
    <div className="min-h-screen">
      {/* Full-width hero */}
      <div className={cn("relative overflow-hidden h-72 sm:h-96", "bg-linear-to-br", game.gradient)}>
        {/* Overlay layers */}
        <div className="absolute inset-0 bg-linear-to-t from-background via-background/60 to-transparent" />
        <div className="absolute inset-0 bg-linear-to-r from-background/80 via-transparent to-transparent" />

        {/* Noise texture overlay */}
        <div
          className="absolute inset-0 opacity-20"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")" }}
        />

        {/* Back button */}
        <div className="absolute top-6 left-6">
          <Button
            variant="ghost"
            size="sm"
            className="text-white/70 hover:text-white hover:bg-white/10 border border-white/10 backdrop-blur-sm"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeft className="mr-2 size-4" />
            Catálogo
          </Button>
        </div>

        {/* Game info over hero */}
        <div className="absolute bottom-0 left-0 right-0 px-6 sm:px-10 pb-8">
          <div className="mx-auto max-w-5xl">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge className="bg-white/15 text-white border-white/20 backdrop-blur-sm">
                {game.genre}
              </Badge>
              <span className="text-white/60 text-sm flex items-center gap-1.5">
                <Users className="size-3.5" />
                {game.players} jugadores activos
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight leading-none">
              {game.title}
            </h1>
            <p className="text-white/50 mt-2 text-sm">{game.developer}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-5xl px-6 sm:px-10 py-8 space-y-8">
        {/* Session states */}
        {!isLoading && sessionForOtherGame ? (
          <Card className="gaming-card border-yellow-500/30 bg-yellow-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-yellow-400">
                <AlertTriangle className="size-4" />
                Ya tienes una sesión activa en otro juego
              </CardTitle>
              <CardDescription>
                Termina tu sesión actual para poder jugar este título.
              </CardDescription>
              <div className="pt-2">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => endMutation.mutate()}
                  disabled={endMutation.isPending}
                >
                  {endMutation.isPending ? "Terminando…" : "Terminar sesión actual"}
                </Button>
              </div>
            </CardHeader>
          </Card>
        ) : !isLoading && sessionActive && "connection" in status ? (
          <WebRTCPlayer
            connection={status.connection}
            startedAt={"startedAt" in status ? status.startedAt : Date.now()}
            selectedGame={game.title}
            onEnd={() => endMutation.mutate()}
            isEnding={endMutation.isPending}
          />
        ) : !isLoading && status?.status === "queued" && sessionForThisGame ? (
          <QueueStatus position={(status as { position: number }).position} onLeave={() => endMutation.mutate()} />
        ) : !isLoading && status?.status === "pending" && sessionForThisGame ? (
          <Card className="gaming-card border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="size-2 rounded-full bg-primary animate-pulse" />
                Aprovisionando GPU…
              </CardTitle>
              <CardDescription>
                Tu instancia está siendo preparada. Esto toma unos segundos.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : null}

        {/* Main layout: description + sidebar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Description */}
          <div className="sm:col-span-2 space-y-6">
            <div className="space-y-3">
              <h2 className="font-bold text-lg tracking-tight">Acerca del juego</h2>
              <p className="text-muted-foreground leading-relaxed">{game.description}</p>
            </div>

            {isIdle && !sessionForOtherGame && (
              <Button
                size="lg"
                className="gap-2 px-8 font-semibold shadow-[0_0_24px_oklch(0.76_0.19_196/25%)]"
                onClick={() => startMutation.mutate()}
                disabled={startMutation.isPending}
              >
                <Play className="size-4 fill-current" />
                {startMutation.isPending ? "Iniciando…" : "Jugar ahora"}
              </Button>
            )}
          </div>

          {/* Sidebar: game specs */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Detalles
            </h3>
            <div className="gaming-card rounded-xl divide-y divide-white/5 overflow-hidden">
              <SpecRow icon={<Gamepad2 className="size-3.5" />} label="Género" value={game.genre} />
              <SpecRow icon={<Users className="size-3.5" />} label="Jugadores" value={String(game.players)} />
              <SpecRow icon={<MonitorPlay className="size-3.5" />} label="Resolución" value="Hasta 4K" />
              <SpecRow icon={<Cpu className="size-3.5" />} label="GPU" value="Cloud GPU" />
              <SpecRow icon={<Globe className="size-3.5" />} label="Plataforma" value="Browser" />
            </div>

            {/* Stream quality badge */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-3 flex items-center gap-3">
              <div className="size-2 rounded-full bg-primary animate-pulse" />
              <div>
                <p className="text-xs text-muted-foreground leading-none mb-1">Calidad de stream</p>
                <p className="text-sm font-semibold text-primary">60 FPS · Ultra Low Latency</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SpecRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 gap-4">
      <span className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className="text-xs font-medium text-right">{value}</span>
    </div>
  )
}
