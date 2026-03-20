import { useState, useRef, useCallback, useEffect } from "react"
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
  Sparkles,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Separator } from "@/shared/components/ui/separator"
import { api } from "@/shared/lib/api"
import { isAuthenticated } from "@/shared/lib/auth"

// ─── Constants ────────────────────────────────────────────────────────────────

const HERO_PARTICLES = Array.from({ length: 24 }, (_, i) => ({
  id: i,
  left: `${(i * 4.13 + 6) % 100}%`,
  top: `${(i * 6.47 + 9) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 7 + (i % 6) * 1.2,
  delay: -((i % 8) * 0.7),
  opacity: 0.09 + (i % 5) * 0.05,
  color: i % 3 === 0 ? "oklch(0.62 0.26 300)" : "oklch(0.76 0.19 196)",
}))

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
    accentColor: "oklch(0.50 0.03 265)",
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
    accentColor: "oklch(0.76 0.19 196)",
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
    accentColor: "oklch(0.76 0.19 196)",
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
  { label: "Cancelación", free: "N/A", basic: "Cuando quieras", pro: "Cuando quieras", icon: <Shield className="size-3.5" /> },
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

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])

  return [ref, visible] as const
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function FeatureCell({ value, highlight }: { value: FeatureValue; highlight?: boolean }) {
  if (typeof value === "boolean") {
    return value ? (
      <Check className={`size-4 mx-auto ${highlight ? "text-primary" : "text-green-400/70"}`} />
    ) : (
      <X className="size-4 text-muted-foreground/30 mx-auto" />
    )
  }
  return (
    <span className={`text-xs text-center block ${highlight ? "text-primary font-medium" : ""}`}>
      {value}
    </span>
  )
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div
      className={`gaming-card overflow-hidden cursor-pointer select-none transition-all duration-300 ${open ? "border-primary/30" : ""}`}
      onClick={() => setOpen((v) => !v)}
    >
      <div className="flex items-center justify-between gap-4 p-5">
        <span className="font-medium text-foreground text-sm">{q}</span>
        <ChevronDown
          className={`size-4 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? "rotate-180 text-primary" : ""}`}
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

type PlanId = "FREE" | "BASIC" | "PRO"

function PlanCard({
  plan,
  price,
  period,
  yearly,
  saving,
  onCta,
  delay,
}: {
  plan: (typeof plans)[number]
  price: number
  period: string
  yearly: boolean
  saving: number
  onCta: (id: PlanId) => void
  delay: number
}) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 10
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 10
    setTilt({ x, y })
  }

  return (
    <Reveal delay={delay} className="h-full">
      <div
        ref={cardRef}
        onMouseMove={handleMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false) }}
        className={`relative rounded-xl border flex flex-col h-full transition-colors duration-300 cursor-default ${
          plan.highlight
            ? "border-primary/40 bg-primary/4"
            : "border-border/60 bg-card hover:border-border"
        }`}
        style={{
          transform: `perspective(800px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
          transition: tilt.x === 0 ? "transform 0.4s ease, box-shadow 0.3s ease, border-color 0.3s ease" : "transform 0.1s ease",
          boxShadow: plan.highlight
            ? `0 0 ${hovered ? 60 : 40}px oklch(0.76 0.19 196 / ${hovered ? 18 : 10}%)`
            : hovered
            ? `0 0 30px oklch(0.76 0.19 196 / 6%)`
            : "none",
        }}
      >
        {/* Top accent line */}
        {plan.highlight && (
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary to-transparent" />
        )}

        {/* Hover inner glow */}
        <div
          className="absolute inset-0 rounded-xl pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(ellipse 70% 40% at 50% 0%, oklch(0.76 0.19 196 / 8%), transparent)`,
            opacity: hovered ? 1 : 0,
          }}
        />

        {/* Popular badge */}
        {plan.badge && (
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-10">
            <span
              className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full bg-primary text-background text-xs font-bold shadow-lg"
              style={{ animation: "popBadge 0.4s ease backwards" }}
            >
              <Sparkles className="size-3" />
              {plan.badge}
            </span>
          </div>
        )}

        <div className="p-6 flex-1 flex flex-col relative z-10">
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
              <span
                key={`${plan.id}-${price}`}
                className={`text-4xl font-bold ${plan.highlight ? "text-primary" : "text-foreground"}`}
                style={{ animation: "priceFlip 0.35s ease backwards" }}
              >
                ${price}
              </span>
              <span className="text-muted-foreground text-sm mb-1.5">{period}</span>
            </div>
            <div style={{ minHeight: "1.25rem" }}>
              {yearly && plan.monthlyPrice > 0 && (
                <p
                  className="text-xs text-green-400 mt-1"
                  style={{ animation: "priceFlip 0.35s ease 0.1s backwards" }}
                >
                  Ahorras ${saving}/año
                </p>
              )}
            </div>
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
                    className={`size-4 shrink-0 ${plan.highlight ? "text-primary" : "text-green-400/80"}`}
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
            onClick={() => onCta(plan.id)}
          >
            {plan.id !== "FREE" && <Zap className="size-4 mr-1.5" />}
            {plan.cta}
          </Button>
        </div>
      </div>
    </Reveal>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function PricingPage() {
  const navigate = useNavigate()
  const authed = isAuthenticated()
  const [yearly, setYearly] = useState(false)
  const [mouse, setMouse] = useState({ x: 50, y: 30 })
  const [hoveredCol, setHoveredCol] = useState<string | null>(null)
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

  function handleCta(id: PlanId) {
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
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(60px)", animation: "floatOrb1 9s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-0 right-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "floatOrb2 11s ease-in-out infinite" }}
        />

        {/* Particles */}
        {HERO_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              background: p.color,
              opacity: p.opacity,
              animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
          />
        ))}

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
            <span className={`text-sm transition-colors duration-200 ${!yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Mensual
            </span>
            <button
              onClick={() => setYearly((v) => !v)}
              className="relative w-12 h-6 rounded-full transition-colors duration-300 focus:outline-none"
              style={{
                background: yearly ? "oklch(0.76 0.19 196)" : "oklch(0.20 0.025 265)",
                boxShadow: yearly ? "0 0 12px oklch(0.76 0.19 196 / 50%)" : "none",
                transition: "background 0.3s ease, box-shadow 0.3s ease",
              }}
            >
              <span
                className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform duration-300 shadow"
                style={{ transform: yearly ? "translateX(24px)" : "translateX(0)" }}
              />
            </button>
            <span className={`text-sm flex items-center gap-1.5 transition-colors duration-200 ${yearly ? "text-foreground font-medium" : "text-muted-foreground"}`}>
              Anual
              <span
                className="px-1.5 py-0.5 rounded text-xs font-bold border transition-all duration-300"
                style={{
                  background: yearly ? "oklch(0.76 0.19 196 / 20%)" : "oklch(0.76 0.19 196 / 10%)",
                  color: "oklch(0.76 0.19 196)",
                  borderColor: "oklch(0.76 0.19 196 / 30%)",
                  boxShadow: yearly ? "0 0 8px oklch(0.76 0.19 196 / 30%)" : "none",
                }}
              >
                −25%
              </span>
            </span>
          </div>
        </div>
      </section>

      {/* ─── PLAN CARDS ─── */}
      <section className="py-20 px-6 relative">
        {/* Section glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 50% at 50% 30%, oklch(0.76 0.19 196 / 4%), transparent)" }}
        />

        <div className="max-w-5xl mx-auto grid gap-6 md:grid-cols-3 relative z-10">
          {plans.map((plan, idx) => {
            const price = yearly ? plan.yearlyPrice : plan.monthlyPrice
            const period = yearly ? "/mes · facturado anual" : "/mes"
            const saving = (plan.monthlyPrice - plan.yearlyPrice) * 12

            return (
              <PlanCard
                key={plan.id}
                plan={plan}
                price={price}
                period={period}
                yearly={yearly}
                saving={saving}
                onCta={handleCta}
                delay={idx * 100}
              />
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
          <Reveal>
            <div className="text-center mb-10">
              <h2 className="text-3xl font-bold text-foreground mb-2">Comparativa completa</h2>
              <p className="text-muted-foreground text-sm">Todo lo que incluye cada plan, lado a lado.</p>
            </div>
          </Reveal>

          <Reveal delay={100}>
            <div className="rounded-xl border border-border/50 overflow-hidden bg-card">
              {/* Table header */}
              <div className="grid grid-cols-4 bg-card/60 border-b border-border/50">
                <div className="p-4 text-sm font-medium text-muted-foreground">Característica</div>
                {plans.map((p) => (
                  <div
                    key={p.id}
                    onMouseEnter={() => setHoveredCol(p.id)}
                    onMouseLeave={() => setHoveredCol(null)}
                    className={`p-4 text-center text-sm font-bold cursor-default transition-colors duration-200 ${
                      p.highlight ? "text-primary" : "text-foreground"
                    } ${hoveredCol === p.id ? "bg-primary/5" : ""}`}
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
                  className={`grid grid-cols-4 border-b border-border/40 last:border-0 transition-colors duration-150 ${i % 2 === 0 ? "" : "bg-white/1"}`}
                >
                  <div className="p-4 flex items-center gap-2 text-sm text-muted-foreground">
                    <span className="text-muted-foreground/60">{row.icon}</span>
                    {row.label}
                  </div>
                  {(["FREE", "BASIC", "PRO"] as const).map((planId) => {
                    const val = planId === "FREE" ? row.free : planId === "BASIC" ? row.basic : row.pro
                    const isHighlightedPlan = planId === "PRO"
                    const isHovered = hoveredCol === planId
                    return (
                      <div
                        key={planId}
                        onMouseEnter={() => setHoveredCol(planId)}
                        onMouseLeave={() => setHoveredCol(null)}
                        className={`p-4 flex items-center justify-center text-sm transition-colors duration-200 ${
                          isHighlightedPlan ? "text-primary font-medium" : "text-muted-foreground"
                        } ${isHovered ? "bg-primary/5" : ""}`}
                      >
                        <FeatureCell value={val} highlight={isHighlightedPlan} />
                      </div>
                    )
                  })}
                </div>
              ))}
            </div>
          </Reveal>
        </div>
      </section>

      {/* ─── TRUST BADGES ─── */}
      <section className="py-12 px-6 border-t border-border/50 bg-card/20">
        <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {[
            { icon: <Shield className="size-6 text-primary" />, title: "Pago seguro", sub: "SSL + Stripe", delay: 0 },
            { icon: <Zap className="size-6 text-primary" />, title: "Activo al instante", sub: "Sin esperas", delay: 80 },
            { icon: <ArrowRight className="size-6 text-primary rotate-90" />, title: "Cancela fácil", sub: "Sin permanencia", delay: 160 },
            { icon: <Star className="size-6 text-yellow-400" />, title: "4.9 / 5 estrellas", sub: "Miles de gamers", delay: 240 },
          ].map(({ icon, title, sub, delay }) => (
            <Reveal key={title} delay={delay}>
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-card border border-border/50 flex items-center justify-center mb-1 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_0_16px_oklch(0.76_0.19_196/12%)]">
                  {icon}
                </div>
                <span className="font-semibold text-foreground text-sm">{title}</span>
                <span className="text-xs text-muted-foreground">{sub}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-20 px-6 border-t border-border/50">
        <div className="max-w-2xl mx-auto">
          <Reveal>
            <div className="text-center mb-10">
              <Badge className="bg-primary/10 text-primary border-primary/20 gap-1 mb-4">
                <Zap className="size-3" /> FAQ
              </Badge>
              <h2 className="text-3xl font-bold text-foreground mb-2">Preguntas frecuentes</h2>
              <p className="text-muted-foreground text-sm">Todo lo que necesitas saber antes de empezar.</p>
            </div>
          </Reveal>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <Reveal key={faq.q} delay={i * 60}>
                <FaqItem q={faq.q} a={faq.a} />
              </Reveal>
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
        <Reveal className="relative z-10 text-center max-w-xl mx-auto">
          {/* Pulsing rings */}
          <div className="relative w-20 h-20 mx-auto mb-6">
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                className="absolute rounded-full border border-primary/20"
                style={{
                  inset: `-${ring * 14}px`,
                  animation: "pulseRing 2.4s ease-out infinite",
                  animationDelay: `${ring * 0.6}s`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <Gamepad2
                className="size-12 text-primary"
                style={{ filter: "drop-shadow(0 0 20px oklch(0.76 0.19 196 / 70%))" }}
              />
            </div>
          </div>

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
        </Reveal>
      </section>

      {/* ─── KEYFRAMES ─── */}
      <style>{`
        @keyframes floatOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-22px) translateX(12px); }
          70% { transform: translateY(12px) translateX(-8px); }
        }
        @keyframes floatOrb2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          35% { transform: translateY(18px) translateX(-14px); }
          65% { transform: translateY(-12px) translateX(10px); }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-16px) translateX(9px) scale(1.2); }
          50% { transform: translateY(-6px) translateX(-11px) scale(0.9); }
          75% { transform: translateY(13px) translateX(5px) scale(1.1); }
        }
        @keyframes pulseRing {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes priceFlip {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes popBadge {
          from { opacity: 0; transform: translateX(-50%) scale(0.7); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  )
}
