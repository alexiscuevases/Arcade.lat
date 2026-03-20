import { useState, useRef, useCallback, useEffect } from "react"
import { Headphones, Mail, MessageCircle, Book, Zap, Clock, ChevronRight, Send, CheckCircle } from "lucide-react"

const channels = [
  {
    icon: Mail,
    title: "Correo electrónico",
    desc: "Respuesta en menos de 24 horas hábiles.",
    action: "soporte@arcade.gg",
    href: "mailto:soporte@arcade.gg",
    badge: "24h",
  },
  {
    icon: MessageCircle,
    title: "Chat en vivo",
    desc: "Disponible de lunes a viernes, 9:00–18:00 (GMT-5).",
    action: "Abrir chat",
    href: "#chat",
    badge: "Rápido",
  },
  {
    icon: Book,
    title: "Documentación",
    desc: "Guías detalladas y tutoriales para sacar el máximo provecho.",
    action: "Ver guías",
    href: "/faq",
    badge: "Self-service",
  },
]

const topics = [
  "Problema técnico con el juego",
  "Problema con mi pago o factura",
  "Olvidé mi contraseña",
  "Quiero cancelar mi suscripción",
  "Solicitud de reembolso",
  "Error al iniciar sesión",
  "Otro",
]

const quickLinks = [
  { icon: Zap, label: "Primeros pasos con Arcade", href: "/faq" },
  { icon: Clock, label: "Estado del servicio", href: "#status" },
  { icon: Book, label: "Preguntas frecuentes", href: "/faq" },
  { icon: CheckCircle, label: "Política de reembolso", href: "/refund" },
]

const BG_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i * 6.33 + 7) % 100}%`,
  top: `${(i * 8.11 + 11) % 100}%`,
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



function ContactForm() {
  const [ref, visible] = useInView()
  const [submitted, setSubmitted] = useState(false)
  const [form, setForm] = useState({ name: "", email: "", topic: "", message: "" })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: "opacity 0.55s ease, transform 0.55s ease",
      }}
    >
      {submitted ? (
        <div className="gaming-card rounded-xl p-10 text-center space-y-4">
          <div className="flex justify-center">
            <div className="flex size-14 items-center justify-center rounded-full border border-primary/30 bg-primary/10">
              <CheckCircle className="size-7 text-primary" />
            </div>
          </div>
          <h3 className="text-xl font-semibold">¡Mensaje enviado!</h3>
          <p className="text-sm text-muted-foreground max-w-xs mx-auto">
            Hemos recibido tu solicitud. Te responderemos en menos de 24 horas hábiles.
          </p>
          <button
            onClick={() => { setSubmitted(false); setForm({ name: "", email: "", topic: "", message: "" }) }}
            className="text-xs text-primary hover:underline"
          >
            Enviar otro mensaje
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="gaming-card rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold mb-1">Envíanos un mensaje</h2>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Nombre</label>
              <input
                required
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                placeholder="Tu nombre"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/50"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Correo electrónico</label>
              <input
                required
                type="email"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="tu@correo.com"
                className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 transition-colors placeholder:text-muted-foreground/50"
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Tema</label>
            <select
              required
              value={form.topic}
              onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 transition-colors text-foreground"
            >
              <option value="" disabled>Selecciona un tema...</option>
              {topics.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Mensaje</label>
            <textarea
              required
              rows={5}
              value={form.message}
              onChange={e => setForm(f => ({ ...f, message: e.target.value }))}
              placeholder="Describe tu problema con el mayor detalle posible..."
              className="w-full bg-background border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary/60 transition-colors resize-none placeholder:text-muted-foreground/50"
            />
          </div>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
          >
            <Send className="size-3.5" />
            Enviar mensaje
          </button>
        </form>
      )}
    </div>
  )
}

export function SupportPage() {
  const [mouse, setMouse] = useState({ x: 50, y: 30 })
  const heroRef = useRef<HTMLDivElement>(null)
  const [channelsRef, channelsVisible] = useInView()
  const [linksRef, linksVisible] = useInView()

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
        className="relative pt-24 pb-16 flex flex-col items-center overflow-hidden px-6"
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        <div className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{ background: `radial-gradient(ellipse 55% 55% at ${mouse.x}% ${mouse.y}%, oklch(0.76 0.19 196 / 10%), transparent)` }} />
        <div className="absolute top-1/4 right-1/5 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(60px)", animation: "supportOrb1 11s ease-in-out infinite" }} />
        <div className="absolute bottom-0 left-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "supportOrb2 14s ease-in-out infinite" }} />

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
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium">
            <Headphones className="w-3.5 h-3.5" />
            Centro de soporte
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            ¿En qué podemos{" "}
            <span className="text-primary" style={{ textShadow: "0 0 24px oklch(0.76 0.19 196 / 60%)" }}>
              ayudarte?
            </span>
          </h1>
          <p className="text-muted-foreground text-base">
            Nuestro equipo está listo para resolver cualquier problema. Elige el canal que mejor te convenga.
          </p>
        </div>
      </section>

      {/* ─── CHANNELS ─── */}
      <section className="max-w-4xl mx-auto px-6 py-12">
        <div
          ref={channelsRef}
          className="grid sm:grid-cols-3 gap-4"
        >
          {channels.map((ch, i) => {
            const Icon = ch.icon
            return (
              <div
                key={i}
                style={{
                  opacity: channelsVisible ? 1 : 0,
                  transform: channelsVisible ? "translateY(0)" : "translateY(20px)",
                  transition: `opacity 0.5s ease ${i * 80}ms, transform 0.5s ease ${i * 80}ms`,
                }}
              >
                <a href={ch.href} className="gaming-card rounded-xl p-5 flex flex-col gap-4 hover:border-primary/40 transition-colors duration-200 group h-full block">
                  <div className="flex items-start justify-between">
                    <div className="flex size-10 items-center justify-center rounded-lg border border-primary/20 bg-primary/8 group-hover:bg-primary/15 transition-colors">
                      <Icon className="size-5 text-primary" />
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full border border-primary/20 text-primary/70 bg-primary/5">{ch.badge}</span>
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-sm font-semibold">{ch.title}</h3>
                    <p className="text-xs text-muted-foreground">{ch.desc}</p>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary mt-auto">
                    <span>{ch.action}</span>
                    <ChevronRight className="size-3" />
                  </div>
                </a>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── MAIN CONTENT ─── */}
      <section className="max-w-4xl mx-auto px-6 pb-24">
        <div className="grid lg:grid-cols-5 gap-8">
          {/* Form */}
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            <div
              ref={linksRef}
              style={{
                opacity: linksVisible ? 1 : 0,
                transform: linksVisible ? "translateX(0)" : "translateX(20px)",
                transition: "opacity 0.55s ease 100ms, transform 0.55s ease 100ms",
              }}
            >
              <h3 className="text-sm font-semibold mb-3">Accesos rápidos</h3>
              <div className="space-y-2">
                {quickLinks.map((l, i) => {
                  const Icon = l.icon
                  return (
                    <a
                      key={i}
                      href={l.href}
                      className="flex items-center gap-3 gaming-card rounded-lg p-3 hover:border-primary/30 transition-colors group"
                    >
                      <Icon className="size-4 text-primary shrink-0" />
                      <span className="text-sm text-muted-foreground group-hover:text-foreground transition-colors">{l.label}</span>
                      <ChevronRight className="size-3.5 text-muted-foreground ml-auto" />
                    </a>
                  )
                })}
              </div>
            </div>

            <div className="gaming-card rounded-xl p-5 border-primary/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-medium text-green-400">Sistemas operativos</span>
              </div>
              <p className="text-xs text-muted-foreground">Todos los servicios de Arcade funcionan con normalidad.</p>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        @keyframes supportOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-16px) translateX(10px); }
          70% { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes supportOrb2 {
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
