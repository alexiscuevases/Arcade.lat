import { useEffect, useState } from "react"
import { Gamepad2, Home, ArrowLeft, Search } from "lucide-react"

const GLITCH_CHARS = "!@#$%^&*<>?/\\|{}[]01"

function useGlitchText(text: string, active: boolean) {
  const [display, setDisplay] = useState(text)
  useEffect(() => {
    if (!active) { setDisplay(text); return }
    let iteration = 0
    const interval = setInterval(() => {
      setDisplay(
        text
          .split("")
          .map((char, index) => {
            if (index < iteration) return text[index]
            if (char === " ") return " "
            return GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)]
          })
          .join("")
      )
      if (iteration >= text.length) clearInterval(interval)
      iteration += 0.4
    }, 30)
    return () => clearInterval(interval)
  }, [text, active])
  return display
}

const PARTICLES = Array.from({ length: 20 }, (_, i) => ({
  id: i,
  left: `${(i * 5.23 + 4) % 100}%`,
  top: `${(i * 7.41 + 8) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 8 + (i % 5) * 1.3,
  delay: -((i % 7) * 0.9),
  opacity: 0.06 + (i % 4) * 0.04,
  color: i % 2 === 0 ? "oklch(0.76 0.19 196)" : "oklch(0.62 0.26 300)",
}))

export function NotFoundPage() {
  const [glitchActive, setGlitchActive] = useState(false)
  const glitched404 = useGlitchText("404", glitchActive)

  useEffect(() => {
    const timer = setTimeout(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 1200)
    }, 600)

    const interval = setInterval(() => {
      setGlitchActive(true)
      setTimeout(() => setGlitchActive(false), 800)
    }, 5000)

    return () => { clearTimeout(timer); clearInterval(interval) }
  }, [])

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
          backgroundSize: "60px 60px",
        }} />

      {/* Glow orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "oklch(0.76 0.19 196 / 5%)", filter: "blur(80px)", animation: "nfOrb1 12s ease-in-out infinite" }} />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(70px)", animation: "nfOrb2 15s ease-in-out infinite" }} />

      {/* Particles */}
      {PARTICLES.map((p) => (
        <div key={p.id} className="absolute rounded-full pointer-events-none"
          style={{
            left: p.left, top: p.top,
            width: `${p.size}px`, height: `${p.size}px`,
            background: p.color, opacity: p.opacity,
            animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
          }} />
      ))}

      {/* Content */}
      <div className="relative z-10 text-center space-y-8 max-w-lg mx-auto">
        {/* Game over badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-destructive/30 bg-destructive/8 text-destructive text-sm font-medium">
          <Gamepad2 className="w-3.5 h-3.5" />
          GAME OVER
        </div>

        {/* 404 */}
        <div className="relative">
          <div
            className="text-[10rem] sm:text-[14rem] font-bold leading-none tabular-nums select-none"
            style={{
              color: "transparent",
              WebkitTextStroke: "2px oklch(0.76 0.19 196 / 40%)",
              textShadow: glitchActive
                ? "4px 0 oklch(0.76 0.19 196 / 80%), -4px 0 oklch(0.62 0.26 300 / 80%), 0 0 40px oklch(0.76 0.19 196 / 30%)"
                : "0 0 40px oklch(0.76 0.19 196 / 20%)",
              transition: "text-shadow 0.05s",
              fontFamily: "inherit",
            }}
          >
            {glitched404}
          </div>
          {/* Scan line effect */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20"
            style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 2px, oklch(0 0 0 / 15%) 2px, oklch(0 0 0 / 15%) 4px)" }} />
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl sm:text-3xl font-bold">Página no encontrada</h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            Parece que este nivel no existe. La página que buscas fue eliminada, movida o nunca estuvo aquí.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href="/"
            className="flex items-center gap-2 px-6 py-3 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 transition-opacity glow-cyan w-full sm:w-auto justify-center"
          >
            <Home className="size-4" />
            Ir al inicio
          </a>
          <button
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border border-border text-sm font-medium hover:border-primary/40 hover:text-primary transition-colors w-full sm:w-auto justify-center"
          >
            <ArrowLeft className="size-4" />
            Volver atrás
          </button>
        </div>

        {/* Quick links */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 pt-2">
          {[
            { label: "Juegos", href: "/dashboard" },
            { label: "Precios", href: "/pricing" },
            { label: "Soporte", href: "/support" },
            { label: "FAQ", href: "/faq" },
          ].map(l => (
            <a key={l.href} href={l.href} className="text-xs text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
              <Search className="size-2.5" />
              {l.label}
            </a>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes nfOrb1 {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          40% { transform: translateY(-20px) translateX(15px) scale(1.05); }
          70% { transform: translateY(12px) translateX(-10px) scale(0.97); }
        }
        @keyframes nfOrb2 {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          35% { transform: translateY(18px) translateX(-14px) scale(1.03); }
          65% { transform: translateY(-10px) translateX(12px) scale(0.98); }
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
