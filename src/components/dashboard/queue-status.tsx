import { Clock, Users } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface QueueStatusProps {
  position: number
  onLeave?: () => void
}

export function QueueStatus({ position, onLeave }: QueueStatusProps) {
  return (
    <Card className="border-yellow-500/30 bg-yellow-500/5">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Clock className="size-5 text-yellow-500" />
            In Queue
          </CardTitle>
          <Badge variant="warning">Waiting</Badge>
        </div>
        <CardDescription>
          You&apos;ll be connected automatically when a GPU is available
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border bg-muted/50 p-4">
          <div className="flex items-center gap-3">
            <Users className="size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">Your position</p>
              <p className="text-xs text-muted-foreground">Auto-assigned when ready</p>
            </div>
          </div>
          <span className="text-3xl font-bold">#{position}</span>
        </div>

        <p className="text-xs text-center text-muted-foreground">
          PRO subscribers are prioritized. Refresh to update your position.
        </p>

        {onLeave && (
          <Button variant="outline" className="w-full" onClick={onLeave}>
            Leave Queue
          </Button>
        )}
      </CardContent>
    </Card>
  )
}
