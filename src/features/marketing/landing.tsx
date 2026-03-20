import { useState, useEffect, useRef, useCallback } from "react"
import { Link } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import {
  Gamepad2,
  Zap,
  Globe,
  Monitor,
  Play,
  ChevronRight,
  Cpu,
  Crown,
  Check,
  ArrowRight,
  Wifi,
  Users,
  Radio,
} from "lucide-react"
import { Button } from "@/shared/components/ui/button"
import { api } from "@/shared/lib/api"

// ─── Constants (stable, defined outside component) ───────────────────────────

const GENRES = ["Battle Royale", "RPG de Acción", "FPS Táctico", "Mundo Abierto", "Sandbox"]

const HERO_PARTICLES = Array.from({ length: 30 }, (_, i) => ({
  id: i,
  left: `${(i * 3.61 + 5) % 100}%`,
  top: `${(i * 5.83 + 8) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 7 + (i % 7) * 1.1,
  delay: -((i % 9) * 0.65),
  opacity: 0.10 + (i % 6) * 0.05,
  color: i % 3 === 0 ? "oklch(0.62 0.26 300)" : "oklch(0.76 0.19 196)",
}))

const MARQUEE_ITEMS = [
  "Battle Royale", "✦", "FPS Táctico", "✦", "RPG de Acción", "✦",
  "Mundo Abierto", "✦", "Sandbox", "✦", "MOBA", "✦", "Survival Horror",
  "✦", "Racing", "✦", "Strategy", "✦", "Adventure", "✦", "Roguelike",
  "✦", "Fighter", "✦", "Stealth", "✦", "Shooter", "✦",
]

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useTypingEffect(words: string[]) {
  const [index, setIndex] = useState(0)
  const [display, setDisplay] = useState("")
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const word = words[index]
    const delay = deleting ? 45 : display.length === word.length ? 1800 : 90

    const t = setTimeout(() => {
      if (!deleting) {
        if (display.length < word.length) {
          setDisplay(word.slice(0, display.length + 1))
        } else {
          setDeleting(true)
        }
      } else {
        if (display.length > 0) {
          setDisplay(word.slice(0, display.length - 1))
        } else {
          setDeleting(false)
          setIndex((i) => (i + 1) % words.length)
        }
      }
    }, delay)

    return () => clearTimeout(t)
  }, [display, deleting, index, words])

  return display
}

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

function useLiveCounter(base: number) {
  const [count, setCount] = useState(base)

  useEffect(() => {
    const t = setInterval(() => {
      setCount((c) => {
        const delta = Math.floor(Math.random() * 4 + 1) * (Math.random() > 0.45 ? 1 : -1)
        return Math.max(base - 30, Math.min(base + 30, c + delta))
      })
    }, 2600)
    return () => clearInterval(t)
  }, [base])

  return count
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function AnimatedCounter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  const ref = useRef<HTMLSpanElement>(null)
  const started = useRef(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true
          let start = 0
          const step = Math.ceil(to / 60)
          const t = setInterval(() => {
            start = Math.min(start + step, to)
            setVal(start)
            if (start >= to) clearInterval(t)
          }, 16)
        }
      },
      { threshold: 0.5 },
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [to])

  return (
    <span ref={ref}>
      {val}{suffix}
    </span>
  )
}

function Reveal({
  children,
  delay = 0,
  className = "",
  direction = "up",
}: {
  children: React.ReactNode
  delay?: number
  className?: string
  direction?: "up" | "left" | "right"
}) {
  const [ref, visible] = useInView()
  const translate =
    direction === "up" ? "translateY(28px)" :
    direction === "left" ? "translateX(-28px)" :
    "translateX(28px)"

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translate(0,0)" : translate,
        transition: `opacity 0.65s ease ${delay}ms, transform 0.65s ease ${delay}ms`,
      }}
    >
      {children}
    </div>
  )
}

function MarqueeStrip() {
  return (
    <div className="py-3 border-y border-border/30 overflow-hidden select-none">
      <div
        style={{
          whiteSpace: "nowrap",
          display: "inline-block",
          animation: "marquee 28s linear infinite",
        }}
      >
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span
            key={i}
            className={
              item === "✦"
                ? "text-primary/60 mx-5 text-xs"
                : "text-muted-foreground/40 text-xs font-medium tracking-widest uppercase mx-5"
            }
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  )
}

type GameItem = { id: string; title: string; genre: string; players: string; gradient: string }

function GameCard({ game }: { game: GameItem }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
  const [hovered, setHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = cardRef.current?.getBoundingClientRect()
    if (!rect) return
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16
    const y = -((e.clientY - rect.top) / rect.height - 0.5) * 16
    setTilt({ x, y })
  }

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setTilt({ x: 0, y: 0 }); setHovered(false) }}
      className="gaming-card group relative overflow-hidden cursor-pointer select-none"
      style={{
        transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: tilt.x === 0 ? "transform 0.4s ease" : "transform 0.1s ease",
      }}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-linear-to-br ${game.gradient} opacity-25 group-hover:opacity-45 transition-opacity duration-300`} />

      {/* Glow on hover */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 0%, oklch(0.76 0.19 196 / 15%), transparent)" }}
      />

      {/* Play overlay */}
      <div
        className="absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-200"
        style={{ opacity: hovered ? 1 : 0 }}
      >
        <div
          className="w-10 h-10 rounded-full bg-primary/90 flex items-center justify-center shadow-lg"
          style={{
            boxShadow: "0 0 20px oklch(0.76 0.19 196 / 60%)",
            transform: hovered ? "scale(1)" : "scale(0.7)",
            transition: "transform 0.2s ease",
          }}
        >
          <Play className="w-4 h-4 text-background fill-background ml-0.5" />
        </div>
      </div>

      <div className="relative p-4">
        <div className={`w-10 h-10 rounded-lg bg-linear-to-br ${game.gradient} mb-3 flex items-center justify-center shadow-lg`}>
          <Gamepad2 className="w-5 h-5 text-white" />
        </div>
        <h3 className="font-bold text-foreground text-sm mb-0.5">{game.title}</h3>
        <p className="text-xs text-muted-foreground">{game.genre}</p>
        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
          <Users className="w-3 h-3" />
          <span>{game.players}</span>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ─────────────────────────────────────────────────────────────────

export function LandingPage() {
  const typed = useTypingEffect(GENRES)
  const [mouse, setMouse] = useState({ x: 50, y: 50 })
  const { data: gamesData } = useQuery({ queryKey: ["games"], queryFn: api.games.list })
  const heroRef = useRef<HTMLDivElement>(null)
  const liveCount = useLiveCounter(1247)

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
      {/* ─────────────────── HERO ─────────────────── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative min-h-[92svh] flex flex-col items-center justify-center overflow-hidden px-6"
      >
        {/* Grid background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Mouse-following glow */}
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{
            background: `radial-gradient(ellipse 50% 50% at ${mouse.x}% ${mouse.y}%, oklch(0.76 0.19 196 / 14%), transparent)`,
          }}
        />

        {/* Floating orbs */}
        <div
          className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(60px)", animation: "float1 8s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-1/4 right-1/6 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "float2 10s ease-in-out infinite" }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 3%)", filter: "blur(100px)" }}
        />


        {/* Floating particles */}
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

        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge row */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium">
              <Zap className="w-3.5 h-3.5" />
              Cloud Gaming · Sin descargas · Desde el navegador
            </div>
            {/* Live players counter */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/8 text-green-400 text-xs font-medium">
              <Radio className="w-3 h-3" style={{ animation: "pulseIcon 2s ease-in-out infinite" }} />
              <span
                style={{
                  fontVariantNumeric: "tabular-nums",
                  transition: "all 0.4s ease",
                  display: "inline-block",
                  minWidth: "4ch",
                }}
              >
                {liveCount.toLocaleString()}
              </span>
              jugando ahora
            </div>
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold leading-[0.9] mb-6 tracking-tight">
            <span className="text-foreground">Juega</span>
            <br />
            <span className="text-primary text-glow inline-block min-w-[2ch]">{typed}</span>
            <span className="text-primary" style={{ animation: "blink 1s step-end infinite" }}>|</span>
            <br />
            <span className="text-foreground">ahora mismo</span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg sm:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Streaming de juegos AAA en hasta <span className="text-foreground font-medium">4K</span>. Sin hardware caro.
            Sin esperas. Solo haz click y juega desde cualquier dispositivo.
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="glow-cyan text-base px-8 h-13 min-w-48">
              <Link to="/register">
                <Play className="w-4 h-4 mr-2" />
                Empezar Gratis
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 h-13 min-w-48">
              <Link to="/pricing">
                Ver Planes
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>

          {/* Social proof */}
          <p className="mt-8 text-sm text-muted-foreground">
            <span className="text-foreground font-medium">Sin tarjeta de crédito</span> · Plan Free disponible · Cancela cuando quieras
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground/50">
          <div className="w-5 h-8 rounded-full border border-current flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-current" style={{ animation: "scrollDot 1.5s ease-in-out infinite" }} />
          </div>
        </div>
      </section>

      {/* ─────────────────── STATS ─────────────────── */}
      <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm py-10">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: <Gamepad2 className="w-5 h-5" />, value: 100, suffix: "+", label: "Juegos" },
            { icon: <Monitor className="w-5 h-5" />, value: 4, suffix: "K", label: "Resolución máx." },
            { icon: <Wifi className="w-5 h-5" />, value: 20, suffix: "ms", label: "Latencia objetivo" },
            { icon: <Cpu className="w-5 h-5" />, value: 99, suffix: "%", label: "Uptime garantizado" },
          ].map(({ icon, value, suffix, label }, idx) => (
            <Reveal key={label} delay={idx * 80}>
              <div className="flex flex-col items-center gap-2">
                <div className="text-primary mb-1">{icon}</div>
                <div className="text-3xl font-bold text-foreground">
                  <AnimatedCounter to={value} suffix={suffix} />
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
                <StatBar />
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Gaming sin límites
              </h2>
              <p className="text-muted-foreground text-lg max-w-xl mx-auto">
                Tecnología de punta para que solo pienses en jugar.
              </p>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-7 h-7 text-primary" />,
                title: "Juega al instante",
                desc: "Sin descargas ni instalaciones. Haz click en cualquier juego y empieza en segundos. La GPU está en la nube.",
                glow: "glow-border-cyan",
                delay: 0,
              },
              {
                icon: <Globe className="w-7 h-7 text-accent" />,
                title: "Cualquier dispositivo",
                desc: "PC, Mac, tablet, móvil, Smart TV. Si tiene navegador, puedes jugar. Sin requisitos de hardware.",
                glow: "",
                delay: 120,
              },
              {
                icon: <Crown className="w-7 h-7 text-primary" />,
                title: "Calidad máxima",
                desc: "Hasta 4K y 60fps con tu plan Pro. Hardware de última generación disponible siempre para ti.",
                glow: "",
                delay: 240,
              },
            ].map(({ icon, title, desc, glow, delay }) => (
              <Reveal key={title} delay={delay}>
                <div className={`gaming-card p-6 h-full group ${glow}`}>
                  <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center mb-4 border border-border/50 transition-all duration-300 group-hover:border-primary/40 group-hover:shadow-[0_0_20px_oklch(0.76_0.19_196/15%)]">
                    {icon}
                  </div>
                  <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── GAME GRID ─────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.62 0.26 300 / 5%), transparent)" }}
        />

        <div className="max-w-5xl mx-auto relative z-10">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Tu librería te espera
              </h2>
              <p className="text-muted-foreground text-lg">
                Más de <span className="text-primary font-medium">100 juegos</span> incluidos en todos los planes.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
            {(gamesData?.games ?? []).map((game, idx) => (
              <Reveal key={game.id} delay={idx * 40}>
                <GameCard game={game} />
              </Reveal>
            ))}
            {/* Extra placeholder card */}
            <Reveal>
              <div className="gaming-card p-4 flex flex-col items-center justify-center gap-2 opacity-50 cursor-default h-full">
                <div className="text-2xl font-bold text-primary">+91</div>
                <p className="text-xs text-muted-foreground text-center">juegos más</p>
              </div>
            </Reveal>
          </div>

          <div className="text-center">
            <Button asChild variant="outline" className="glow-border-cyan">
              <Link to="/register">
                Ver toda la librería
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────── MARQUEE ─────────────────── */}
      <MarqueeStrip />

      {/* ─────────────────── PRICING TEASER ─────────────────── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <Reveal>
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Gratis para empezar.
                <br />
                <span className="text-primary text-glow">Pro para dominar.</span>
              </h2>
            </div>
          </Reveal>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: "Free",
                price: "$0",
                features: ["1h por día", "Calidad 720p", "Cola estándar"],
                highlight: false,
                icon: <Gamepad2 className="w-5 h-5" />,
                delay: 0,
              },
              {
                name: "Basic",
                price: "$9",
                features: ["10h por día", "Calidad 1080p", "Cola prioritaria"],
                highlight: false,
                icon: <Zap className="w-5 h-5" />,
                delay: 100,
              },
              {
                name: "Pro",
                price: "$29",
                features: ["Tiempo ilimitado", "Calidad 4K", "Cola top priority"],
                highlight: true,
                icon: <Crown className="w-5 h-5" />,
                delay: 200,
              },
            ].map(({ name, price, features, highlight, icon, delay }) => (
              <Reveal key={name} delay={delay}>
                <div className={`gaming-card p-6 relative h-full group transition-all duration-300 ${highlight ? "glow-border-cyan" : "hover:border-border"}`}>
                  {highlight && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-background text-xs font-bold" style={{ animation: "popBadge 0.4s ease backwards" }}>
                      POPULAR
                    </div>
                  )}
                  <div className={`flex items-center gap-2 mb-4 ${highlight ? "text-primary" : "text-muted-foreground"}`}>
                    {icon}
                    <span className="font-bold text-foreground">{name}</span>
                  </div>
                  <div className="text-3xl font-bold text-foreground mb-1">
                    {price}
                    <span className="text-sm font-normal text-muted-foreground">/mes</span>
                  </div>
                  <ul className="mt-4 space-y-2">
                    {features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className={`w-3.5 h-3.5 shrink-0 ${highlight ? "text-primary" : "text-muted-foreground"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </Reveal>
            ))}
          </div>

          <div className="text-center">
            <Button asChild size="lg" className="glow-cyan px-10">
              <Link to="/pricing">
                Ver todos los planes
                <ChevronRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ─────────────────── CTA FINAL ─────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.76 0.19 196 / 8%), transparent)" }}
        />
        <Reveal className="relative z-10 text-center max-w-2xl mx-auto">
          {/* Pulsing rings + icon */}
          <div className="relative w-24 h-24 mx-auto mb-8">
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                className="absolute rounded-full border border-primary/25"
                style={{
                  inset: `-${ring * 16}px`,
                  animation: `pulseRing 2.4s ease-out infinite`,
                  animationDelay: `${ring * 0.6}s`,
                }}
              />
            ))}
            <div className="absolute inset-0 flex items-center justify-center">
              <Gamepad2
                className="w-14 h-14 text-primary"
                style={{ filter: "drop-shadow(0 0 24px oklch(0.76 0.19 196 / 70%))" }}
              />
            </div>
          </div>

          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            ¿Listo para jugar?
          </h2>
          <p className="text-muted-foreground text-lg mb-8">
            Crea tu cuenta gratis y empieza a jugar en segundos.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="glow-cyan px-10 text-base">
              <Link to="/register">
                <Play className="w-4 h-4 mr-2" />
                Crear cuenta gratis
              </Link>
            </Button>
            <Button asChild variant="ghost" size="lg" className="text-base">
              <Link to="/login">
                Ya tengo cuenta
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </Reveal>
      </section>

      {/* ─────────────────── KEYFRAMES ─────────────────── */}
      <style>{`
        @keyframes float1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-15px); }
        }
        @keyframes float2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          33% { transform: translateY(15px) translateX(-10px); }
          66% { transform: translateY(-10px) translateX(20px); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
        }
        @keyframes scrollDot {
          0% { transform: translateY(0); opacity: 1; }
          100% { transform: translateY(12px); opacity: 0; }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-18px) translateX(10px) scale(1.2); }
          50% { transform: translateY(-8px) translateX(-12px) scale(0.9); }
          75% { transform: translateY(14px) translateX(6px) scale(1.1); }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes pulseRing {
          0% { opacity: 0.6; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.6); }
        }
        @keyframes pulseIcon {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.85); }
        }
        @keyframes popBadge {
          from { opacity: 0; transform: translateX(-50%) scale(0.7); }
          to { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  )
}

// ─── Stat bar (self-contained animated bar) ───────────────────────────────────
function StatBar() {
  const [ref, visible] = useInView(0.5)
  return (
    <div ref={ref} className="w-12 h-0.5 rounded-full bg-border/50 overflow-hidden mt-1">
      <div
        className="h-full rounded-full bg-primary"
        style={{
          width: visible ? "100%" : "0%",
          transition: "width 1.2s ease 0.3s",
          boxShadow: "0 0 6px oklch(0.76 0.19 196 / 60%)",
        }}
      />
    </div>
  )
}
