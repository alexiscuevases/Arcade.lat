import { useState, useRef, useCallback } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import {
  Check,
  X,
  Zap,
  Crown,
  Gamepad2,
  ChevronDown,
  ArrowRight,
  Play,
  Monitor,
  Headphones,
  Shield,
  Star,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"

// ─── Data ────────────────────────────────────────────────────────────────────

const plans = [
  {
    id: "FREE" as const,
    name: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    description: "Prueba el cloud gaming sin comprometerte",
    cta: "Empezar gratis",
    highlight: false,
    icon: <Gamepad2 className="size-5" />,
    color: "text-muted-foreground",
    badge: null,
  },
  {
    id: "BASIC" as const,
    name: "Basic",
    monthlyPrice: 9,
    yearlyPrice: 7,
    description: "Para gamers casuales que quieren más",
    cta: "Suscribirme",
    highlight: false,
    icon: <Zap className="size-5 text-primary" />,
    color: "text-primary",
    badge: null,
  },
  {
    id: "PRO" as const,
    name: "Pro",
    monthlyPrice: 29,
    yearlyPrice: 22,
    description: "Para los que van en serio",
    cta: "Ir Pro",
    highlight: true,
    icon: <Crown className="size-5 text-yellow-400" />,
    color: "text-yellow-400",
    badge: "Más popular",
  },
]

type FeatureValue = boolean | string

interface FeatureRow {
  label: string
  free: FeatureValue
  basic: FeatureValue
  pro: FeatureValue
  icon: React.ReactNode
}

const featureRows: FeatureRow[] = [
  { label: "Horas por día", free: "1 hora", basic: "10 horas", pro: "Ilimitado", icon: <Monitor className="size-3.5" /> },
  { label: "Resolución máxima", free: "720p", basic: "1080p", pro: "4K HDR", icon: <Monitor className="size-3.5" /> },
  { label: "Prioridad de cola", free: "Estándar", basic: "Alta", pro: "Top", icon: <Zap className="size-3.5" /> },
  { label: "Soporte", free: "Comunidad", basic: "Email", pro: "24/7 Prioritario", icon: <Headphones className="size-3.5" /> },
  { label: "Acceso anticipado", free: false, basic: false, pro: true, icon: <Star className="size-3.5" /> },
  { label: "Guardado en la nube", free: true, basic: true, pro: true, icon: <Shield className="size-3.5" /> },
  { label: "Juegos incluidos", free: "100+", basic: "100+", pro: "100+ + Estrenos", icon: <Gamepad2 className="size-3.5" /> },
  { label: "Cancelación", free: "N/A", basic: "En cualquier momento", pro: "En cualquier momento", icon: <Shield className="size-3.5" /> },
]

const faqs = [
  {
    q: "¿Necesito hardware potente?",
    a: "No. Solo necesitas una conexión a internet estable y un navegador. La GPU y el hardware de juego están en nuestra nube.",
  },
  {
    q: "¿Puedo cancelar en cualquier momento?",
    a: "Sí, puedes cancelar tu suscripción cuando quieras sin penalizaciones. Mantendrás el acceso hasta el final del período pagado.",
  },
  {
    q: "¿Qué pasa si supero mi límite de horas?",
    a: "En el plan Free se pausa la sesión al llegar a 1h diaria. Puedes hacer upgrade en cualquier momento para continuar.",
  },
  {
    q: "¿El plan anual se puede cancelar?",
    a: "Sí. Recibirás un reembolso proporcional por los meses no utilizados.",
  },
  {
    q: "¿Qué dispositivos son compatibles?",
    a: "Cualquier dispositivo con navegador moderno: PC, Mac, tablet Android/iPad, iPhone y Smart TVs con Chrome.",
  },
]

// ─── Sub-components ───────────────────────────────────────────────────────────

function FeatureCell({ value }: { value: FeatureValue }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className="size-4 text-primary mx-auto" />
    ) : (
      <X className="size-4 text-muted-foreground/40 mx-auto" />
    )
  }
  return <span className="text-xs text-center block">{value}</span>
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className="gaming-card overflow-hidden cursor-pointer select-none"
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between gap-4 p-5">
        <span className="font-medium text-foreground text-sm">{q}</span>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`}
        />
      </div>
      <div
        className="overflow-hidden transition-all duration-300"
        style={{ maxHeight: open ? "200px" : "0px" }}
      >
        <p className="px-5 pb-5 text-sm text-muted-foreground leading-relaxed">{a}</p>
      </div>
    </div>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PricingPage() {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const [yearly, setYearly] = useState(false)
  const [mouse, setMouse] = useState({ x: 50, y: 30 })
  const heroRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  async function handleSubscribe(planId: "BASIC" | "PRO") {
    if (!authed) {
      navigate({ to: "/register" })
      return
    }
    try {
      const { url } = await api.stripe.createCheckoutSession(planId)
      if (url) window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Error al crear el pago")
    }
  }

  function handleCta(id: "FREE" | "BASIC" | "PRO") {
    if (id === "FREE") {
      navigate({ to: authed ? "/" : "/register" })
    } else {
      handleSubscribe(id)
    }
  }

  return (
    <div className="overflow-x-hidden">
      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative pt-20 pb-10 flex flex-col items-center overflow-hidden px-6"
      >
        {/* Grid */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Mouse glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{
            background: `radial-gradient(ellipse 55% 55% at ${mouse.x}% ${mouse.y}%, oklch(0.76 0.19 196 / 12%), transparent)`,
          }}
        />
        {/* Orbs */}
        <div
          className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-0 right-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)" }}
        />

        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium">
            <Crown className="size-3.5" />
            Planes y precios
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-[0.95] tracking-tight">
            El plan perfecto
            <br />
            <span className="text-primary" style={{ textShadow: "0 0 40px oklch(0.76 0.19 196 / 50%)" }}>
              para cada gamer
            </span>
          </h1>

          <p className="text-lg text-muted-foreground max-w-xl mx-auto">
            Sin hardware. Sin descargas. Solo haz click y juega.
            <br />
            Cancela cuando quieras.
          </p>

          {/* Billing toggle */}
          <div className="inline-flex items-center gap-4 mt-2">
            <span className={`text-sm ${!yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Mensual
            </span>
            <button
              onClick={() => setYearly((v) => !v)}
              className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
              style={{ background: yearly ? "oklch(0.76 0.19 196)" : "oklch(0.20 0.025 265)" }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300"
                style={{ transform: yearly ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
            <span className={`text-sm flex items-center gap-1.5 ${yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Anual
              <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-primary/15 text-primary border border-primary/25">
                −25%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ─── PLAN CARDS ─── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3">
          {plans.map((plan) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
            const period = yearly ? "/mes · facturado anual" : "/mes"

            return (
              <div
                key={plan.id}
                className={`relative rounded-xl border flex flex-col transition-all duration-300 hover:-translate-y-1 ${
                  plan.highlight
                    ? "border-primary/40 bg-primary/4 shadow-[0_0_50px_oklch(0.76_0.19_196/12%)]"
                    : "border-border/60 bg-card"
                }`}
              >
                {/* Top accent line */}
                {plan.highlight && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent" />
                )}

                {/* Popular badge */}
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
                    <span className="px-3 py-0.5 rounded-full bg-primary text-background text-xs font-bold shadow-lg">
                      {plan.badge}
                    </span>
                  </div>
                )}

                <div className="p-6 flex-1 flex flex-col">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-1">
                    <span className={plan.color}>{plan.icon}</span>
                    <span className={`font-bold text-lg ${plan.highlight ? "text-primary" : "text-foreground"}`}>
                      {plan.name}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-5">{plan.description}</p>

                  {/* Price */}
                  <div className="mb-6">
                    <div className="flex items-end gap-1">
                      <span className={`text-4xl font-bold ${plan.highlight ? "text-primary" : "text-foreground"}`}>
                        ${price}
                      </span>
                      <span className="text-muted-foreground text-sm mb-1">{period}</span>
                    </div>
                    {yearly && plan.monthlyPrice > 0 && (
                      <p className="text-xs text-muted-foreground mt-1 line-through">
                        ${plan.monthlyPrice}/mes sin descuento
                      </p>
                    )}
                  </div>

                  <Separator className="mb-5 bg-white/6" />

                  {/* Features */}
                  <ul className="space-y-2.5 flex-1">
                    {featureRows.slice(0, 5).map((row) => {
                      const val = plan.id === "FREE" ? row.free : plan.id === "BASIC" ? row.basic : row.pro
                      if (typeof val === "boolean" && !val) return null
                      return (
                        <li key={row.label} className="flex items-center gap-2 text-sm">
                          <Check
                            className={`size-4 shrink-0 ${plan.highlight ? "text-primary" : "text-green-400"}`}
                          />
                          <span className="text-muted-foreground">
                            <span className="text-foreground font-medium">{typeof val === "string" ? val : ""}</span>
                            {typeof val === "string" && " · "}
                            {row.label}
                          </span>
                        </li>
                      )
                    })}
                  </ul>

                  {/* CTA */}
                  <Button
                    className={`w-full mt-6 ${plan.highlight ? "glow-cyan" : ""}`}
                    variant={plan.highlight ? "default" : "outline"}
                    onClick={() => handleCta(plan.id)}
                  >
                    {plan.id !== "FREE" && <Zap className="size-4 mr-1.5" />}
                    {plan.cta}
                  </Button>
                </div>
              </div>
            )
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          Sin tarjeta de crédito para el plan Free · Cancela cuando quieras · SSL seguro
        </p>
      </section>

      {/* ─── COMPARISON TABLE ─── */}
      <section className="py-16 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold text-foreground mb-2">Comparativa completa</h2>
            <p className="text-muted-foreground text-sm">Todo lo que incluye cada plan, lado a lado.</p>
          </div>

          <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
            {/* Table header */}
            <div className="grid grid-cols-4 bg-card/60 border-b border-border/50">
              <div className="p-4 text-sm font-medium text-muted-foreground">Característica</div>
              {plans.map((p) => (
                <div
                  key={p.id}
                  className={`p-4 text-center text-sm font-bold ${p.highlight ? "text-primary" : "text-foreground"}`}
                >
                  <div className="flex flex-col items-center gap-1">
                    <span className={p.color}>{p.icon}</span>
                    {p.name}
                  </div>
                </div>
              ))}
            </div>

            {/* Rows */}
            {featureRows.map((row, i) => (
              <div
                key={row.label}
                className={`grid grid-cols-4 border-b border-border/40 last:border-0 ${i % 2 === 0 ? "" : "bg-white/1"}`}
              >
                <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <span className="text-muted-foreground/60">{row.icon}</span>
                  {row.label}
                </div>
                <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                  <FeatureCell value={row.free} />
                </div>
                <div className="p-4 flex items-center justify-center text-sm text-muted-foreground">
                  <FeatureCell value={row.basic} />
                </div>
                <div className="p-4 flex items-center justify-center text-sm text-primary font-medium">
                  <FeatureCell value={row.pro} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="py-12 px-6 border-t border-border/50 bg-card/20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: <Shield className="size-6 text-primary" />, title: "Pago seguro", sub: "SSL + Stripe" },
            { icon: <Zap className="size-6 text-primary" />, title: "Activo al instante", sub: "Sin esperas" },
            { icon: <ArrowRight className="size-6 text-primary rotate-90" />, title: "Cancela fácil", sub: "Sin permanencia" },
            { icon: <Star className="size-6 text-yellow-400" />, title: "4.9 / 5 estrellas", sub: "Miles de gamers" },
          ].map(({ icon, title, sub }) => (
            <div key={title} className="flex flex-col items-center gap-2">
              {icon}
              <span className="font-semibold text-foreground text-sm">{title}</span>
              <span className="text-xs text-muted-foreground">{sub}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-10">
            <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 mb-4">
              <Zap className="size-3" /> FAQ
            </Badge>
            <h2 className="text-3xl font-bold text-foreground mb-2">Preguntas frecuentes</h2>
            <p className="text-muted-foreground text-sm">Todo lo que necesitas saber antes de empezar.</p>
          </div>

          <div className="space-y-3">
            {faqs.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA FINAL ─── */}
      <section className="py-20 px-6 relative overflow-hidden border-t border-border/50">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.76 0.19 196 / 8%), transparent)" }}
        />
        <div className="relative z-10 text-center max-w-xl mx-auto">
          <Gamepad2
            className="size-14 text-primary mx-auto mb-5"
            style={{ filter: "drop-shadow(0 0 20px oklch(0.76 0.19 196 / 60%))" }}
          />
          <h2 className="text-4xl font-bold text-foreground mb-3">
            ¿Listo para jugar?
          </h2>
          <p className="text-muted-foreground mb-8">
            Empieza gratis hoy. Sin tarjeta de crédito.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="glow-cyan px-10 text-base">
              <Link to="/register">
                <Play className="size-4 mr-2" />
                Crear cuenta gratis
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-base">
              <Link to="/login">
                Ya tengo cuenta
                <ArrowRight className="size-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
