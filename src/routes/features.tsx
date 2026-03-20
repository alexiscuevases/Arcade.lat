import { useState, useRef, useCallback, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import {
  Zap, Globe, Crown, Gamepad2, Cloud, Shield, Cpu, Wifi,
  Monitor, Save, Headphones, Play, ArrowRight, Check,
  ChevronRight, Layers, RefreshCw, Lock,
} from "lucide-react"

// ─── Data ──────────────────────────────────────────────────────────────────────

const mainFeatures = [
  {
    icon: Zap,
    color: "primary",
    title: "Juega al instante",
    desc: "Sin instalaciones. Sin esperas. Haz click en un juego y en segundos estás dentro. La GPU vive en nuestra nube.",
    highlights: ["Inicio en < 10 segundos", "Cero espacio en disco", "Sin actualizaciones manuales"],
  },
  {
    icon: Globe,
    color: "accent",
    title: "Cualquier dispositivo",
    desc: "PC, Mac, tablet, smartphone, Smart TV. Si tiene navegador, tienes una consola de última generación.",
    highlights: ["Compatible con Chrome, Firefox, Safari", "iOS y Android", "Smart TV y Chromebook"],
  },
  {
    icon: Crown,
    color: "primary",
    title: "Calidad Pro",
    desc: "Hasta 4K@60fps con el plan Pro. Hardware de última generación siempre disponible, sin pagar miles de dólares.",
    highlights: ["Resolución hasta 4K", "60 fps estables", "HDR disponible"],
  },
  {
    icon: Wifi,
    color: "accent",
    title: "Baja latencia",
    desc: "Infraestructura optimizada para input lag mínimo. Menos de 20ms en la mayoría de regiones.",
    highlights: ["< 20ms latencia media", "Servidores regionales", "Adaptive streaming"],
  },
  {
    icon: Save,
    color: "primary",
    title: "Guardado en la nube",
    desc: "Tu progreso siempre seguro y sincronizado. Retoma exactamente donde lo dejaste desde cualquier dispositivo.",
    highlights: ["Guardado automático", "Sincronización instantánea", "Historial de partidas"],
  },
  {
    icon: Gamepad2,
    color: "accent",
    title: "Soporte de mandos",
    desc: "Usa tu controlador favorito. Compatible con los gamepads más populares sin configuración adicional.",
    highlights: ["Xbox, PlayStation, Switch Pro", "Gamepads USB genéricos", "Teclado y ratón"],
  },
]

const howItWorks = [
  {
    step: "01",
    icon: Cloud,
    title: "Elige un juego",
    desc: "Explora el catálogo de más de 100 títulos y haz click en el que quieras jugar. Disponible en todos los planes.",
  },
  {
    step: "02",
    icon: Cpu,
    title: "Instanciamos tu GPU",
    desc: "En segundos, asignamos una instancia de GPU de última generación exclusivamente para ti en nuestra infraestructura.",
  },
  {
    step: "03",
    icon: Wifi,
    title: "Streaming en tiempo real",
    desc: "El juego corre en nuestros servidores y te llega vía streaming de alta calidad. Tu input viaja de vuelta al instante.",
  },
  {
    step: "04",
    icon: Save,
    title: "Guarda y vuelve",
    desc: "Al terminar la sesión, tu progreso queda guardado en la nube. La próxima vez retomas exactamente donde lo dejaste.",
  },
]

const techSpecs = [
  { label: "Resolución máxima", value: "4K (3840×2160)" },
  { label: "Framerate", value: "Hasta 60 fps" },
  { label: "Latencia objetivo", value: "< 20ms" },
  { label: "Códec de video", value: "H.264 / H.265 / AV1" },
  { label: "Bitrate máximo", value: "50 Mbps" },
  { label: "Internet mínimo", value: "10 Mbps (720p)" },
  { label: "Internet recomendado", value: "25 Mbps (1080p)" },
  { label: "Internet 4K", value: "50 Mbps" },
  { label: "GPU de servidor", value: "NVIDIA RTX 4000 series" },
  { label: "VRAM", value: "16 GB dedicados" },
  { label: "Uptime", value: "99.9% garantizado" },
  { label: "Regiones de servidor", value: "NA · EU · LATAM" },
]

const vsItems = [
  { feature: "Sin hardware costoso", arcade: true, traditional: false },
  { feature: "Inicio instantáneo", arcade: true, traditional: false },
  { feature: "Cualquier dispositivo", arcade: true, traditional: false },
  { feature: "Actualizaciones automáticas", arcade: true, traditional: false },
  { feature: "Guardado en la nube", arcade: true, traditional: true },
  { feature: "Resolución 4K", arcade: true, traditional: true },
  { feature: "Sin espacio en disco", arcade: true, traditional: false },
  { feature: "Cero instalaciones", arcade: true, traditional: false },
]

const BG_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.71 + 5) % 100}%`,
  top: `${(i * 7.83 + 9) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 8 + (i % 5) * 1.2,
  delay: -((i % 7) * 0.9),
  opacity: 0.07 + (i % 4) * 0.04,
  color: i % 3 === 0 ? "oklch(0.76 0.19 196)" : "oklch(0.62 0.26 300)",
}))

// ─── Hooks ─────────────────────────────────────────────────────────────────────

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

// ─── Components ────────────────────────────────────────────────────────────────



function FeatureCard({ feat, index }: { feat: (typeof mainFeatures)[number]; index: number }) {
  const [ref, visible] = useInView()
  const Icon = feat.icon
  const isPrimary = feat.color === "primary"

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.55s ease ${index * 80}ms, transform 0.55s ease ${index * 80}ms`,
      }}
    >
      <div
        className={`gaming-card rounded-xl p-6 flex flex-col gap-5 h-full group relative overflow-hidden transition-all duration-300 ${isPrimary ? "hover:border-primary/50" : "hover:border-accent/50"}`}
      >
        {/* Top glow sweep */}
        <div
          className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          style={{
            background: isPrimary
              ? "linear-gradient(90deg, transparent, oklch(0.76 0.19 196 / 60%), transparent)"
              : "linear-gradient(90deg, transparent, oklch(0.62 0.26 300 / 60%), transparent)",
          }}
        />

        <div
          className={`flex size-12 items-center justify-center rounded-xl border transition-all duration-200 ${
            isPrimary
              ? "border-primary/20 bg-primary/8 group-hover:bg-primary/15 group-hover:border-primary/40 group-hover:shadow-[0_0_16px_oklch(0.76_0.19_196/20%)]"
              : "border-accent/20 bg-accent/8 group-hover:bg-accent/15 group-hover:border-accent/40 group-hover:shadow-[0_0_16px_oklch(0.62_0.26_300/20%)]"
          }`}
        >
          <Icon className={`size-5 ${isPrimary ? "text-primary" : "text-accent"}`} />
        </div>

        <div className="space-y-2 flex-1">
          <h3 className="text-base font-semibold">{feat.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{feat.desc}</p>
        </div>

        <ul className="space-y-1.5 pt-1 border-t border-border/50">
          {feat.highlights.map((h) => (
            <li key={h} className="flex items-center gap-2 text-xs text-muted-foreground">
              <Check className={`size-3 shrink-0 ${isPrimary ? "text-primary" : "text-accent"}`} />
              {h}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

function HowItWorksStep({ step, index }: { step: (typeof howItWorks)[number]; index: number }) {
  const [ref, visible] = useInView()
  const Icon = step.icon
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.5s ease ${index * 100}ms, transform 0.5s ease ${index * 100}ms`,
      }}
      className="relative"
    >
      {/* Connector line (not on last) */}
      {index < howItWorks.length - 1 && (
        <div className="hidden lg:block absolute top-6 left-[calc(50%+2.5rem)] right-[-calc(50%-2.5rem)] h-px bg-border/50" />
      )}

      <div className="flex flex-col items-center text-center gap-4">
        <div className="relative">
          <div className="flex size-12 items-center justify-center rounded-xl border border-primary/25 bg-primary/8 group-hover:bg-primary/15 transition-colors">
            <Icon className="size-5 text-primary" />
          </div>
          <span className="absolute -top-2 -right-2 text-[10px] font-mono font-bold text-primary/60 bg-background border border-primary/20 rounded px-1">
            {step.step}
          </span>
        </div>
        <div className="space-y-1.5">
          <h3 className="text-sm font-semibold">{step.title}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px] mx-auto">{step.desc}</p>
        </div>
      </div>
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function FeaturesPage() {
  const [mouse, setMouse] = useState({ x: 50, y: 30 })
  const heroRef = useRef<HTMLDivElement>(null)
  const [specsRef, specsVisible] = useInView(0.08)
  const [vsRef, vsVisible] = useInView(0.08)

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  return (
    <div className="overflow-x-hidden">
      

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative pt-28 pb-20 flex flex-col items-center overflow-hidden px-6"
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
          className="absolute top-1/4 left-1/6 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(70px)", animation: "featOrb1 10s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-0 right-1/6 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "featOrb2 13s ease-in-out infinite" }}
        />

        {/* Particles */}
        {BG_PARTICLES.map((p) => (
          <div
            key={p.id}
            className="absolute rounded-full pointer-events-none"
            style={{
              left: p.left, top: p.top,
              width: `${p.size}px`, height: `${p.size}px`,
              background: p.color, opacity: p.opacity,
              animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }}
          />
        ))}

        <div className="relative z-10 text-center max-w-3xl mx-auto space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium">
            <Layers className="w-3.5 h-3.5" />
            Características de la plataforma
          </div>

          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight leading-[0.95]">
            Todo lo que{" "}
            <span
              className="text-primary"
              style={{ textShadow: "0 0 32px oklch(0.76 0.19 196 / 60%)" }}
            >
              necesitas
            </span>
            <br />
            para jugar
          </h1>

          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Arcade reúne tecnología de punta para ofrecerte la mejor experiencia de cloud gaming. Sin compromisos, sin hardware caro.
          </p>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
            >
              <Play className="size-4 fill-current" />
              Empezar gratis
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center justify-center gap-2 px-7 py-3 rounded-lg border border-border text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
            >
              Ver planes
              <ChevronRight className="size-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── MAIN FEATURES GRID ─── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {mainFeatures.map((feat, i) => (
            <FeatureCard key={feat.title} feat={feat} index={i} />
          ))}
        </div>
      </section>

      {/* ─── HOW IT WORKS ─── */}
      <section className="border-y border-border/50 bg-card/20 py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center space-y-3 mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary/80 text-xs font-medium">
              <RefreshCw className="w-3 h-3" />
              Cómo funciona
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold">De cero a jugando en segundos</h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              El proceso completo ocurre automáticamente. Tú solo eliges el juego.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {howItWorks.map((step, i) => (
              <HowItWorksStep key={step.step} step={step} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* ─── EXTRA FEATURES LIST ─── */}
      <section className="max-w-4xl mx-auto px-6 py-20">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold">Más de lo que imaginas</h2>
          <p className="text-muted-foreground text-sm">Funciones adicionales incluidas en todos los planes.</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-x-12 gap-y-5">
          {[
            { icon: Shield, text: "Sesiones cifradas de extremo a extremo" },
            { icon: Save, text: "Guardado automático al finalizar cada partida" },
            { icon: Headphones, text: "Audio envolvente en tiempo real" },
            { icon: Monitor, text: "Soporte multimónitopara escritorios" },
            { icon: Lock, text: "Protección de cuenta con 2FA" },
            { icon: Gamepad2, text: "Hasta 4 perfiles de mando simultáneos" },
            { icon: Wifi, text: "Reconexión automática ante caídas de red" },
            { icon: Cloud, text: "Sin ocupar espacio en tu dispositivo" },
            { icon: RefreshCw, text: "Juegos siempre en su última versión" },
            { icon: Globe, text: "Interfaz en múltiples idiomas" },
          ].map(({ icon: Icon, text }, i) => {
            const isPrimary = i % 2 === 0
            return (
              <div key={text} className="flex items-center gap-3 py-1.5">
                <div
                  className={`flex size-7 items-center justify-center rounded-lg border shrink-0 ${
                    isPrimary ? "border-primary/20 bg-primary/8" : "border-accent/20 bg-accent/8"
                  }`}
                >
                  <Icon className={`size-3.5 ${isPrimary ? "text-primary" : "text-accent"}`} />
                </div>
                <span className="text-sm text-muted-foreground">{text}</span>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── VS TRADITIONAL ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-20">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl font-bold">Arcade vs. Gaming tradicional</h2>
          <p className="text-muted-foreground text-sm">¿Por qué cloud gaming es el futuro?</p>
        </div>

        <div
          ref={vsRef}
          className="gaming-card rounded-xl overflow-hidden"
          style={{
            opacity: vsVisible ? 1 : 0,
            transform: vsVisible ? "translateY(0)" : "translateY(24px)",
            transition: "opacity 0.55s ease, transform 0.55s ease",
          }}
        >
          {/* Header */}
          <div className="grid grid-cols-3 border-b border-border/60 bg-card/40">
            <div className="px-5 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Característica</div>
            <div className="px-5 py-3 text-xs font-semibold text-primary text-center uppercase tracking-wider border-x border-border/60">
              Arcade
            </div>
            <div className="px-5 py-3 text-xs font-semibold text-muted-foreground text-center uppercase tracking-wider">PC / Consola</div>
          </div>
          {vsItems.map((item, i) => (
            <div
              key={item.feature}
              style={{
                opacity: vsVisible ? 1 : 0,
                transition: `opacity 0.4s ease ${i * 50 + 100}ms`,
              }}
              className={`grid grid-cols-3 border-b border-border/30 last:border-0 ${i % 2 === 0 ? "" : "bg-card/20"}`}
            >
              <div className="px-5 py-3 text-sm text-muted-foreground">{item.feature}</div>
              <div className="px-5 py-3 flex justify-center border-x border-border/40 bg-primary/4">
                {item.arcade ? (
                  <Check className="size-4 text-primary" />
                ) : (
                  <span className="text-muted-foreground/40 text-xs">—</span>
                )}
              </div>
              <div className="px-5 py-3 flex justify-center">
                {item.traditional ? (
                  <Check className="size-4 text-muted-foreground/60" />
                ) : (
                  <span className="text-muted-foreground/40 text-xs">—</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── TECH SPECS ─── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl font-bold">Especificaciones técnicas</h2>
          <p className="text-muted-foreground text-sm">Los números detrás de la experiencia.</p>
        </div>

        <div
          ref={specsRef}
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3"
        >
          {techSpecs.map((spec, i) => (
            <div
              key={spec.label}
              style={{
                opacity: specsVisible ? 1 : 0,
                transform: specsVisible ? "translateY(0)" : "translateY(16px)",
                transition: `opacity 0.45s ease ${i * 50}ms, transform 0.45s ease ${i * 50}ms`,
              }}
            >
              <div className="gaming-card rounded-lg px-4 py-3 flex items-center justify-between gap-4 hover:border-primary/30 transition-colors duration-200">
                <span className="text-xs text-muted-foreground">{spec.label}</span>
                <span className="text-xs font-mono font-semibold text-primary tabular-nums shrink-0">{spec.value}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="max-w-2xl mx-auto px-6 pb-28 text-center">
        <div className="gaming-card rounded-2xl p-10 space-y-6 relative overflow-hidden">
          {/* Background glow */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 70% 70% at 50% 50%, oklch(0.76 0.19 196 / 6%), transparent)" }}
          />
          <div className="relative z-10 space-y-4">
            <div className="flex justify-center">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10">
                <Zap className="size-7 text-primary" style={{ filter: "drop-shadow(0 0 8px oklch(0.76 0.19 196 / 80%))" }} />
              </div>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold">Pruébalo gratis hoy</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Sin tarjeta de crédito. Sin descargas. Empieza a jugar en menos de un minuto.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Link
                to="/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
              >
                <Play className="size-4 fill-current" />
                Crear cuenta gratis
              </Link>
              <Link
                to="/pricing"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 rounded-lg border border-border text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors"
              >
                Ver planes
                <ArrowRight className="size-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes featOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-18px) translateX(12px); }
          70% { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes featOrb2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          35% { transform: translateY(16px) translateX(-14px); }
          65% { transform: translateY(-10px) translateX(10px); }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-14px) translateX(8px) scale(1.2); }
          50% { transform: translateY(-5px) translateX(-9px) scale(0.9); }
          75% { transform: translateY(11px) translateX(4px) scale(1.1); }
        }
      `}</style>
    </div>
  )
}
