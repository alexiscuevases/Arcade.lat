import { useState } from "react"
import {
  User, Mail, Shield, Trash2, Lock, Smartphone,
  Key, Eye, EyeOff, Globe, Bell, BellOff,
  Monitor, Moon, Sun, Palette, Volume2, VolumeX,
  Languages, Save,
} from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Label } from "@/shared/components/ui/label"
import { Separator } from "@/shared/components/ui/separator"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { Badge } from "@/shared/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs"
import { getUser } from "@/shared/lib/auth"
import { cn } from "@/shared/lib/utils"

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function AccountPage() {
  const user = getUser()
  if (!user) return null

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 right-1/4 size-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="mx-auto max-w-3xl px-6 py-12">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 ring-2 ring-primary/20">
              <AvatarFallback className="text-xl bg-primary/10 text-primary font-bold">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">{user.email.split("@")[0]}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">{user.email}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white/5 border border-white/8 p-1 rounded-xl">
            <TabsTrigger value="profile" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <User className="size-4" />
              Perfil
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <Shield className="size-4" />
              Seguridad
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-2 data-[state=active]:bg-primary/10 data-[state=active]:text-primary rounded-lg">
              <Monitor className="size-4" />
              Ajustes
            </TabsTrigger>
          </TabsList>

          {/* ─── Profile Tab ─── */}
          <TabsContent value="profile" className="space-y-6">
            <ProfileTab user={user} />
          </TabsContent>

          {/* ─── Security Tab ─── */}
          <TabsContent value="security" className="space-y-6">
            <SecurityTab />
          </TabsContent>

          {/* ─── Settings Tab ─── */}
          <TabsContent value="settings" className="space-y-6">
            <SettingsTab />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

// ─── Profile Tab ────────────────────────────────────────────────────────────

function ProfileTab({ user }: { user: { id: string; email: string; plan: string; role: string } }) {
  return (
    <>
      {/* Profile info */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Información personal</CardTitle>
          <CardDescription>Tu identidad pública en Arcade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nombre de usuario</Label>
              <Input
                defaultValue={user.email.split("@")[0]}
                className="bg-white/4 border-white/10"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Email</Label>
              <Input
                value={user.email}
                readOnly
                className="bg-white/4 border-white/10 text-muted-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Bio</Label>
            <Input
              placeholder="Cuéntanos algo sobre ti..."
              className="bg-white/4 border-white/10"
            />
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-2">
              <Save className="size-4" />
              Guardar cambios
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Account details */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Detalles de cuenta</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/8 bg-primary/5">
              <Mail className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>

          <Separator className="bg-white/6" />

          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/8 bg-primary/5">
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">User ID</p>
              <p className="text-sm font-medium font-mono">{user.id}</p>
            </div>
          </div>

          <Separator className="bg-white/6" />

          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/8 bg-primary/5">
              <Globe className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Plan</p>
              <p className="text-sm font-medium">{user.plan}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-destructive/3">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-destructive">Zona de peligro</CardTitle>
          <CardDescription>Acciones irreversibles. Procede con precaución.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Eliminar cuenta</p>
              <p className="text-xs text-muted-foreground">Elimina permanentemente tu cuenta y todos tus datos.</p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              <Trash2 className="size-4 mr-1.5" />
              Eliminar
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Security Tab ───────────────────────────────────────────────────────────

function SecurityTab() {
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)

  return (
    <>
      {/* Change password */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Lock className="size-4 text-primary" />
            Cambiar contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña de acceso.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Contraseña actual</Label>
            <div className="relative">
              <Input
                type={showCurrent ? "text" : "password"}
                placeholder="••••••••"
                className="bg-white/4 border-white/10 pr-10"
              />
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowCurrent(!showCurrent)}
              >
                {showCurrent ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showNew ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  className="bg-white/4 border-white/10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowNew(!showNew)}
                >
                  {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Confirmar contraseña</Label>
              <div className="relative">
                <Input
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repite la contraseña"
                  className="bg-white/4 border-white/10 pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirm(!showConfirm)}
                >
                  {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button size="sm" className="gap-2">
              <Key className="size-4" />
              Actualizar contraseña
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Two-factor auth */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Smartphone className="size-4 text-primary" />
            Autenticación de dos factores (2FA)
          </CardTitle>
          <CardDescription>Añade una capa extra de seguridad a tu cuenta.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium">Estado</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-yellow-400 border-yellow-500/30 bg-yellow-500/10 text-[10px]">
                  Desactivado
                </Badge>
                <p className="text-xs text-muted-foreground">Tu cuenta no tiene 2FA habilitado.</p>
              </div>
            </div>
            <Button variant="outline" size="sm" className="gap-2" disabled>
              <Shield className="size-4" />
              Activar 2FA
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active sessions */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Monitor className="size-4 text-primary" />
            Sesiones activas
          </CardTitle>
          <CardDescription>Dispositivos donde has iniciado sesión.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-3 p-3 rounded-lg bg-white/3 border border-white/6">
            <div className="flex size-9 items-center justify-center rounded-lg bg-green-500/10 border border-green-500/20">
              <Monitor className="size-4 text-green-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">Este dispositivo</p>
              <p className="text-xs text-muted-foreground">Chrome · Windows · Activo ahora</p>
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px]">
              Actual
            </Badge>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2 text-destructive hover:text-destructive" disabled>
              <Trash2 className="size-3.5" />
              Cerrar otras sesiones
            </Button>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Settings Tab ───────────────────────────────────────────────────────────

function SettingsTab() {
  const [notifications, setNotifications] = useState(true)
  const [sounds, setSounds] = useState(true)

  return (
    <>
      {/* Notifications preferences */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Bell className="size-4 text-primary" />
            Notificaciones
          </CardTitle>
          <CardDescription>Configura cómo y cuándo recibir alertas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <SettingToggle
            icon={notifications ? <Bell className="size-4" /> : <BellOff className="size-4" />}
            label="Notificaciones push"
            description="Recibe alertas de nuevos juegos y ofertas."
            enabled={notifications}
            onToggle={() => setNotifications(!notifications)}
          />
          <Separator className="bg-white/6" />
          <SettingToggle
            icon={sounds ? <Volume2 className="size-4" /> : <VolumeX className="size-4" />}
            label="Sonidos"
            description="Reproduce sonidos para las notificaciones."
            enabled={sounds}
            onToggle={() => setSounds(!sounds)}
          />
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Palette className="size-4 text-primary" />
            Apariencia
          </CardTitle>
          <CardDescription>Personaliza el aspecto visual de Arcade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Tema</Label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "dark", label: "Oscuro", icon: <Moon className="size-4" /> },
                { value: "light", label: "Claro", icon: <Sun className="size-4" /> },
                { value: "system", label: "Sistema", icon: <Monitor className="size-4" /> },
              ].map((theme) => (
                <button
                  key={theme.value}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    theme.value === "dark"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-white/8 bg-white/4 text-muted-foreground hover:text-foreground hover:border-white/15",
                  )}
                >
                  {theme.icon}
                  {theme.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xs uppercase tracking-wider text-muted-foreground">
            <Languages className="size-4 text-primary" />
            Idioma y región
          </CardTitle>
          <CardDescription>Ajustes de idioma y localización.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">Idioma</Label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { value: "es", label: "Español" },
                { value: "en", label: "English" },
              ].map((lang) => (
                <button
                  key={lang.value}
                  className={cn(
                    "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm transition-colors",
                    lang.value === "es"
                      ? "border-primary/30 bg-primary/10 text-primary"
                      : "border-white/8 bg-white/4 text-muted-foreground hover:text-foreground hover:border-white/15",
                  )}
                >
                  {lang.label}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}

// ─── Reusable toggle ────────────────────────────────────────────────────────

function SettingToggle({
  icon, label, description, enabled, onToggle,
}: {
  icon: React.ReactNode; label: string; description: string; enabled: boolean; onToggle: () => void
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <div className={cn(
          "flex size-8 items-center justify-center rounded-md border",
          enabled
            ? "bg-primary/10 border-primary/20 text-primary"
            : "bg-white/4 border-white/8 text-muted-foreground",
        )}>
          {icon}
        </div>
        <div>
          <p className="text-sm font-medium">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      <button
        onClick={onToggle}
        className={cn(
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors",
          enabled ? "bg-primary" : "bg-white/10",
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg transition-transform",
            enabled ? "translate-x-5" : "translate-x-0",
          )}
        />
      </button>
    </div>
  )
}
