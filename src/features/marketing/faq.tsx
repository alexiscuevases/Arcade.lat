import { useState, useRef, useCallback, useEffect } from "react"
import { HelpCircle, ChevronDown, Gamepad2, CreditCard, Wifi, Settings, Shield, Zap } from "lucide-react"

const categories = [
  {
    icon: Gamepad2,
    label: "Juegos",
    items: [
      {
        q: "¿Qué juegos están disponibles en Arcade?",
        a: "Arcade cuenta con más de 50 títulos AAA disponibles, incluyendo los últimos lanzamientos y clásicos populares. El catálogo se actualiza mensualmente con nuevos juegos.",
      },
      {
        q: "¿Puedo jugar en cualquier dispositivo?",
        a: "Sí. Arcade funciona en PC, Mac, tablet y smartphones. Solo necesitas un navegador moderno y una conexión a internet estable. No se requiere instalación de software.",
      },
      {
        q: "¿Cuánto tiempo puedo jugar al día?",
        a: "Depende de tu plan. El plan Free incluye 2 horas diarias, Basic 6 horas, y Pro incluye sesiones ilimitadas con prioridad de cola.",
      },
      {
        q: "¿Hay latencia en los juegos?",
        a: "Nuestra infraestructura está optimizada para ofrecer menos de 20ms de latencia en la mayoría de regiones. La experiencia es comparable a jugar de forma local.",
      },
    ],
  },
  {
    icon: CreditCard,
    label: "Pagos",
    items: [
      {
        q: "¿Qué métodos de pago aceptan?",
        a: "Aceptamos tarjetas de crédito y débito (Visa, Mastercard, American Express), PayPal y transferencias bancarias en algunos países.",
      },
      {
        q: "¿Puedo cancelar mi suscripción en cualquier momento?",
        a: "Sí, puedes cancelar cuando quieras desde tu panel de facturación. El acceso al plan continúa hasta el final del período ya pagado.",
      },
      {
        q: "¿Ofrecen factura o comprobante fiscal?",
        a: "Sí, enviamos comprobante de pago automáticamente al correo registrado. Para facturas fiscales, contáctanos en soporte@arcade.gg.",
      },
      {
        q: "¿Hay descuento por pago anual?",
        a: "Sí, el plan anual incluye un 20% de descuento respecto al precio mensual. Puedes cambiar entre planes desde la sección de facturación.",
      },
    ],
  },
  {
    icon: Wifi,
    label: "Conexión",
    items: [
      {
        q: "¿Qué velocidad de internet necesito?",
        a: "Recomendamos mínimo 10 Mbps para 720p y 25 Mbps para 1080p a 60fps. Para 4K necesitas al menos 50 Mbps con baja latencia.",
      },
      {
        q: "¿Funciona con Wi-Fi o necesito cable?",
        a: "Funciona con ambos. Sin embargo, para una experiencia óptima en juegos competitivos recomendamos conexión por cable Ethernet para minimizar la variación de latencia.",
      },
      {
        q: "¿Puedo usar mi controlador o gamepad?",
        a: "Sí, los controladores más comunes son compatibles nativamente: Xbox, PlayStation, y la mayoría de gamepads USB. Algunos requieren configuración manual.",
      },
    ],
  },
  {
    icon: Shield,
    label: "Cuenta y seguridad",
    items: [
      {
        q: "¿Es seguro mi método de pago?",
        a: "Todos los pagos se procesan mediante proveedores certificados PCI-DSS. Arcade nunca almacena los datos completos de tu tarjeta.",
      },
      {
        q: "¿Puedo compartir mi cuenta?",
        a: "Las cuentas son personales e intransferibles. Compartir credenciales puede resultar en la suspensión de la cuenta según nuestros términos de servicio.",
      },
      {
        q: "Olvidé mi contraseña, ¿qué hago?",
        a: "Usa la opción 'Olvidé mi contraseña' en la pantalla de inicio de sesión. Recibirás un correo con instrucciones para restablecerla en minutos.",
      },
    ],
  },
  {
    icon: Settings,
    label: "Técnico",
    items: [
      {
        q: "¿Por qué el juego se ve borroso o tiene cortes?",
        a: "Esto suele deberse a variaciones en la conexión. Intenta reducir la calidad de streaming temporalmente en Configuración, o comprueba que no haya otras aplicaciones consumiendo ancho de banda.",
      },
      {
        q: "¿Cómo guardo mi progreso?",
        a: "El progreso se guarda automáticamente en la nube al finalizar cada sesión. Puedes retomar desde donde lo dejaste en cualquier dispositivo.",
      },
      {
        q: "El juego no carga, ¿qué hago?",
        a: "Primero verifica tu conexión. Si el problema persiste, prueba en otro navegador o borra la caché. Si continúa, contáctanos en soporte@arcade.gg.",
      },
    ],
  },
]

const BG_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i * 6.13 + 6) % 100}%`,
  top: `${(i * 8.72 + 9) % 100}%`,
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



function FaqItem({ question, answer, index }: { question: string; answer: string; index: number }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="gaming-card rounded-lg overflow-hidden hover:border-primary/30 transition-colors duration-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left group"
      >
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-primary/50 tabular-nums shrink-0">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span className="text-sm font-medium text-foreground">{question}</span>
        </div>
        <ChevronDown
          className="size-4 text-muted-foreground shrink-0 transition-transform duration-300"
          style={{ transform: open ? "rotate(180deg)" : "rotate(0deg)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-[max-height] duration-300 ease-in-out"
        style={{ maxHeight: open ? "200px" : "0px" }}
      >
        <p className="px-5 pb-4 pl-14 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </div>
  )
}

function CategorySection({ cat, sectionIndex }: { cat: (typeof categories)[number]; sectionIndex: number }) {
  const [ref, visible] = useInView()
  const Icon = cat.icon
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${sectionIndex * 80}ms, transform 0.55s ease ${sectionIndex * 80}ms`,
      }}
      className="space-y-3"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="flex size-8 items-center justify-center rounded-lg border border-primary/20 bg-primary/8">
          <Icon className="size-4 text-primary" />
        </div>
        <h2 className="text-base font-semibold">{cat.label}</h2>
      </div>
      <div className="space-y-2">
        {cat.items.map((item, i) => (
          <FaqItem key={i} question={item.q} answer={item.a} index={i} />
        ))}
      </div>
    </div>
  )
}

export function FaqPage() {
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
        className="relative pt-24 pb-16 flex flex-col items-center overflow-hidden px-6"
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
        <div className="absolute top-1/4 right-1/5 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(60px)", animation: "faqOrb1 10s ease-in-out infinite" }} />
        <div className="absolute bottom-0 left-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "faqOrb2 13s ease-in-out infinite" }} />

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
            <HelpCircle className="w-3.5 h-3.5" />
            Preguntas frecuentes
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            ¿Tienes{" "}
            <span className="text-primary" style={{ textShadow: "0 0 24px oklch(0.76 0.19 196 / 60%)" }}>
              dudas?
            </span>
          </h1>
          <p className="text-muted-foreground text-base">
            Encontrarás respuesta a las preguntas más comunes sobre Arcade. Si no encuentras lo que buscas, nuestro equipo de soporte está aquí para ayudarte.
          </p>
        </div>
      </section>

      {/* ─── FAQ SECTIONS ─── */}
      <section className="max-w-3xl mx-auto px-6 pb-24 space-y-12">
        {categories.map((cat, i) => (
          <CategorySection key={i} cat={cat} sectionIndex={i} />
        ))}

        {/* Still have questions */}
        <div className="gaming-card rounded-xl p-8 text-center border-primary/20">
          <Zap className="size-8 text-primary mx-auto mb-3" />
          <h3 className="text-lg font-semibold mb-2">¿No encontraste tu respuesta?</h3>
          <p className="text-sm text-muted-foreground mb-5">
            Nuestro equipo de soporte responde en menos de 24 horas hábiles.
          </p>
          <a
            href="/support"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan"
          >
            Contactar soporte
          </a>
        </div>
      </section>

      <style>{`
        @keyframes faqOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-16px) translateX(10px); }
          70% { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes faqOrb2 {
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
