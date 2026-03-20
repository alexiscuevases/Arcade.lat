import { Link, useRouter } from "@tanstack/react-router"
import { Gamepad2, LogOut, Settings, CreditCard, LayoutDashboard, Zap, Crown } from "lucide-react"
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

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function Navbar() {
  const router = useRouter()
  const user = getUser()
  const authed = isAuthenticated()

  function logout() {
    clearAuth()
    queryClient.clear()
    router.navigate({ to: "/login" })
  }

  return (
    <header className="sticky top-0 z-50 border-b border-white/6 bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link
          to="/"
          className="flex items-center gap-2 font-bold tracking-tight group"
        >
          <div className="flex size-7 items-center justify-center rounded-md bg-primary/10 border border-primary/30 group-hover:bg-primary/20 group-hover:border-primary/50 transition-colors">
            <Gamepad2 className="size-4 text-primary" />
          </div>
          <span className="text-foreground group-hover:text-primary transition-colors">
            Arcade
          </span>
        </Link>

        <nav className="flex items-center gap-3">
          {authed && user ? (
            <>
              {user.plan === "PRO" ? (
                <Badge className="gap-1 bg-yellow-500/10 text-yellow-400 border-yellow-500/30 hover:bg-yellow-500/20">
                  <Crown className="size-3" /> PRO
                </Badge>
              ) : user.plan === "BASIC" ? (
                <Badge className="gap-1 bg-primary/10 text-primary border-primary/30 hover:bg-primary/20">
                  <Zap className="size-3" /> BASIC
                </Badge>
              ) : (
                <Badge variant="outline" className="text-muted-foreground border-white/10">
                  FREE
                </Badge>
              )}

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Avatar className="size-8 cursor-pointer ring-1 ring-white/10 hover:ring-primary/50 transition-all">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">
                      {getInitials(user.email)}
                    </AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 border-white/10 bg-card">
                  <DropdownMenuLabel className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{user.email}</span>
                    <span className="text-xs font-normal text-muted-foreground">
                      {user.plan} plan
                    </span>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-white/6" />
                  {user.role === "ADMIN" && (
                    <DropdownMenuItem asChild>
                      <Link to="/admin" className="flex items-center gap-2">
                        <LayoutDashboard className="size-4" />
                        Administration
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="flex items-center gap-2">
                      <Settings className="size-4" />
                      Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/billing" className="flex items-center gap-2">
                      <CreditCard className="size-4" />
                      Billing
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/6" />
                  <DropdownMenuItem
                    onClick={logout}
                    className="flex items-center gap-2 text-destructive focus:text-destructive"
                  >
                    <LogOut className="size-4" />
                    Sign out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90 glow-cyan">
                  Get started
                </Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
