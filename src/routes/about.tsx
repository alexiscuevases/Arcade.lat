import { useState, useRef, useCallback, useEffect } from "react"
import { Gamepad2, Target, Zap, Globe, Users, Award, Heart, Rocket, Cpu, Shield } from "lucide-react"

const BG_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.77 + 5) % 100}%`,
  top: `${(i * 7.31 + 8) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 8 + (i % 5) * 1.2,
  delay: -((i % 7) * 0.9),
  opacity: 0.07 + (i % 4) * 0.04,
  color: i % 3 === 0 ? "oklch(0.76 0.19 196)" : "oklch(0.62 0.26 300)",
}))

const values = [
  { icon: Zap, title: "Rendimiento primero", body: "Cada milisegundo importa. Optimizamos constantemente nuestra infraestructura para ofrecer la menor latencia posible en cada sesión de juego." },
  { icon: Shield, title: "Seguridad y privacidad", body: "Tus datos y tu sesión de juego están protegidos con cifrado de extremo a extremo. Tu privacidad es una prioridad, no una opción." },
  { icon: Heart, title: "Comunidad ante todo", body: "Arcade nació de jugadores para jugadores. Escuchamos activamente a nuestra comunidad para construir la plataforma que siempre quisimos tener." },
  { icon: Globe, title: "Acceso universal", body: "Creemos que los mejores juegos deberían ser accesibles desde cualquier dispositivo, en cualquier lugar del mundo, sin importar el hardware." },
]

const milestones = [
  { year: "2022", event: "Fundación", desc: "Arcade nace con la visión de democratizar el cloud gaming en Latinoamérica." },
  { year: "2023", event: "Primera beta", desc: "Lanzamos nuestra beta privada con 500 jugadores y recibimos feedback increíble." },
  { year: "2024", event: "Lanzamiento público", desc: "Abrimos las puertas al público con más de 50 títulos disponibles." },
  { year: "2025", event: "Expansión global", desc: "Expandimos servidores a 3 regiones y superamos los 10,000 usuarios activos." },
]

const stats = [
  { icon: Users, value: "10K+", label: "Jugadores activos" },
  { icon: Gamepad2, value: "50+", label: "Juegos disponibles" },
  { icon: Cpu, value: "99.9%", label: "Uptime garantizado" },
  { icon: Award, value: "<20ms", label: "Latencia promedio" },
]

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



function ValueCard({ value, index }: { value: (typeof values)[number]; index: number }) {
  const [ref, visible] = useInView()
  const Icon = value.icon
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${index * 80}ms, transform 0.55s ease ${index * 80}ms`,
      }}
    >
      <div className="gaming-card hover:border-primary/50 rounded-xl p-6 flex flex-col gap-4 group h-full">
        <div className="flex size-11 items-center justify-center rounded-xl border border-primary/20 bg-primary/8 group-hover:bg-primary/15 group-hover:border-primary/40 transition-all duration-200 group-hover:shadow-[0_0_14px_oklch(0.76_0.19_196/20%)]">
          <Icon className="size-5 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="text-base font-semibold text-foreground">{value.title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{value.body}</p>
        </div>
      </div>
    </div>
  )
}

function StatCard({ stat, index }: { stat: (typeof stats)[number]; index: number }) {
  const [ref, visible] = useInView()
  const Icon = stat.icon
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ease ${index * 70}ms, transform 0.5s ease ${index * 70}ms`,
      }}
    >
      <div className="gaming-card rounded-xl p-6 text-center group hover:border-primary/40 transition-all duration-200">
        <div className="flex justify-center mb-3">
          <div className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/8">
            <Icon className="size-5 text-primary" />
          </div>
        </div>
        <div className="text-3xl font-bold text-primary" style={{ textShadow: "0 0 16px oklch(0.76 0.19 196 / 50%)" }}>
          {stat.value}
        </div>
        <div className="text-xs text-muted-foreground mt-1">{stat.label}</div>
      </div>
    </div>
  )
}

export function AboutPage() {
  const [mouse, setMouse] = useState({ x: 50, y: 30 })
  const heroRef = useRef<HTMLDivElement>(null)
  const [timelineRef, timelineVisible] = useInView(0.1)

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
        className="relative pt-24 pb-20 flex flex-col items-center overflow-hidden px-6"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{
            background: `radial-gradient(ellipse 55% 55% at ${mouse.x}% ${mouse.y}%, oklch(0.76 0.19 196 / 10%), transparent)`,
          }}
        />
        <div
          className="absolute top-1/4 right-1/5 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(70px)", animation: "aboutOrb1 11s ease-in-out infinite" }}
        />
        <div
          className="absolute bottom-0 left-1/6 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "aboutOrb2 14s ease-in-out infinite" }}
        />

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
            <Rocket className="w-3.5 h-3.5" />
            Nuestra historia
          </div>
          <h1 className="text-5xl sm:text-7xl font-bold tracking-tight">
            Acerca de{" "}
            <span className="text-primary" style={{ textShadow: "0 0 28px oklch(0.76 0.19 196 / 60%)" }}>
              Arcade
            </span>
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl mx-auto">
            Somos un equipo apasionado por los videojuegos construyendo el futuro del cloud gaming. Creemos que jugar a los mejores títulos no debería requerir hardware costoso.
          </p>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section className="max-w-4xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map((s, i) => <StatCard key={i} stat={s} index={i} />)}
        </div>
      </section>

      {/* ─── MISSION ─── */}
      <section className="max-w-3xl mx-auto px-6 py-12 space-y-4">
        <div className="text-center space-y-3 mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-primary/80 text-xs font-medium">
            <Target className="w-3 h-3" />
            Misión
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold">Nuestra misión</h2>
          <p className="text-muted-foreground leading-relaxed">
            Democratizar el acceso a los videojuegos de alta gama eliminando las barreras del hardware. Con Arcade, cualquier dispositivo se convierte en una consola de última generación.
          </p>
        </div>
      </section>

      {/* ─── VALUES ─── */}
      <section className="max-w-4xl mx-auto px-6 pb-20">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl font-bold">Nuestros valores</h2>
          <p className="text-muted-foreground text-sm">Los principios que guían cada decisión que tomamos.</p>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          {values.map((v, i) => <ValueCard key={i} value={v} index={i} />)}
        </div>
      </section>

      {/* ─── TIMELINE ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-24">
        <div className="text-center space-y-2 mb-12">
          <h2 className="text-3xl font-bold">Nuestra trayectoria</h2>
          <p className="text-muted-foreground text-sm">Hitos que marcaron el camino de Arcade.</p>
        </div>
        <div ref={timelineRef} className="relative pl-8 border-l border-border/50 space-y-10">
          {milestones.map((m, i) => (
            <div
              key={i}
              style={{
                opacity: timelineVisible ? 1 : 0,
                transform: timelineVisible ? "translateX(0)" : "translateX(-16px)",
                transition: `opacity 0.5s ease ${i * 100}ms, transform 0.5s ease ${i * 100}ms`,
              }}
              className="relative"
            >
              <div className="absolute -left-[2.15rem] top-1 w-3.5 h-3.5 rounded-full bg-primary border-2 border-background shadow-[0_0_8px_oklch(0.76_0.19_196/60%)]" />
              <div className="gaming-card rounded-lg p-4 hover:border-primary/40 transition-colors duration-200">
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-xs font-mono text-primary/70 tabular-nums">{m.year}</span>
                  <span className="text-sm font-semibold">{m.event}</span>
                </div>
                <p className="text-sm text-muted-foreground">{m.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        @keyframes aboutOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-18px) translateX(12px); }
          70% { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes aboutOrb2 {
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
