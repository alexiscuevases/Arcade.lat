import { Monitor, Copy, CheckCheck } from "lucide-react"
import { useState } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface Connection {
  ip: string
  port: number
  token: string
}

interface SessionCardProps {
  connection: Connection
  startedAt: number
  onEnd: () => void
  isEnding: boolean
}

export function SessionCard({ connection, startedAt, onEnd, isEnding }: SessionCardProps) {
  const [copied, setCopied] = useState<string | null>(null)

  function copy(value: string, key: string) {
    navigator.clipboard.writeText(value)
    setCopied(key)
    setTimeout(() => setCopied(null), 2000)
  }

  const elapsed = Math.floor((Date.now() - startedAt) / 1000 / 60)

  const moonlightCmd = `moonlight stream ${connection.ip}:${connection.port}`

  return (
    <Card className="border-green-500/30 bg-green-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Monitor className="size-5 text-green-500" />
            Session Active
          </CardTitle>
          <Badge variant="success">{elapsed}m running</Badge>
        </div>
        <CardDescription>
          Connect using Moonlight with the details below
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-lg border bg-muted/50 p-4 font-mono text-sm space-y-2">
          <Row label="Host" value={connection.ip} onCopy={() => copy(connection.ip, "ip")} copied={copied === "ip"} />
          <Row label="Port" value={String(connection.port)} onCopy={() => copy(String(connection.port), "port")} copied={copied === "port"} />
          <Row label="Token" value={connection.token.slice(0, 16) + "…"} onCopy={() => copy(connection.token, "token")} copied={copied === "token"} />
        </div>

        <Separator />

        <div className="space-y-2">
          <p className="text-xs text-muted-foreground">Moonlight CLI command</p>
          <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-3 py-2">
            <code className="flex-1 text-xs">{moonlightCmd}</code>
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={() => copy(moonlightCmd, "cmd")}
            >
              {copied === "cmd" ? (
                <CheckCheck className="size-3 text-green-500" />
              ) : (
                <Copy className="size-3" />
              )}
            </Button>
          </div>
        </div>

        <Button
          variant="destructive"
          className="w-full"
          onClick={onEnd}
          disabled={isEnding}
        >
          {isEnding ? "Ending session…" : "End Session"}
        </Button>
      </CardContent>
    </Card>
  )
}

function Row({
  label,
  value,
  onCopy,
  copied,
}: {
  label: string
  value: string
  onCopy: () => void
  copied: boolean
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <span className="text-muted-foreground">{label}</span>
      <div className="flex items-center gap-2">
        <span>{value}</span>
        <button onClick={onCopy} className="text-muted-foreground hover:text-foreground">
          {copied ? (
            <CheckCheck className="size-3 text-green-500" />
          ) : (
            <Copy className="size-3" />
          )}
        </button>
      </div>
    </div>
  )
}
