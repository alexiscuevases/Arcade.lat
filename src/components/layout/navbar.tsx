import { Link, useRouter } from "@tanstack/react-router"
import { Gamepad2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { clearAuth, getUser, isAuthenticated } from "@/lib/auth"
import { queryClient } from "@/lib/query-client"

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
    <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold">
          <Gamepad2 className="size-5" />
          Arcade
        </Link>

        <nav className="flex items-center gap-3">
          <Link
            to="/pricing"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Pricing
          </Link>

          {authed ? (
            <>
              {user && (
                <Badge variant={user.plan === "PRO" ? "default" : user.plan === "BASIC" ? "secondary" : "outline"}>
                  {user.plan}
                </Badge>
              )}
              <Link to="/dashboard">
                <Button variant="ghost" size="sm">
                  Dashboard
                </Button>
              </Link>
              <Button variant="ghost" size="icon" onClick={logout} title="Sign out">
                <LogOut className="size-4" />
              </Button>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">
                  Sign in
                </Button>
              </Link>
              <Link to="/register">
                <Button size="sm">Get started</Button>
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
