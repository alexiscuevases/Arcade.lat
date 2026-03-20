import { useState, useRef, useCallback, useEffect } from "react"
import { useNavigate, Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Gamepad2, Eye, EyeOff, LogIn } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/lib/api"
import { setAuth } from "@/lib/auth"

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Required"),
})

const BG_PARTICLES = Array.from({ length: 18 }, (_, i) => ({
  id: i,
  left: `${(i * 5.41 + 7) % 100}%`,
  top: `${(i * 7.13 + 11) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 7 + (i % 5) * 1.3,
  delay: -((i % 7) * 0.8),
  opacity: 0.08 + (i % 5) * 0.04,
  color: i % 3 === 0 ? "oklch(0.62 0.26 300)" : "oklch(0.76 0.19 196)",
}))

export function LoginPage() {
  const navigate = useNavigate()
  const [showPassword, setShowPassword] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [mouse, setMouse] = useState({ x: 50, y: 50 })
  const wrapperRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const t = requestAnimationFrame(() => setMounted(true))
    return () => cancelAnimationFrame(t)
  }, [])

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = wrapperRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  const form = useForm({
    defaultValues: { email: "", password: "" },
    onSubmit: async ({ value }) => {
      const parsed = schema.safeParse(value)
      if (!parsed.success) {
        toast.error(parsed.error.issues[0].message)
        return
      }
      try {
        const res = await api.auth.login(value.email, value.password)
        setAuth(res.token, {
          id: res.user.id,
          email: res.user.email,
          plan: res.user.plan as "FREE" | "BASIC" | "PRO",
          role: res.user.role as "ADMIN" | "USER",
        })
        navigate({ to: "/" })
      } catch (err: unknown) {
        toast.error(err instanceof Error ? err.message : "Login failed")
      }
    },
  })

  return (
    <div
      ref={wrapperRef}
      onMouseMove={handleMouseMove}
      className="relative flex min-h-[calc(100svh-3.5rem)] items-center justify-center p-4 overflow-hidden"
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

      {/* Mouse glow */}
      <div
        className="absolute inset-0 pointer-events-none transition-all duration-300"
        style={{
          background: `radial-gradient(ellipse 45% 45% at ${mouse.x}% ${mouse.y}%, oklch(0.76 0.19 196 / 12%), transparent)`,
        }}
      />

      {/* Orbs */}
      <div
        className="absolute top-1/4 left-1/6 w-64 h-64 rounded-full pointer-events-none"
        style={{ background: "oklch(0.76 0.19 196 / 7%)", filter: "blur(55px)", animation: "authOrb1 9s ease-in-out infinite" }}
      />
      <div
        className="absolute bottom-1/4 right-1/6 w-80 h-80 rounded-full pointer-events-none"
        style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(70px)", animation: "authOrb2 12s ease-in-out infinite" }}
      />
      <div
        className="absolute top-2/3 left-1/3 w-48 h-48 rounded-full pointer-events-none"
        style={{ background: "oklch(0.76 0.19 196 / 4%)", filter: "blur(50px)", animation: "authOrb1 7s ease-in-out 2s infinite" }}
      />

      {/* Particles */}
      {BG_PARTICLES.map((p) => (
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
      <div
        className="relative z-10 w-full max-w-sm"
        style={{
          opacity: mounted ? 1 : 0,
          transform: mounted ? "translateY(0)" : "translateY(24px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
        }}
      >
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="relative mx-auto w-16 h-16 mb-3">
            {[0, 1].map((ring) => (
              <div
                key={ring}
                className="absolute rounded-full border border-primary/20"
                style={{
                  inset: `-${ring * 10}px`,
                  animation: "pulseRing 2.6s ease-out infinite",
                  animationDelay: `${ring * 0.7}s`,
                }}
              />
            ))}
            <div
              className="absolute inset-0 flex items-center justify-center rounded-2xl border border-primary/30 bg-primary/10"
              style={{ boxShadow: "0 0 28px oklch(0.76 0.19 196 / 25%)" }}
            >
              <Gamepad2 className="size-7 text-primary" style={{ filter: "drop-shadow(0 0 8px oklch(0.76 0.19 196 / 70%))" }} />
            </div>
          </div>
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase mt-2">Cloud Gaming</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl border border-white/8 bg-card/80 backdrop-blur-md overflow-hidden"
          style={{ boxShadow: "0 0 50px oklch(0.76 0.19 196 / 10%), 0 20px 60px oklch(0 0 0 / 40%)" }}
        >
          {/* Top accent */}
          <div className="h-px bg-linear-to-r from-transparent via-primary/50 to-transparent" />

          <div className="p-7">
            <div className="text-center mb-7">
              <h1 className="text-2xl font-bold text-foreground mb-1">Welcome back</h1>
              <p className="text-sm text-muted-foreground">Sign in to your Arcade account</p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault()
                form.handleSubmit()
              }}
              className="space-y-4"
            >
              <form.Field name="email">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Email
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="you@example.com"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="border-white/8 bg-white/4 focus:border-primary/50 focus:bg-white/6 transition-all duration-200 focus:shadow-[0_0_0_3px_oklch(0.76_0.19_196/12%)]"
                      />
                    </div>
                  </div>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={field.state.value}
                        onChange={(e) => field.handleChange(e.target.value)}
                        onBlur={field.handleBlur}
                        className="pr-10 border-white/8 bg-white/4 focus:border-primary/50 focus:bg-white/6 transition-all duration-200 focus:shadow-[0_0_0_3px_oklch(0.76_0.19_196/12%)]"
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                      </button>
                    </div>
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(submitting) => (
                  <Button
                    type="submit"
                    className="w-full mt-2 glow-cyan"
                    size="lg"
                    disabled={submitting}
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <span
                          className="size-4 rounded-full border-2 border-background/30 border-t-background"
                          style={{ animation: "spin 0.7s linear infinite" }}
                        />
                        Signing in…
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <LogIn className="size-4" />
                        Sign in
                      </span>
                    )}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes authOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-18px) translateX(12px); }
          70% { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes authOrb2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          35% { transform: translateY(16px) translateX(-10px); }
          65% { transform: translateY(-10px) translateX(14px); }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-16px) translateX(9px) scale(1.2); }
          50% { transform: translateY(-6px) translateX(-10px) scale(0.9); }
          75% { transform: translateY(12px) translateX(5px) scale(1.1); }
        }
        @keyframes pulseRing {
          0% { opacity: 0.5; transform: scale(1); }
          100% { opacity: 0; transform: scale(1.8); }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}
