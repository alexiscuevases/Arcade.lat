import { useState } from "react"
import {
  Users, Copy, Check, Gift, Share2, Link2,
  Trophy, Zap, Crown,
} from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"
import { getUser } from "@/shared/lib/auth"

const MOCK_REFERRALS = [
  { email: "carlos@mail.com", date: "2026-03-18", status: "active" as const },
  { email: "maria@mail.com", date: "2026-03-12", status: "active" as const },
  { email: "juan@mail.com", date: "2026-03-05", status: "pending" as const },
]

const REWARDS = [
  { count: 1, reward: "3 días PRO gratis", icon: <Zap className="size-4" /> },
  { count: 3, reward: "7 días PRO gratis", icon: <Crown className="size-4" /> },
  { count: 5, reward: "14 días PRO gratis", icon: <Trophy className="size-4" /> },
  { count: 10, reward: "1 mes PRO gratis", icon: <Gift className="size-4" /> },
]

export function ReferralPage() {
  const user = getUser()
  const referralCode = user?.id?.slice(0, 8).toUpperCase() ?? "ARCADE01"
  const referralLink = `https://arcade.gg/r/${referralCode}`
  const [copied, setCopied] = useState<"code" | "link" | null>(null)

  const activeReferrals = MOCK_REFERRALS.filter((r) => r.status === "active").length

  function copyToClipboard(text: string, type: "code" | "link") {
    navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-accent/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 right-1/4 size-64 rounded-full bg-primary/8 blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-accent/70">Programa de referidos</p>
          <h1 className="text-4xl font-bold tracking-tight mt-2">Invitar amigos</h1>
          <p className="text-muted-foreground mt-1">Comparte Arcade y gana recompensas por cada amigo que se una.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {/* Referral code & link */}
        <Card className="gaming-card overflow-hidden">
          <div className="relative">
            <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
            <CardHeader className="relative">
              <CardTitle className="flex items-center gap-2">
                <Share2 className="size-5 text-primary" />
                Tu código de invitación
              </CardTitle>
              <CardDescription>Comparte tu código o link personal con tus amigos.</CardDescription>
            </CardHeader>
            <CardContent className="relative space-y-4">
              {/* Code */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Código</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center rounded-lg border border-white/10 bg-white/4 px-4 py-2.5 font-mono text-lg font-bold tracking-[0.15em] text-primary">
                    {referralCode}
                  </div>
                  <Button
                    variant="outline"
                    className="shrink-0 gap-2"
                    onClick={() => copyToClipboard(referralCode, "code")}
                  >
                    {copied === "code" ? <Check className="size-4 text-green-400" /> : <Copy className="size-4" />}
                    {copied === "code" ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>

              {/* Link */}
              <div className="space-y-1.5">
                <label className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Link directo</label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={referralLink}
                    className="flex-1 bg-white/4 border-white/10 text-sm font-mono"
                  />
                  <Button
                    variant="outline"
                    className="shrink-0 gap-2"
                    onClick={() => copyToClipboard(referralLink, "link")}
                  >
                    {copied === "link" ? <Check className="size-4 text-green-400" /> : <Link2 className="size-4" />}
                    {copied === "link" ? "Copiado" : "Copiar"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </div>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="gaming-card rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Invitados</span>
            <p className="text-2xl font-bold text-primary">{MOCK_REFERRALS.length}</p>
          </div>
          <div className="gaming-card rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Activos</span>
            <p className="text-2xl font-bold text-green-400">{activeReferrals}</p>
          </div>
          <div className="gaming-card rounded-xl p-4 space-y-2">
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">Pendientes</span>
            <p className="text-2xl font-bold text-yellow-400">{MOCK_REFERRALS.length - activeReferrals}</p>
          </div>
        </div>

        {/* Rewards tiers */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-accent/15 border border-accent/20">
              <Gift className="size-4 text-accent" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight">Recompensas</h2>
              <p className="text-xs text-muted-foreground">Desbloquea beneficios invitando más amigos</p>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {REWARDS.map((tier) => {
              const unlocked = activeReferrals >= tier.count
              return (
                <Card key={tier.count} className={cn("gaming-card", unlocked && "border-primary/30")}>
                  <CardContent className="flex items-center gap-4 p-4">
                    <div className={cn(
                      "flex size-10 shrink-0 items-center justify-center rounded-xl border",
                      unlocked
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "bg-white/4 border-white/8 text-muted-foreground",
                    )}>
                      {tier.icon}
                    </div>
                    <div className="flex-1">
                      <p className={cn("font-semibold text-sm", unlocked && "text-primary")}>{tier.reward}</p>
                      <p className="text-xs text-muted-foreground">{tier.count} referidos activos</p>
                    </div>
                    {unlocked ? (
                      <Badge className="bg-primary/10 text-primary border-primary/30 text-[10px]">Desbloqueado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-muted-foreground border-white/10 text-[10px]">
                        {tier.count - activeReferrals} más
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        <Separator className="bg-white/6" />

        {/* Referral list */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight">Tus referidos</h2>
              <p className="text-xs text-muted-foreground">Amigos que se han unido con tu código</p>
            </div>
          </div>

          <div className="space-y-2">
            {MOCK_REFERRALS.map((ref, i) => (
              <Card key={i} className="gaming-card">
                <CardContent className="flex items-center gap-4 p-4">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 border border-primary/20">
                    <span className="text-xs font-bold text-primary">{ref.email[0].toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{ref.email}</p>
                    <p className="text-xs text-muted-foreground">
                      Se unió el {new Date(ref.date).toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <Badge
                    className={cn(
                      "text-[10px]",
                      ref.status === "active"
                        ? "bg-green-500/10 text-green-400 border-green-500/30"
                        : "bg-yellow-500/10 text-yellow-400 border-yellow-500/30",
                    )}
                  >
                    {ref.status === "active" ? "Activo" : "Pendiente"}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
