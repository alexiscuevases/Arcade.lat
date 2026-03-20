import { useState } from "react"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import {
  LayoutDashboard,
  Users,
  Monitor,
  Gamepad2,
  Shield,
  Crown,
  Zap,
  Search,
  Ban,
  Activity,
  Check,
  X,
  Wifi,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { toast } from "sonner"

type Tab = "overview" | "users" | "sessions" | "games"

// ─── Overview ─────────────────────────────────────────────────────────────────

function OverviewSection() {
  const { data, isLoading } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: api.admin.stats,
  })

  if (isLoading) return <LoadingPlaceholder rows={4} />

  const stats = data ?? {
    totalUsers: 0,
    planBreakdown: { FREE: 0, BASIC: 0, PRO: 0 },
    activeSessions: 0,
    recentUsers: [],
  }

  return (
    <div className="space-y-6">
      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <StatCard
          label="Total Users"
          value={stats.totalUsers}
          icon={<Users className="size-4 text-primary" />}
        />
        <StatCard
          label="Active Sessions"
          value={stats.activeSessions}
          icon={<Wifi className="size-4 text-green-400" />}
          valueClass="text-green-400"
        />
        <StatCard
          label="PRO Users"
          value={stats.planBreakdown.PRO}
          icon={<Crown className="size-4 text-yellow-400" />}
          valueClass="text-yellow-400"
        />
        <StatCard
          label="BASIC Users"
          value={stats.planBreakdown.BASIC}
          icon={<Zap className="size-4 text-primary" />}
        />
      </div>

      {/* Plan distribution bar */}
      <Card className="gaming-card">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
            Plan Distribution
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-5 space-y-3">
          <PlanBar
            label="FREE"
            count={stats.planBreakdown.FREE}
            total={stats.totalUsers}
            color="bg-white/30"
          />
          <PlanBar
            label="BASIC"
            count={stats.planBreakdown.BASIC}
            total={stats.totalUsers}
            color="bg-primary"
          />
          <PlanBar
            label="PRO"
            count={stats.planBreakdown.PRO}
            total={stats.totalUsers}
            color="bg-yellow-400"
          />
        </CardContent>
      </Card>

      {/* Recent signups */}
      <Card className="gaming-card">
        <CardHeader className="pb-2 pt-4 px-5">
          <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground">
            Recent Signups
          </CardTitle>
        </CardHeader>
        <CardContent className="px-5 pb-4">
          {stats.recentUsers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No recent signups.</p>
          ) : (
            <div className="space-y-3">
              {stats.recentUsers.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Avatar className="size-7">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {u.email.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm flex-1 truncate">{u.email}</span>
                  <PlanBadge plan={u.plan} />
                  <span className="text-xs text-muted-foreground shrink-0">
                    {new Date(u.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersSection() {
  const qc = useQueryClient()
  const [search, setSearch] = useState("")
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editPlan, setEditPlan] = useState<"FREE" | "BASIC" | "PRO">("FREE")

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: api.admin.users,
  })

  const updateUser = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: { plan?: string; role?: string } }) =>
      api.admin.updateUser(id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      qc.invalidateQueries({ queryKey: ["admin-stats"] })
      setEditingId(null)
      toast.success("User updated")
    },
    onError: () => toast.error("Failed to update user"),
  })

  const users = (data?.users ?? []).filter((u) =>
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="relative max-w-xs">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          placeholder="Search users..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9 bg-card border-white/10"
        />
      </div>

      <Card className="gaming-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Plan</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-left">Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-white/[0.02] transition-colors">
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <Avatar className="size-7 shrink-0">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                            {u.email.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-medium truncate">{u.email.split("@")[0]}</p>
                          <p className="text-xs text-muted-foreground truncate">{u.email}</p>
                        </div>
                      </div>
                    </td>

                    {/* Plan */}
                    <td className="px-4 py-3">
                      {editingId === u.id ? (
                        <div className="flex items-center gap-1.5">
                          <select
                            value={editPlan}
                            onChange={(e) =>
                              setEditPlan(e.target.value as "FREE" | "BASIC" | "PRO")
                            }
                            className="rounded border border-white/10 bg-card text-xs px-2 py-1 outline-none"
                          >
                            <option>FREE</option>
                            <option>BASIC</option>
                            <option>PRO</option>
                          </select>
                          <button
                            onClick={() =>
                              updateUser.mutate({ id: u.id, patch: { plan: editPlan } })
                            }
                            className="text-green-400 hover:text-green-300"
                          >
                            <Check className="size-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-muted-foreground hover:text-foreground"
                          >
                            <X className="size-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setEditingId(u.id)
                            setEditPlan(u.plan)
                          }}
                          className="hover:opacity-80 transition-opacity"
                          title="Click to change plan"
                        >
                          <PlanBadge plan={u.plan} />
                        </button>
                      )}
                    </td>

                    {/* Role */}
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          u.role === "ADMIN"
                            ? "bg-red-500/15 text-red-400 border-red-500/30 text-xs cursor-pointer hover:bg-red-500/25 gap-1"
                            : "bg-white/5 text-muted-foreground border-white/10 text-xs cursor-pointer hover:bg-white/10"
                        }
                        onClick={() =>
                          updateUser.mutate({
                            id: u.id,
                            patch: { role: u.role === "ADMIN" ? "USER" : "ADMIN" },
                          })
                        }
                        title="Click to toggle role"
                      >
                        {u.role === "ADMIN" && <Shield className="size-3" />}
                        {u.role === "ADMIN" ? "Admin" : "User"}
                      </Badge>
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {data && (
        <p className="text-xs text-muted-foreground px-1">
          {users.length} of {data.total} users
        </p>
      )}
    </div>
  )
}

// ─── Sessions ─────────────────────────────────────────────────────────────────

function SessionsSection() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-sessions"],
    queryFn: api.admin.sessions,
    refetchInterval: 10_000,
  })

  const killSession = useMutation({
    mutationFn: (id: string) => api.admin.killSession(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-sessions"] })
      qc.invalidateQueries({ queryKey: ["admin-stats"] })
      toast.success("Session terminated")
    },
    onError: () => toast.error("Failed to terminate session"),
  })

  const sessions = data?.sessions ?? []

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Activity className="size-4 text-green-400" />
        <span>Auto-refreshes every 10 seconds</span>
        {sessions.length > 0 && (
          <Badge className="ml-auto bg-green-500/10 text-green-400 border-green-500/30 text-xs">
            {sessions.length} active
          </Badge>
        )}
      </div>

      <Card className="gaming-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/6 text-xs uppercase tracking-wider text-muted-foreground">
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Instance</th>
                <th className="px-4 py-3 text-left">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {isLoading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No active sessions right now.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
                        <span className="truncate max-w-[200px]">{s.user_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                      {s.instance_ip ? `${s.instance_ip}:${s.instance_port}` : "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(s.started_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="destructive"
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => killSession.mutate(s.id)}
                        disabled={killSession.isPending}
                      >
                        <Ban className="size-3 mr-1" />
                        Kill
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

// ─── Games ────────────────────────────────────────────────────────────────────

function GamesSection() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ["admin-games"],
    queryFn: api.admin.games,
  })

  const toggleGame = useMutation({
    mutationFn: ({ id, enabled }: { id: string; enabled: number }) =>
      api.admin.updateGame(id, { enabled }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-games"] }),
    onError: () => toast.error("Failed to update game"),
  })

  const removeGame = useMutation({
    mutationFn: (id: string) => api.admin.deleteGame(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-games"] })
      toast.success("Game deleted")
    },
    onError: () => toast.error("Failed to delete game"),
  })

  const games = data?.games ?? []
  const enabledCount = games.filter((g) => g.enabled === 1).length

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Gamepad2 className="size-4 text-primary" />
        <span>
          {enabledCount} of {games.length} games available
        </span>
      </div>

      {isLoading ? (
        <LoadingPlaceholder rows={4} />
      ) : games.length === 0 ? (
        <Card className="gaming-card">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No games in the database. Click "Seed initial games" to add the default catalog.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {games.map((game) => {
            const on = game.enabled === 1
            return (
              <Card
                key={game.id}
                className={`gaming-card transition-opacity duration-200 ${on ? "" : "opacity-40"}`}
              >
                <CardContent className="flex items-center gap-4 px-4 py-3">
                  <div
                    className={`size-10 rounded-lg bg-linear-to-br ${game.gradient} flex items-center justify-center shrink-0`}
                  >
                    <Gamepad2 className="size-5 text-white/80" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{game.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {game.genre} · {game.developer}
                    </p>
                  </div>
                  <Badge className="text-xs bg-white/5 text-muted-foreground border-white/10 shrink-0">
                    {game.players}
                  </Badge>
                  {/* Toggle enabled */}
                  <button
                    onClick={() => toggleGame.mutate({ id: game.id, enabled: on ? 0 : 1 })}
                    disabled={toggleGame.isPending}
                    className={`relative flex items-center w-10 h-5.5 rounded-full transition-colors shrink-0 ${
                      on ? "bg-primary" : "bg-white/10"
                    }`}
                    title={on ? "Disable game" : "Enable game"}
                  >
                    <span
                      className={`absolute size-4.5 rounded-full bg-white shadow transition-transform ${
                        on ? "translate-x-5.5" : "translate-x-0.5"
                      }`}
                    />
                  </button>
                  {/* Delete */}
                  <button
                    onClick={() => removeGame.mutate(game.id)}
                    disabled={removeGame.isPending}
                    className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    title="Delete game"
                  >
                    <X className="size-4" />
                  </button>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  icon,
  valueClass,
}: {
  label: string
  value: number
  icon: React.ReactNode
  valueClass?: string
}) {
  return (
    <Card className="gaming-card">
      <CardHeader className="pb-1 pt-4 px-4">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
          {icon}
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <span className={`text-3xl font-bold tabular-nums ${valueClass ?? ""}`}>{value}</span>
      </CardContent>
    </Card>
  )
}

function PlanBar({
  label,
  count,
  total,
  color,
}: {
  label: string
  count: number
  total: number
  color: string
}) {
  const pct = total ? Math.round((count / total) * 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-mono">
          {count}{" "}
          <span className="text-muted-foreground">({pct}%)</span>
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
        <div
          className={`h-full rounded-full ${color} transition-all duration-500`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function PlanBadge({ plan }: { plan: string }) {
  if (plan === "PRO")
    return (
      <Badge className="gap-1 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 text-xs">
        <Crown className="size-3" /> PRO
      </Badge>
    )
  if (plan === "BASIC")
    return (
      <Badge className="gap-1 bg-primary/10 text-primary border-primary/30 text-xs">
        <Zap className="size-3" /> BASIC
      </Badge>
    )
  return (
    <Badge variant="outline" className="text-muted-foreground border-white/10 text-xs">
      FREE
    </Badge>
  )
}

function LoadingPlaceholder({ rows }: { rows: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-20 rounded-lg bg-white/[0.03] animate-pulse" />
      ))}
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

const TABS: { id: Tab; label: string; Icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", Icon: LayoutDashboard },
  { id: "users", label: "Users", Icon: Users },
  { id: "sessions", label: "Sessions", Icon: Monitor },
  { id: "games", label: "Games", Icon: Gamepad2 },
]

export function AdminPage() {
  const user = getUser()
  const [tab, setTab] = useState<Tab>("overview")

  if (user?.role !== "ADMIN") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center space-y-3">
          <div className="flex size-14 items-center justify-center rounded-xl bg-destructive/10 border border-destructive/30 mx-auto">
            <Shield className="size-7 text-destructive" />
          </div>
          <p className="font-semibold text-lg">Access Denied</p>
          <p className="text-sm text-muted-foreground">
            You don't have permission to view this page.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/30">
          <Shield className="size-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Administration</h1>
          <p className="text-sm text-muted-foreground">Platform management panel</p>
        </div>
        <Badge className="ml-auto bg-red-500/10 text-red-400 border-red-500/30">
          Admin
        </Badge>
      </div>

      {/* Tab nav */}
      <div className="flex gap-1 p-1 rounded-lg bg-card border border-white/6 w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === id
                ? "bg-primary/15 text-primary border border-primary/30"
                : "text-muted-foreground hover:text-foreground hover:bg-white/5"
            }`}
          >
            <Icon className="size-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {tab === "overview" && <OverviewSection />}
      {tab === "users" && <UsersSection />}
      {tab === "sessions" && <SessionsSection />}
      {tab === "games" && <GamesSection />}
    </div>
  )
}
