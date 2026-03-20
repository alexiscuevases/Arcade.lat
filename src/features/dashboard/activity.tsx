import { useState } from "react"
import { useQuery } from "@tanstack/react-query"
import {
  History, Gamepad2, Clock, Calendar, TrendingUp,
  Timer, Trophy, ChevronRight, Filter, Loader2, AlertCircle,
} from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Badge } from "@/shared/components/ui/badge"
import { Button } from "@/shared/components/ui/button"
import { cn } from "@/shared/lib/utils"
import { api } from "@/shared/lib/api"
import type { ActivitySession } from "@shared/types"

type FilterType = "all" | "week" | "month"

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  return h > 0 ? `${h}h ${m}m` : `${m}m`
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const toDateKey = (d: Date) => d.toISOString().slice(0, 10)

  if (toDateKey(date) === toDateKey(today)) return "Hoy"
  if (toDateKey(date) === toDateKey(yesterday)) return "Ayer"

  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

function getDateKey(dateStr: string) {
  return new Date(dateStr).toISOString().slice(0, 10)
}

function filterSessions(sessions: ActivitySession[], filter: FilterType): ActivitySession[] {
  if (filter === "all") return sessions

  const now = new Date()
  const cutoff = new Date()

  if (filter === "week") {
    cutoff.setDate(now.getDate() - 7)
  } else {
    cutoff.setDate(now.getDate() - 30)
  }

  return sessions.filter((s) => new Date(s.started_at) >= cutoff)
}

function groupByDate(sessions: ActivitySession[]) {
  const groups: Record<string, ActivitySession[]> = {}
  for (const s of sessions) {
    const key = getDateKey(s.started_at)
    if (!groups[key]) groups[key] = []
    groups[key].push(s)
  }
  return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a))
}

export function ActivityPage() {
  const [filter, setFilter] = useState<FilterType>("all")

  const { data, isLoading, isError } = useQuery({
    queryKey: ["activity"],
    queryFn: () => api.activity.list(),
  })

  const sessions = data ? filterSessions(data.sessions, filter) : []
  const grouped = groupByDate(sessions)
  const stats = data?.stats

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 right-1/4 size-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">Tu actividad</p>
          <h1 className="text-4xl font-bold tracking-tight mt-2">Historial de juegos</h1>
          <p className="text-muted-foreground mt-1">Revisa tus sesiones de juego y estadísticas.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="size-6 animate-spin text-primary" />
            <span className="ml-3 text-muted-foreground">Cargando actividad...</span>
          </div>
        )}

        {isError && (
          <div className="flex items-center justify-center py-20 gap-3 text-destructive">
            <AlertCircle className="size-5" />
            <span>Error al cargar la actividad. Intenta de nuevo.</span>
          </div>
        )}

        {data && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <StatMini
                label="Tiempo total"
                value={formatDuration(stats!.total_seconds)}
                icon={<Clock className="size-4" />}
                accent="cyan"
              />
              <StatMini
                label="Sesiones"
                value={String(stats!.total_sessions)}
                icon={<History className="size-4" />}
                accent="accent"
              />
              <StatMini
                label="Juegos distintos"
                value={String(stats!.unique_games)}
                icon={<Gamepad2 className="size-4" />}
                accent="yellow"
              />
              <StatMini
                label="Más jugado"
                value={stats!.most_played_game ?? "—"}
                icon={<Trophy className="size-4" />}
                accent="green"
              />
            </div>

            {/* Filter */}
            <div className="flex items-center gap-2">
              <Filter className="size-4 text-muted-foreground" />
              {(["all", "week", "month"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  className="h-7 text-xs"
                  onClick={() => setFilter(f)}
                >
                  {f === "all" ? "Todo" : f === "week" ? "Esta semana" : "Este mes"}
                </Button>
              ))}
            </div>

            {/* Sessions grouped by date */}
            {sessions.length === 0 ? (
              <div className="text-center py-16">
                <Gamepad2 className="size-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">No hay sesiones en este periodo.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {grouped.map(([date, daySessions]) => (
                  <div key={date} className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="size-3.5" />
                      <span className="font-medium uppercase tracking-wider">{formatDate(date)}</span>
                      <span className="text-muted-foreground/50">·</span>
                      <span>
                        {formatDuration(daySessions.reduce((s, g) => s + g.duration_seconds, 0))} total
                      </span>
                    </div>

                    <div className="space-y-2">
                      {daySessions.map((session) => (
                        <Card key={session.id} className="gaming-card group">
                          <CardContent className="flex items-center gap-4 p-4">
                            <div className={cn(
                              "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br border border-white/8",
                              session.game_gradient ?? "from-zinc-500/20 to-zinc-600/20",
                            )}>
                              {session.game_cover_art_url ? (
                                <img
                                  src={session.game_cover_art_url}
                                  alt={session.game_title ?? ""}
                                  className="size-full rounded-xl object-cover"
                                />
                              ) : (
                                <Gamepad2 className="size-5 text-foreground/70" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm truncate">
                                {session.game_title ?? "Juego desconocido"}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {session.game_genre && (
                                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 text-muted-foreground">
                                    {session.game_genre}
                                  </Badge>
                                )}
                                {!session.ended_at && (
                                  <Badge className="text-[10px] px-1.5 py-0 bg-green-500/10 text-green-400 border-green-500/30">
                                    En curso
                                  </Badge>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center gap-3 shrink-0">
                              <div className="text-right">
                                <div className="flex items-center gap-1 text-sm font-medium">
                                  <Timer className="size-3.5 text-primary" />
                                  {formatDuration(session.duration_seconds)}
                                </div>
                              </div>
                              <ChevronRight className="size-4 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Trend card */}
            {stats!.total_sessions > 0 && (
              <Card className="gaming-card">
                <CardContent className="flex items-center gap-4 p-5">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-green-500/10 border border-green-500/20">
                    <TrendingUp className="size-5 text-green-400" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Resumen de actividad</p>
                    <p className="text-xs text-muted-foreground">
                      Has jugado {formatDuration(stats!.total_seconds)} en {stats!.total_sessions}{" "}
                      {stats!.total_sessions === 1 ? "sesión" : "sesiones"}
                      {stats!.most_played_game && (
                        <> — tu juego favorito es <span className="text-foreground font-medium">{stats!.most_played_game}</span> con {formatDuration(stats!.most_played_seconds)}</>
                      )}
                      .
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>
    </div>
  )
}

type MiniAccent = "cyan" | "accent" | "yellow" | "green"

function StatMini({
  label, value, icon, accent,
}: {
  label: string; value: string; icon: React.ReactNode; accent: MiniAccent
}) {
  const styles: Record<MiniAccent, string> = {
    cyan: "text-primary bg-primary/10 border-primary/20",
    accent: "text-accent bg-accent/10 border-accent/20",
    yellow: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    green: "text-green-400 bg-green-500/10 border-green-500/20",
  }

  return (
    <div className="gaming-card rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{label}</span>
        <div className={cn("flex size-6 items-center justify-center rounded-md border", styles[accent])}>
          {icon}
        </div>
      </div>
      <p className="text-lg font-bold tracking-tight truncate">{value}</p>
    </div>
  )
}
