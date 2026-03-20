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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { api } from "@/lib/api"

const GENRES = ["Battle Royale", "RPG de Acción", "FPS Táctico", "Mundo Abierto", "Sandbox"]

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
      {val}
      {suffix}
    </span>
  )
}

type GameItem = { id: string; title: string; genre: string; players: string; gradient: string }

function GameCard({ game }: { game: GameItem }) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 })
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
      onMouseLeave={() => setTilt({ x: 0, y: 0 })}
      className="gaming-card group relative overflow-hidden cursor-pointer select-none"
      style={{
        transform: `perspective(600px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: tilt.x === 0 ? "transform 0.4s ease" : "transform 0.1s ease",
      }}
    >
      {/* Gradient background */}
      <div className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-25 group-hover:opacity-40 transition-opacity duration-300`} />

      {/* Glow on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        style={{ background: "radial-gradient(ellipse 80% 80% at 50% 0%, oklch(0.76 0.19 196 / 15%), transparent)" }}
      />

      <div className="relative p-4">
        <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${game.gradient} mb-3 flex items-center justify-center shadow-lg`}>
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

export function LandingPage() {
  const typed = useTypingEffect(GENRES)
  const [mouse, setMouse] = useState({ x: 50, y: 50 })
  const { data: gamesData } = useQuery({ queryKey: ["games"], queryFn: api.games.list })
  const heroRef = useRef<HTMLDivElement>(null)

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
        <div className="absolute top-1/4 left-1/6 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(60px)", animation: "float1 8s ease-in-out infinite" }} />
        <div className="absolute bottom-1/4 right-1/6 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "float2 10s ease-in-out infinite" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 3%)", filter: "blur(100px)" }} />

        {/* Content */}
        <div className="relative z-10 text-center max-w-5xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium mb-8">
            <Zap className="w-3.5 h-3.5" />
            Cloud Gaming · Sin descargas · Desde el navegador
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-7xl md:text-8xl font-bold leading-[0.9] mb-6 tracking-tight">
            <span className="text-foreground">Juega</span>
            <br />
            <span className="text-primary text-glow inline-block min-w-[2ch]">{typed}</span>
            <span
              className="text-primary"
              style={{ animation: "blink 1s step-end infinite" }}
            >|</span>
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
      <section className="border-y border-border/50 bg-card/30 backdrop-blur-sm py-8">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { icon: <Gamepad2 className="w-5 h-5" />, value: 100, suffix: "+", label: "Juegos" },
            { icon: <Monitor className="w-5 h-5" />, value: 4, suffix: "K", label: "Resolución máx." },
            { icon: <Wifi className="w-5 h-5" />, value: 20, suffix: "ms", label: "Latencia objetivo" },
            { icon: <Cpu className="w-5 h-5" />, value: 99, suffix: "%", label: "Uptime garantizado" },
          ].map(({ icon, value, suffix, label }) => (
            <div key={label} className="flex flex-col items-center gap-2">
              <div className="text-primary mb-1">{icon}</div>
              <div className="text-3xl font-bold text-foreground">
                <AnimatedCounter to={value} suffix={suffix} />
              </div>
              <div className="text-sm text-muted-foreground">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─────────────────── FEATURES ─────────────────── */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Gaming sin límites
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto">
              Tecnología de punta para que solo pienses en jugar.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: <Zap className="w-7 h-7 text-primary" />,
                title: "Juega al instante",
                desc: "Sin descargas ni instalaciones. Haz click en cualquier juego y empieza en segundos. La GPU está en la nube.",
                glow: "glow-border-cyan",
              },
              {
                icon: <Globe className="w-7 h-7 text-accent" />,
                title: "Cualquier dispositivo",
                desc: "PC, Mac, tablet, móvil, Smart TV. Si tiene navegador, puedes jugar. Sin requisitos de hardware.",
                glow: "",
              },
              {
                icon: <Crown className="w-7 h-7 text-primary" />,
                title: "Calidad máxima",
                desc: "Hasta 4K y 60fps con tu plan Pro. Hardware de última generación disponible siempre para ti.",
                glow: "",
              },
            ].map(({ icon, title, desc, glow }) => (
              <div key={title} className={`gaming-card p-6 ${glow}`}>
                <div className="w-12 h-12 rounded-xl bg-card flex items-center justify-center mb-4 border border-border/50">
                  {icon}
                </div>
                <h3 className="font-bold text-foreground text-lg mb-2">{title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─────────────────── GAME GRID ─────────────────── */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 60% 40% at 50% 50%, oklch(0.62 0.26 300 / 5%), transparent)" }} />

        <div className="max-w-5xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Tu librería te espera
            </h2>
            <p className="text-muted-foreground text-lg">
              Más de <span className="text-primary font-medium">100 juegos</span> incluidos en todos los planes.
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-8">
            {(gamesData?.games ?? []).map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
            {/* Extra placeholder card */}
            <div className="gaming-card p-4 flex flex-col items-center justify-center gap-2 opacity-50 cursor-default">
              <div className="text-2xl font-bold text-primary">+91</div>
              <p className="text-xs text-muted-foreground text-center">juegos más</p>
            </div>
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

      {/* ─────────────────── PRICING TEASER ─────────────────── */}
      <section className="py-24 px-6 border-t border-border/50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
              Gratis para empezar.
              <br />
              <span className="text-primary text-glow">Pro para dominar.</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              {
                name: "Free",
                price: "$0",
                features: ["1h por día", "Calidad 720p", "Cola estándar"],
                highlight: false,
                icon: <Gamepad2 className="w-5 h-5" />,
              },
              {
                name: "Basic",
                price: "$9",
                features: ["10h por día", "Calidad 1080p", "Cola prioritaria"],
                highlight: false,
                icon: <Zap className="w-5 h-5" />,
              },
              {
                name: "Pro",
                price: "$29",
                features: ["Tiempo ilimitado", "Calidad 4K", "Cola top priority"],
                highlight: true,
                icon: <Crown className="w-5 h-5" />,
              },
            ].map(({ name, price, features, highlight, icon }) => (
              <div
                key={name}
                className={`gaming-card p-6 relative ${highlight ? "glow-border-cyan" : ""}`}
              >
                {highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-background text-xs font-bold">
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
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse 70% 60% at 50% 50%, oklch(0.76 0.19 196 / 8%), transparent)" }} />
        <div className="relative z-10 text-center max-w-2xl mx-auto">
          <Gamepad2 className="w-16 h-16 text-primary mx-auto mb-6 glow-cyan" style={{ filter: "drop-shadow(0 0 20px oklch(0.76 0.19 196 / 60%))" }} />
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
        </div>
      </section>

      {/* ─────────────────── FOOTER ─────────────────── */}
      <footer className="border-t border-border/50 py-10 px-6">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Gamepad2 className="w-5 h-5 text-primary" />
            <span className="font-bold text-foreground">Arcade</span>
            <span className="text-muted-foreground text-sm ml-1">Cloud Gaming</span>
          </div>
          <nav className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/login" className="hover:text-foreground transition-colors">Login</Link>
            <Link to="/register" className="hover:text-foreground transition-colors">Registro</Link>
            <Link to="/pricing" className="hover:text-foreground transition-colors">Precios</Link>
          </nav>
          <p className="text-xs text-muted-foreground">© 2025 Arcade. Todos los derechos reservados.</p>
        </div>
      </footer>

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
      `}</style>
    </div>
  )
}
