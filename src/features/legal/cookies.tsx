import { useState, useRef, useCallback, useEffect } from "react"
import { Cookie, BarChart2, Settings, ShieldCheck, ToggleLeft, Mail, Lock } from "lucide-react"

const sections = [
  {
    icon: Cookie,
    title: "¿Qué son las cookies?",
    body: "Las cookies son pequeños archivos de texto que los sitios web almacenan en tu navegador. Permiten que el sitio recuerde información sobre tu visita, como preferencias de idioma, sesión iniciada y configuración de la plataforma.",
  },
  {
    icon: ShieldCheck,
    title: "Cookies estrictamente necesarias",
    body: "Estas cookies son esenciales para el funcionamiento de Arcade. Incluyen cookies de sesión de autenticación, preferencias de seguridad y variables de estado necesarias para operar la plataforma. No pueden desactivarse.",
  },
  {
    icon: BarChart2,
    title: "Cookies analíticas",
    body: "Usamos cookies analíticas para entender cómo los usuarios interactúan con nuestra plataforma. Esta información nos ayuda a mejorar la experiencia de juego y detectar problemas técnicos. Los datos se recopilan de forma agregada y anónima.",
  },
  {
    icon: Settings,
    title: "Cookies de preferencias",
    body: "Estas cookies recuerdan tus preferencias dentro de Arcade, como el tema visual (claro/oscuro), el idioma seleccionado, la calidad de streaming preferida y la disposición de la interfaz.",
  },
  {
    icon: ToggleLeft,
    title: "Control de cookies",
    body: "Puedes controlar y gestionar las cookies desde la configuración de tu navegador. Ten en cuenta que deshabilitar ciertas cookies puede afectar la funcionalidad de la plataforma. Las cookies necesarias no pueden rechazarse.",
  },
  {
    icon: Cookie,
    title: "Cookies de terceros",
    body: "Algunos servicios integrados en Arcade (como procesadores de pago y servicios de análisis) pueden establecer sus propias cookies. Estas cookies están sujetas a las políticas de privacidad de los respectivos terceros.",
  },
  {
    icon: ShieldCheck,
    title: "Duración de las cookies",
    body: "Las cookies de sesión se eliminan al cerrar el navegador. Las cookies persistentes tienen duraciones variables: las de autenticación duran hasta 30 días, las de preferencias hasta 1 año, y las analíticas hasta 2 años.",
  },
  {
    icon: Mail,
    title: "Más información",
    body: "Si tienes preguntas sobre nuestro uso de cookies o deseas ejercer tus derechos relacionados con el procesamiento de datos, contáctanos en privacidad@arcade.gg.",
  },
]

const BG_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i * 6.23 + 7) % 100}%`,
  top: `${(i * 8.41 + 10) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 8 + (i % 5) * 1.2,
  delay: -((i % 7) * 0.9),
  opacity: 0.07 + (i % 4) * 0.04,
  color: i % 3 === 0 ? "oklch(0.76 0.19 196)" : "oklch(0.62 0.26 300)",
}))

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

function ScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const handler = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
  return (
    <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-border/20 pointer-events-none">
      <div
        className="h-full bg-accent transition-[width] duration-75"
        style={{ width: `${progress}%`, boxShadow: "0 0 8px oklch(0.62 0.26 300 / 70%)" }}
      />
    </div>
  )
}

function SectionCard({ section, index }: { section: (typeof sections)[number]; index: number }) {
  const [ref, visible] = useInView()
  const Icon = section.icon
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateX(0)" : "translateX(-20px)",
        transition: `opacity 0.55s ease ${index * 60}ms, transform 0.55s ease ${index * 60}ms`,
      }}
    >
      <div className="gaming-card hover:border-accent rounded-lg p-5 flex gap-4 group relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-accent scale-y-0 group-hover:scale-y-100 origin-top transition-transform duration-300" />
        <div className="shrink-0 mt-0.5">
          <div className="flex size-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/8 group-hover:bg-accent/15 group-hover:border-accent/40 transition-all duration-200 group-hover:shadow-[0_0_12px_oklch(0.62_0.26_300/20%)]">
            <Icon className="size-4 text-accent" />
          </div>
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-accent/50 tabular-nums group-hover:text-accent/80 transition-colors duration-200">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
        </div>
      </div>
    </div>
  )
}

export function CookiesPage() {
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

  return (
    <div className="overflow-x-hidden">
      

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative pt-20 pb-14 flex flex-col items-center overflow-hidden px-6"
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        <div className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{ background: `radial-gradient(ellipse 55% 55% at ${mouse.x}% ${mouse.y}%, oklch(0.62 0.26 300 / 12%), transparent)` }} />
        <div className="absolute top-1/4 right-1/6 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 6%)", filter: "blur(60px)", animation: "legalOrb1 10s ease-in-out infinite" }} />
        <div className="absolute bottom-0 left-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 5%)", filter: "blur(80px)", animation: "legalOrb2 13s ease-in-out infinite" }} />

        {BG_PARTICLES.map((p) => (
          <div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{
              left: p.left, top: p.top,
              width: `${p.size}px`, height: `${p.size}px`,
              background: p.color, opacity: p.opacity,
              animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }} />
        ))}

        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/8 text-accent text-sm font-medium">
            <Lock className="w-3.5 h-3.5" />
            Legal · Arcade Cloud Gaming
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Política de{" "}
            <span className="text-accent" style={{ textShadow: "0 0 20px oklch(0.62 0.26 300 / 60%)" }}>
              Cookies
            </span>
          </h1>
          <p className="text-muted-foreground text-base">
            Última actualización: marzo 2025 · Información sobre cómo usamos las cookies en nuestra plataforma.
          </p>
        </div>
      </section>

      {/* ─── SECTIONS ─── */}
      <section className="max-w-3xl mx-auto px-6 py-20 space-y-3">
        {sections.map((section, i) => (
          <SectionCard key={i} section={section} index={i} />
        ))}
      </section>

      <style>{`
        @keyframes legalOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-16px) translateX(10px); }
          70% { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes legalOrb2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          35% { transform: translateY(14px) translateX(-12px); }
          65% { transform: translateY(-8px) translateX(10px); }
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
