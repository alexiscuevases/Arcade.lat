import { useState, useEffect } from "react"
import { Link, useRouterState } from "@tanstack/react-router"
import {
  Gamepad2, LogOut, Settings, CreditCard, LayoutDashboard,
  Zap, Crown, Menu, X, ChevronDown, Layers, DollarSign,
  BookOpen, HelpCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { clearAuth, getUser, isAuthenticated } from "@/lib/auth"
import { queryClient } from "@/lib/query-client"
import { useRouter } from "@tanstack/react-router"

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

// ─── Scroll progress hook ────────────────────────────────────────────────────

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const handler = () => {
      const s = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (s / total) * 100 : 0)
      setScrolled(s > 12)
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
  return { progress, scrolled }
}

// ─── Nav links ───────────────────────────────────────────────────────────────

const navLinks = [
  { label: "Características", to: "/features", icon: Layers },
  { label: "Precios", to: "/pricing", icon: DollarSign },
  { label: "Blog", to: "/blog", icon: BookOpen },
  { label: "FAQ", to: "/faq", icon: HelpCircle },
]

// ─── Component ───────────────────────────────────────────────────────────────

export function Navbar() {
  const router = useRouter()
  const routerState = useRouterState()
  const pathname = routerState.location.pathname
  const user = getUser()
  const authed = isAuthenticated()
  const { progress, scrolled } = useScrollProgress()
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function logout() {
    clearAuth()
    queryClient.clear()
    router.navigate({ to: "/login" })
  }

  return (
    <>
      <header
        className="sticky top-0 z-50 transition-all duration-300"
        style={{
          background: scrolled
            ? "oklch(0.09 0.005 264 / 92%)"
            : "oklch(0.09 0.005 264 / 70%)",
          backdropFilter: "blur(20px) saturate(180%)",
          borderBottom: "1px solid",
          borderColor: scrolled ? "oklch(1 0 0 / 8%)" : "oklch(1 0 0 / 4%)",
          boxShadow: scrolled ? "0 4px 24px oklch(0 0 0 / 30%)" : "none",
        }}
      >
        {/* Scroll progress bar */}
        <div
          className="absolute bottom-0 left-0 h-0.5 pointer-events-none z-10 transition-opacity duration-300"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, oklch(0.76 0.19 196), oklch(0.62 0.26 300))",
            boxShadow: "0 0 10px oklch(0.76 0.19 196 / 80%)",
            opacity: progress > 1 ? 1 : 0,
          }}
        />

        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 gap-4">

          {/* ─── Logo ─── */}
          <Link
            to="/"
            className="flex items-center gap-2 font-bold tracking-tight group shrink-0"
          >
            <div
              className="relative flex size-8 items-center justify-center rounded-lg border transition-all duration-200 group-hover:scale-105"
              style={{
                background: "oklch(0.76 0.19 196 / 12%)",
                borderColor: "oklch(0.76 0.19 196 / 30%)",
                boxShadow: scrolled ? "0 0 12px oklch(0.76 0.19 196 / 20%)" : "none",
              }}
            >
              <Gamepad2 className="size-4 text-primary" />
              {/* Pulse dot */}
              <span
                className="absolute -top-0.5 -right-0.5 size-2 rounded-full bg-primary border border-background"
                style={{ animation: "pulseDot 2.5s ease-in-out infinite" }}
              />
            </div>
            <span
              className="text-foreground group-hover:text-primary font-nasalization transition-colors duration-200 text-[15px]"
            >
              Arcade
            </span>
          </Link>

          {/* ─── Desktop nav ─── */}
          {!authed && (
            <nav className="hidden md:flex items-center gap-0.5 flex-1 justify-center">
              {navLinks.map(({ label, to }) => {
                const active = pathname === to || (to !== "/" && pathname.startsWith(to))
                return (
                  <Link
                    key={to}
                    to={to}
                    className={`relative px-3.5 py-1.5 rounded-md text-sm transition-all duration-200 font-medium group ${
                      active
                        ? "text-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-white/4"
                    }`}
                  >
                    {active && (
                      <span
                        className="absolute inset-0 rounded-md pointer-events-none"
                        style={{ background: "oklch(0.76 0.19 196 / 8%)", border: "1px solid oklch(0.76 0.19 196 / 20%)" }}
                      />
                    )}
                    <span className="relative">{label}</span>
                    {active && (
                      <span
                        className="absolute bottom-0 left-1/2 -translate-x-1/2 h-px w-4/5 pointer-events-none"
                        style={{ background: "linear-gradient(90deg, transparent, oklch(0.76 0.19 196 / 70%), transparent)" }}
                      />
                    )}
                  </Link>
                )
              })}
            </nav>
          )}

          {authed && <div className="flex-1" />}

          {/* ─── Right side ─── */}
          <div className="flex items-center gap-2 shrink-0">
            {authed && user ? (
              <>
                {/* Plan badge */}
                {user.plan === "PRO" ? (
                  <Badge className="gap-1 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20 hidden sm:inline-flex">
                    <Crown className="size-3" /> PRO
                  </Badge>
                ) : user.plan === "BASIC" ? (
                  <Badge className="gap-1 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20 hidden sm:inline-flex">
                    <Zap className="size-3" /> BASIC
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground border-white/10 hidden sm:inline-flex">
                    FREE
                  </Badge>
                )}

                {/* User dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-1.5 rounded-lg px-2 py-1 hover:bg-white/5 transition-colors group">
                      <Avatar className="size-7 ring-1 ring-white/10 group-hover:ring-primary/40 transition-all">
                        <AvatarFallback className="text-[10px] bg-primary/10 text-primary font-bold">
                          {getInitials(user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="size-3 text-muted-foreground group-hover:text-foreground transition-colors hidden sm:block" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-54 border-white/10 bg-card">
                    <DropdownMenuLabel className="flex flex-col gap-0.5">
                      <span className="text-sm font-medium truncate">{user.email}</span>
                      <span className="text-xs font-normal text-muted-foreground">
                        Plan {user.plan}
                      </span>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-white/6" />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="flex items-center gap-2">
                        <Gamepad2 className="size-4" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    {user.role === "ADMIN" && (
                      <DropdownMenuItem asChild>
                        <Link to="/admin" className="flex items-center gap-2">
                          <LayoutDashboard className="size-4" />
                          Administración
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="flex items-center gap-2">
                        <Settings className="size-4" />
                        Cuenta
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/billing" className="flex items-center gap-2">
                        <CreditCard className="size-4" />
                        Facturación
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-white/6" />
                    <DropdownMenuItem
                      onClick={logout}
                      className="flex items-center gap-2 text-destructive focus:text-destructive"
                    >
                      <LogOut className="size-4" />
                      Cerrar sesión
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                {/* Desktop auth buttons */}
                <div className="hidden sm:flex items-center gap-2">
                  <Link to="/login">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-muted-foreground hover:text-foreground h-8 px-3 text-sm"
                    >
                      Iniciar sesión
                    </Button>
                  </Link>
                  <Link to="/register">
                    <Button
                      size="sm"
                      className="h-8 px-4 text-sm glow-cyan"
                    >
                      Empezar gratis
                    </Button>
                  </Link>
                </div>

                {/* Mobile hamburger */}
                <button
                  onClick={() => setMobileOpen((v) => !v)}
                  className="sm:hidden flex size-8 items-center justify-center rounded-md border border-white/8 text-muted-foreground hover:text-foreground hover:border-white/20 transition-colors"
                  aria-label="Toggle menu"
                >
                  {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* ─── Mobile menu ─── */}
        <div
          className="sm:hidden overflow-hidden transition-all duration-300 border-t"
          style={{
            maxHeight: mobileOpen ? "400px" : "0px",
            borderColor: mobileOpen ? "oklch(1 0 0 / 6%)" : "transparent",
          }}
        >
          <div className="px-4 py-4 space-y-1">
            {navLinks.map(({ label, to, icon: Icon }) => {
              const active = pathname === to || (to !== "/" && pathname.startsWith(to))
              return (
                <Link
                  key={to}
                  to={to}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                    active
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "text-muted-foreground hover:text-foreground hover:bg-white/4"
                  }`}
                >
                  <Icon className="size-4 shrink-0" />
                  {label}
                </Link>
              )
            })}
            <div className="pt-3 border-t border-white/6 flex flex-col gap-2">
              <Link to="/login" className="w-full">
                <Button variant="ghost" size="sm" className="w-full justify-center text-sm h-9">
                  Iniciar sesión
                </Button>
              </Link>
              <Link to="/register" className="w-full">
                <Button size="sm" className="w-full justify-center text-sm h-9 glow-cyan">
                  Empezar gratis
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <style>{`
        @keyframes pulseDot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
      `}</style>
    </>
  )
}
