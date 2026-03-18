import { useNavigate, Link } from "@tanstack/react-router"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { Play, Zap, Crown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { SessionCard } from "@/components/dashboard/session-card"
import { QueueStatus } from "@/components/dashboard/queue-status"
import { api } from "@/lib/api"
import { getUser, clearAuth } from "@/lib/auth"

const POLL_INTERVAL = 5_000 // 5s while queued/pending

export function DashboardPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()
  const user = getUser()

  const { data: status, isLoading } = useQuery({
    queryKey: ["session-status"],
    queryFn: api.session.status,
    refetchInterval: (query) => {
      const s = query.state.data?.status
      return s === "queued" || s === "pending" ? POLL_INTERVAL : false
    },
    retry: false,
    // If 401 → logout
    meta: { onError: (err: unknown) => {
      if (err instanceof Error && err.message === "Unauthorized") {
        clearAuth()
        navigate({ to: "/login" })
      }
    }},
  })

  const startMutation = useMutation({
    mutationFn: api.session.start,
    onSuccess: (data) => {
      if (data.status === "active") toast.success("GPU assigned! Connect with Moonlight.")
      if (data.status === "queued") toast.info(`Joined queue at position #${"position" in data ? data.position : "?"}`)
      qc.invalidateQueries({ queryKey: ["session-status"] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to start session")
    },
  })

  const endMutation = useMutation({
    mutationFn: api.session.end,
    onSuccess: () => {
      toast.success("Session ended.")
      qc.invalidateQueries({ queryKey: ["session-status"] })
    },
    onError: (err: unknown) => {
      toast.error(err instanceof Error ? err.message : "Failed to end session")
    },
  })

  const planIcon = user?.plan === "PRO" ? Crown : user?.plan === "BASIC" ? Zap : null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">{user?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          {planIcon && <planIcon className="size-4 text-muted-foreground" />}
          <Badge
            variant={
              user?.plan === "PRO"
                ? "default"
                : user?.plan === "BASIC"
                  ? "secondary"
                  : "outline"
            }
          >
            {user?.plan ?? "FREE"}
          </Badge>
        </div>
      </div>

      {/* Upgrade prompt for free users */}
      {user?.plan === "FREE" && (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-medium">Upgrade for priority access</p>
              <p className="text-xs text-muted-foreground">PRO users skip the queue</p>
            </div>
            <Link to="/pricing">
              <Button size="sm" variant="outline">
                View plans
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Session area */}
      {isLoading ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            Loading…
          </CardContent>
        </Card>
      ) : status?.status === "active" && "connection" in status ? (
        <SessionCard
          connection={status.connection}
          startedAt={"startedAt" in status ? status.startedAt : Date.now()}
          onEnd={() => endMutation.mutate()}
          isEnding={endMutation.isPending}
        />
      ) : status?.status === "queued" && "position" in status ? (
        <QueueStatus
          position={status.position}
          onLeave={() => endMutation.mutate()}
        />
      ) : status?.status === "pending" ? (
        <Card>
          <CardHeader>
            <CardTitle>Provisioning GPU…</CardTitle>
            <CardDescription>Your instance is being prepared. This takes a few seconds.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        // Idle
        <Card>
          <CardHeader>
            <CardTitle>Ready to play?</CardTitle>
            <CardDescription>
              Start a session to get a GPU instance. Connect with{" "}
              <a
                href="https://moonlight-stream.org"
                target="_blank"
                rel="noreferrer"
                className="underline underline-offset-4"
              >
                Moonlight
              </a>
              .
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              className="w-full"
              onClick={() => startMutation.mutate()}
              disabled={startMutation.isPending}
            >
              <Play className="mr-2 size-4" />
              {startMutation.isPending ? "Starting…" : "Start Session"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Plan</p>
            <p className="text-lg font-semibold">{user?.plan ?? "FREE"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="py-4">
            <p className="text-xs text-muted-foreground">Session status</p>
            <p className="text-lg font-semibold capitalize">
              {isLoading ? "—" : (status?.status ?? "idle")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
