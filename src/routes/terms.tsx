import { useState, useRef, useCallback } from "react"
import { FileText, UserCheck, Ban, CreditCard, AlertTriangle, RefreshCw, Mail, Lock } from "lucide-react"

const sections = [
  {
    icon: FileText,
    title: "Aceptación de los términos",
    body: "Al acceder y utilizar Arcade Cloud Gaming, aceptas quedar vinculado por estos Términos de Servicio. Si no estás de acuerdo con alguno de estos términos, no debes utilizar nuestro servicio.",
  },
  {
    icon: FileText,
    title: "Descripción del servicio",
    body: "Arcade ofrece una plataforma de cloud gaming que permite a los usuarios jugar videojuegos en la nube mediante instancias virtuales. El servicio está sujeto a disponibilidad y puede verse afectado por factores técnicos fuera de nuestro control.",
  },
  {
    icon: UserCheck,
    title: "Cuentas de usuario",
    body: "Para utilizar el servicio debes crear una cuenta. Eres responsable de mantener la confidencialidad de tus credenciales de acceso y de todas las actividades que ocurran bajo tu cuenta. Notifícanos de inmediato si sospechas de uso no autorizado.",
  },
  {
    icon: Ban,
    title: "Uso aceptable",
    body: "Te comprometes a usar el servicio únicamente para fines legales. Está prohibido intentar acceder sin autorización a sistemas de Arcade, usar el servicio para actividades ilícitas, o interferir con el funcionamiento de la plataforma.",
  },
  {
    icon: CreditCard,
    title: "Pagos y facturación",
    body: "Los planes de pago se facturan según lo acordado al momento de la suscripción. Arcade se reserva el derecho de modificar los precios con previo aviso. Los reembolsos se evalúan caso por caso según nuestra política interna.",
  },
  {
    icon: AlertTriangle,
    title: "Limitación de responsabilidad",
    body: "Arcade no será responsable por daños indirectos, incidentales o consecuentes derivados del uso o imposibilidad de uso del servicio. La responsabilidad máxima se limita al importe pagado en los últimos 3 meses.",
  },
  {
    icon: RefreshCw,
    title: "Modificaciones",
    body: "Arcade puede modificar estos términos en cualquier momento. Los cambios entrarán en vigor al publicarse en esta página. El uso continuado del servicio tras dichos cambios implica tu aceptación.",
  },
  {
    icon: Mail,
    title: "Contacto",
    body: "Si tienes preguntas sobre estos términos, contáctanos en soporte@arcade.gg y te responderemos en un plazo de 48 horas hábiles.",
  },
]

export function TermsPage() {
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
            background: `radial-gradient(ellipse 55% 55% at ${mouse.x}% ${mouse.y}%, oklch(0.62 0.26 300 / 12%), transparent)`,
          }}
        />
        {/* Orbs */}
        <div
          className="absolute top-1/4 right-1/6 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 6%)", filter: "blur(60px)" }}
        />
        <div
          className="absolute bottom-0 left-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 5%)", filter: "blur(80px)" }}
        />

        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-accent/30 bg-accent/8 text-accent text-sm font-medium">
            <Lock className="w-3.5 h-3.5" />
            Legal · Arcade Cloud Gaming
          </div>
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight">
            Términos de{" "}
            <span className="text-accent" style={{ textShadow: "0 0 20px oklch(0.62 0.26 300 / 60%)" }}>
              Servicio
            </span>
          </h1>
          <p className="text-muted-foreground text-base">
            Última actualización: marzo 2025 · Lee con atención antes de usar la plataforma.
          </p>
        </div>
      </section>

      {/* ─── SECTIONS ─── */}
      <section className="max-w-3xl mx-auto px-6 py-20 space-y-3">
        {sections.map((section, i) => {
          const Icon = section.icon
          return (
            <div key={i} className="gaming-card rounded-lg p-5 flex gap-4 group">
              <div className="shrink-0 mt-0.5">
                <div className="flex size-9 items-center justify-center rounded-lg border border-accent/20 bg-accent/8 group-hover:bg-accent/15 group-hover:border-accent/40 transition-colors duration-200">
                  <Icon className="size-4 text-accent" />
                </div>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-accent/50 tabular-nums">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h2 className="text-sm font-semibold text-foreground">{section.title}</h2>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{section.body}</p>
              </div>
            </div>
          )
        })}
      </section>
    </div>
  )
}
