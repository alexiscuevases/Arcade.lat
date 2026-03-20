import { useState } from "react"
import {
  Bell, BellOff, Gamepad2, Gift, Megaphone, AlertTriangle,
  Check, Trash2, CheckCheck,
} from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"

type NotificationType = "game" | "offer" | "update" | "alert"

interface Notification {
  id: string
  type: NotificationType
  title: string
  description: string
  date: string
  read: boolean
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "game",
    title: "Nuevo juego disponible",
    description: "GTA VI ya está disponible en el catálogo. ¡Sé de los primeros en jugarlo!",
    date: "2026-03-20",
    read: false,
  },
  {
    id: "2",
    type: "offer",
    title: "Oferta especial: 50% OFF en PRO",
    description: "Solo por esta semana, actualiza a PRO con un 50% de descuento. Tiempo ilimitado y 4K Ultra.",
    date: "2026-03-19",
    read: false,
  },
  {
    id: "3",
    type: "update",
    title: "Mejoras de rendimiento",
    description: "Hemos optimizado nuestros servidores. Ahora podrás disfrutar de menor latencia en todas tus sesiones.",
    date: "2026-03-18",
    read: false,
  },
  {
    id: "4",
    type: "alert",
    title: "Mantenimiento programado",
    description: "El jueves 21 de marzo habrá mantenimiento de 2:00 a 4:00 AM (UTC-5). Los servicios podrían no estar disponibles.",
    date: "2026-03-17",
    read: true,
  },
  {
    id: "5",
    type: "game",
    title: "Hades II — Actualización mayor",
    description: "Se ha añadido el nuevo contenido del acto final de Hades II. ¡Descúbrelo ahora!",
    date: "2026-03-15",
    read: true,
  },
  {
    id: "6",
    type: "offer",
    title: "Invita amigos y gana PRO",
    description: "Por cada 3 amigos que invites con tu código de referido, obtienes 7 días de PRO gratis.",
    date: "2026-03-13",
    read: true,
  },
]

const TYPE_CONFIG: Record<NotificationType, { icon: React.ReactNode; color: string; label: string }> = {
  game: {
    icon: <Gamepad2 className="size-4" />,
    color: "text-primary bg-primary/10 border-primary/20",
    label: "Juego",
  },
  offer: {
    icon: <Gift className="size-4" />,
    color: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
    label: "Oferta",
  },
  update: {
    icon: <Megaphone className="size-4" />,
    color: "text-accent bg-accent/10 border-accent/20",
    label: "Actualización",
  },
  alert: {
    icon: <AlertTriangle className="size-4" />,
    color: "text-orange-400 bg-orange-500/10 border-orange-500/20",
    label: "Alerta",
  },
}

function formatDate(dateStr: string) {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  if (dateStr === today.toISOString().slice(0, 10)) return "Hoy"
  if (dateStr === yesterday.toISOString().slice(0, 10)) return "Ayer"

  return date.toLocaleDateString("es-ES", { day: "numeric", month: "short" })
}

export function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.read).length

  function markAsRead(id: string) {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    )
  }

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }

  function deleteNotification(id: string) {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }

  function clearAll() {
    setNotifications([])
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 right-1/4 size-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">Centro de alertas</p>
              <h1 className="text-4xl font-bold tracking-tight mt-2">Notificaciones</h1>
              <p className="text-muted-foreground mt-1">Mantente al día con las últimas novedades.</p>
            </div>
            {unreadCount > 0 && (
              <Badge className="bg-primary/10 text-primary border-primary/30 text-sm px-3 py-1 shrink-0">
                {unreadCount} sin leer
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-6">
        {/* Actions */}
        {notifications.length > 0 && (
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                className="gap-2 text-xs"
                onClick={markAllRead}
              >
                <CheckCheck className="size-3.5" />
                Marcar todo como leído
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              className="gap-2 text-xs text-destructive hover:text-destructive ml-auto"
              onClick={clearAll}
            >
              <Trash2 className="size-3.5" />
              Limpiar todo
            </Button>
          </div>
        )}

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="flex size-16 items-center justify-center rounded-2xl bg-white/5 border border-white/8 mb-4">
              <BellOff className="size-7 text-muted-foreground" />
            </div>
            <p className="font-semibold text-lg">Sin notificaciones</p>
            <p className="text-sm text-muted-foreground mt-1">
              Estás al día. Te avisaremos cuando haya algo nuevo.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((notif) => {
              const config = TYPE_CONFIG[notif.type]
              return (
                <Card
                  key={notif.id}
                  className={cn(
                    "gaming-card transition-all",
                    !notif.read && "border-primary/20 bg-primary/[0.02]",
                  )}
                >
                  <CardContent className="flex items-start gap-4 p-4">
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl border mt-0.5",
                      config.color,
                    )}>
                      {config.icon}
                    </div>

                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2">
                        <p className={cn("font-semibold text-sm", !notif.read && "text-foreground")}>
                          {notif.title}
                        </p>
                        {!notif.read && (
                          <span className="size-2 rounded-full bg-primary shrink-0" />
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">{notif.description}</p>
                      <div className="flex items-center gap-2 pt-1">
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-white/10 text-muted-foreground">
                          {config.label}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground/60">{formatDate(notif.date)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {!notif.read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="size-8 p-0 text-muted-foreground hover:text-primary"
                          onClick={() => markAsRead(notif.id)}
                          title="Marcar como leído"
                        >
                          <Check className="size-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        onClick={() => deleteNotification(notif.id)}
                        title="Eliminar"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
