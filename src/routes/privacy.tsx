import { useState, useRef, useCallback } from "react"
import { Lock, Database, Shield, Share2, Cookie, UserCheck, Clock, RefreshCw, Mail } from "lucide-react"

const sections = [
  {
    icon: Database,
    title: "Información que recopilamos",
    body: "Recopilamos información que nos proporcionas al crear tu cuenta (nombre, correo), datos de uso del servicio (sesiones de juego, duración, preferencias) y datos técnicos necesarios para el funcionamiento de la plataforma.",
  },
  {
    icon: Shield,
    title: "Cómo usamos tu información",
    body: "Utilizamos tu información para proveer y mejorar el servicio, gestionar tu cuenta y suscripción, enviarte comunicaciones relevantes, y garantizar la seguridad de la plataforma.",
  },
  {
    icon: Lock,
    title: "Almacenamiento y seguridad",
    body: "Tus datos se almacenan en servidores seguros con medidas estándar de la industria para protegerte contra acceso no autorizado, alteración o destrucción. Las contraseñas se almacenan de forma cifrada.",
  },
  {
    icon: Share2,
    title: "Compartir con terceros",
    body: "No vendemos ni alquilamos tu información personal. Solo compartimos datos con proveedores que nos asisten operativamente (procesadores de pago, infraestructura cloud), quienes están obligados a mantener confidencialidad.",
  },
  {
    icon: Cookie,
    title: "Cookies",
    body: "Usamos cookies para mantener tu sesión activa y mejorar tu experiencia. Puedes configurar tu navegador para rechazarlas, aunque esto puede afectar algunas funcionalidades del servicio.",
  },
  {
    icon: UserCheck,
    title: "Tus derechos",
    body: "Tienes derecho a acceder, corregir o eliminar tu información personal, y a solicitar la portabilidad de tus datos. Para ejercer estos derechos, contacta con nuestro equipo de soporte.",
  },
  {
    icon: Clock,
    title: "Retención de datos",
    body: "Conservamos tu información mientras tu cuenta esté activa. Si la eliminas, borraremos tus datos personales en un plazo de 30 días, salvo que la ley exija conservarlos por más tiempo.",
  },
  {
    icon: RefreshCw,
    title: "Cambios en esta política",
    body: "Podemos actualizar esta política periódicamente. Te notificaremos sobre cambios significativos por correo electrónico o mediante un aviso visible en la plataforma.",
  },
  {
    icon: Mail,
    title: "Contacto",
    body: "Para preguntas sobre privacidad o para ejercer tus derechos, contáctanos en privacidad@arcade.gg y te responderemos en un plazo de 48 horas hábiles.",
  },
]

export function PrivacyPage() {
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
            Política de{" "}
            <span className="text-accent" style={{ textShadow: "0 0 20px oklch(0.62 0.26 300 / 60%)" }}>
              Privacidad
            </span>
          </h1>
          <p className="text-muted-foreground text-base">
            Última actualización: marzo 2025 · Tu privacidad es nuestra prioridad.
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
