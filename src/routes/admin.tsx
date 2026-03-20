import { useRef, useState } from "react"
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
  Settings2,
  Upload,
  ImageIcon,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogFooter,
} from "@/components/ui/dialog"
import { api } from "@/lib/api"
import { getUser } from "@/lib/auth"
import { toast } from "sonner"
import type { AdminUserRow, GameRow } from "@shared/types"

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

// ─── User Modal ────────────────────────────────────────────────────────────────

function UserModal({
  user,
  open,
  onClose,
}: {
  user: AdminUserRow
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const [plan, setPlan] = useState<"FREE" | "BASIC" | "PRO">(user.plan)
  const [role, setRole] = useState<"ADMIN" | "USER">(user.role)

  const updateUser = useMutation({
    mutationFn: (patch: { plan?: string; role?: string }) =>
      api.admin.updateUser(user.id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-users"] })
      qc.invalidateQueries({ queryKey: ["admin-stats"] })
      toast.success("User updated")
    },
    onError: () => toast.error("Failed to update user"),
  })

  const hasChanges = plan !== user.plan || role !== user.role

  function handleSave() {
    const patch: { plan?: string; role?: string } = {}
    if (plan !== user.plan) patch.plan = plan
    if (role !== user.role) patch.role = role
    updateUser.mutate(patch, { onSuccess: onClose })
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar className="size-10">
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {user.email.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <DialogTitle className="truncate">{user.email.split("@")[0]}</DialogTitle>
              <DialogDescription className="truncate">{user.email}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody>
          <div className="text-xs text-muted-foreground pb-1">
            Joined {new Date(user.created_at).toLocaleDateString()}
          </div>

          {/* Plan */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Plan
            </label>
            <div className="flex gap-2">
              {(["FREE", "BASIC", "PRO"] as const).map((p) => (
                <button
                  key={p}
                  onClick={() => setPlan(p)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    plan === p
                      ? p === "PRO"
                        ? "bg-yellow-500/15 border-yellow-500/40 text-yellow-400"
                        : p === "BASIC"
                          ? "bg-primary/15 border-primary/40 text-primary"
                          : "bg-white/10 border-white/20 text-foreground"
                      : "border-white/8 text-muted-foreground hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Role */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Role
            </label>
            <div className="flex gap-2">
              {(["USER", "ADMIN"] as const).map((r) => (
                <button
                  key={r}
                  onClick={() => setRole(r)}
                  className={`flex-1 rounded-lg border py-2 text-xs font-semibold transition-all ${
                    role === r
                      ? r === "ADMIN"
                        ? "bg-red-500/15 border-red-500/40 text-red-400"
                        : "bg-white/10 border-white/20 text-foreground"
                      : "border-white/8 text-muted-foreground hover:border-white/20 hover:text-foreground"
                  }`}
                >
                  {r === "ADMIN" && <Shield className="size-3 inline mr-1" />}
                  {r}
                </button>
              ))}
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateUser.isPending}
          >
            <Check className="size-3.5 mr-1.5" />
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Users ────────────────────────────────────────────────────────────────────

function UsersSection() {
  const [search, setSearch] = useState("")
  const [selectedUser, setSelectedUser] = useState<AdminUserRow | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: api.admin.users,
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
                <th className="px-4 py-3 text-right">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
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
                      <PlanBadge plan={u.plan} />
                    </td>
                    {/* Role */}
                    <td className="px-4 py-3">
                      <Badge
                        className={
                          u.role === "ADMIN"
                            ? "bg-red-500/15 text-red-400 border-red-500/30 text-xs gap-1"
                            : "bg-white/5 text-muted-foreground border-white/10 text-xs"
                        }
                      >
                        {u.role === "ADMIN" && <Shield className="size-3" />}
                        {u.role === "ADMIN" ? "Admin" : "User"}
                      </Badge>
                    </td>
                    {/* Joined */}
                    <td className="px-4 py-3 text-xs text-muted-foreground">
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    {/* Manage */}
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setSelectedUser(u)}
                        className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-white/5"
                        title="Manage user"
                      >
                        <Settings2 className="size-4" />
                      </button>
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

      {selectedUser && (
        <UserModal
          user={selectedUser}
          open={true}
          onClose={() => setSelectedUser(null)}
        />
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
                <th className="px-4 py-3 text-left">Game</th>
                <th className="px-4 py-3 text-left">Instance</th>
                <th className="px-4 py-3 text-left">Started</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/4">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : sessions.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">
                    No active sessions right now.
                  </td>
                </tr>
              ) : (
                sessions.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="size-2 shrink-0 rounded-full bg-green-400 animate-pulse shadow-[0_0_6px_#4ade80]" />
                        <span className="truncate max-w-[180px]">{s.user_email}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {s.game_title ? (
                        <div className="flex items-center gap-1.5">
                          <Gamepad2 className="size-3.5 text-primary shrink-0" />
                          <span className="text-sm truncate max-w-[140px]">{s.game_title}</span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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

// ─── Game Modal ────────────────────────────────────────────────────────────────

function GameModal({
  game,
  open,
  onClose,
}: {
  game: GameRow
  open: boolean
  onClose: () => void
}) {
  const qc = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [title, setTitle] = useState(game.title)
  const [genre, setGenre] = useState(game.genre)
  const [players, setPlayers] = useState(game.players)
  const [developer, setDeveloper] = useState(game.developer)
  const [description, setDescription] = useState(game.description)
  const [coverPreview, setCoverPreview] = useState<string | null>(
    game.cover_art_url ? `${game.cover_art_url}?t=${Date.now()}` : null
  )
  const [uploading, setUploading] = useState(false)

  const updateGame = useMutation({
    mutationFn: (patch: Parameters<typeof api.admin.updateGame>[1]) =>
      api.admin.updateGame(game.id, patch),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-games"] })
      toast.success("Game updated")
      onClose()
    },
    onError: () => toast.error("Failed to update game"),
  })

  async function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setCoverPreview(URL.createObjectURL(file))
    setUploading(true)
    try {
      await api.admin.uploadGameCover(game.id, file)
      qc.invalidateQueries({ queryKey: ["admin-games"] })
      toast.success("Cover uploaded")
    } catch {
      toast.error("Failed to upload cover")
      setCoverPreview(game.cover_art_url ?? null)
    } finally {
      setUploading(false)
    }
  }

  function handleSave() {
    updateGame.mutate({ title, genre, players, developer, description })
  }

  const hasChanges =
    title !== game.title ||
    genre !== game.genre ||
    players !== game.players ||
    developer !== game.developer ||
    description !== game.description

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Manage Game</DialogTitle>
          <DialogDescription>{game.title}</DialogDescription>
        </DialogHeader>

        <DialogBody>
          {/* Cover art */}
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Cover Art
            </label>
            <div className="flex items-center gap-4">
              <div
                className={`relative size-20 rounded-lg overflow-hidden border border-white/10 bg-linear-to-br ${game.gradient} shrink-0 flex items-center justify-center`}
              >
                {coverPreview ? (
                  <img
                    src={coverPreview}
                    alt="Cover"
                    className="size-full object-cover"
                  />
                ) : (
                  <ImageIcon className="size-7 text-white/40" />
                )}
                {uploading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10 text-xs h-8"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                >
                  <Upload className="size-3.5 mr-1.5" />
                  {coverPreview ? "Replace image" : "Upload image"}
                </Button>
                <p className="text-xs text-muted-foreground">JPG, PNG or WebP. Max 5 MB.</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleCoverChange}
                />
              </div>
            </div>
          </div>

          {/* Fields */}
          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-muted-foreground">Title</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background border-white/10 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Genre</label>
              <Input
                value={genre}
                onChange={(e) => setGenre(e.target.value)}
                className="bg-background border-white/10 h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs text-muted-foreground">Players</label>
              <Input
                value={players}
                onChange={(e) => setPlayers(e.target.value)}
                className="bg-background border-white/10 h-8 text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-muted-foreground">Developer</label>
              <Input
                value={developer}
                onChange={(e) => setDeveloper(e.target.value)}
                className="bg-background border-white/10 h-8 text-sm"
              />
            </div>
            <div className="col-span-2 space-y-1">
              <label className="text-xs text-muted-foreground">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-white/10 bg-background px-3 py-2 text-sm outline-none resize-none focus:border-primary/50 transition-colors"
              />
            </div>
          </div>
        </DialogBody>

        <DialogFooter>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!hasChanges || updateGame.isPending}
          >
            <Check className="size-3.5 mr-1.5" />
            Save changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

// ─── Games ────────────────────────────────────────────────────────────────────

function GamesSection() {
  const qc = useQueryClient()
  const [selectedGame, setSelectedGame] = useState<GameRow | null>(null)

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
                  {/* Cover / gradient thumb */}
                  <div
                    className={`relative size-10 rounded-lg bg-linear-to-br ${game.gradient} flex items-center justify-center shrink-0 overflow-hidden`}
                  >
                    {game.cover_art_url ? (
                      <img
                        src={`${game.cover_art_url}?t=${game.id}`}
                        alt={game.title}
                        className="size-full object-cover"
                      />
                    ) : (
                      <Gamepad2 className="size-5 text-white/80" />
                    )}
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
                  {/* Manage */}
                  <button
                    onClick={() => setSelectedGame(game)}
                    className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-white/5 shrink-0"
                    title="Manage game"
                  >
                    <Settings2 className="size-4" />
                  </button>
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

      {selectedGame && (
        <GameModal
          game={selectedGame}
          open={true}
          onClose={() => setSelectedGame(null)}
        />
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
