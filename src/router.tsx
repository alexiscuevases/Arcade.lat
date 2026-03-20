import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router"
import { Toaster } from "sonner"
import { isAuthenticated, getUser } from "./lib/auth"
import { Navbar } from "./components/layout/navbar"
import { LoginPage } from "./routes/login"
import { RegisterPage } from "./routes/register"
import { PricingPage } from "./routes/pricing"
import { LandingPage } from "./routes/landing"
import { DashboardPage } from "./routes/dashboard"
import { AccountPage } from "./routes/account"
import { BillingPage } from "./routes/billing"
import { GamePage } from "./routes/game"
import { AdminPage } from "./routes/admin"

// Root layout
function RootLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <Navbar />
      <main>
        <Outlet />
      </main>
      <Toaster richColors position="top-right" />
    </div>
  )
}

const rootRoute = createRootRoute({ component: RootLayout })

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LandingPage,
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/dashboard" })
  },
})

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/" })
  },
})

const registerRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/register",
  component: RegisterPage,
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/" })
  },
})

const pricingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/pricing",
  component: PricingPage,
})

const dashboardRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/dashboard",
  component: DashboardPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
  },
})

const accountRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/account",
  component: AccountPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
  },
})

const billingRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/billing",
  component: BillingPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
  },
})

const gameRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/game/$gameId",
  component: function GameRouteComponent() {
    const { gameId } = gameRoute.useParams()
    return <GamePage gameId={gameId} />
  },
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
  },
})

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
    if (getUser()?.role !== "ADMIN") throw redirect({ to: "/dashboard" })
  },
})

const routeTree = rootRoute.addChildren([
  indexRoute,
  loginRoute,
  registerRoute,
  pricingRoute,
  dashboardRoute,
  accountRoute,
  billingRoute,
  gameRoute,
  adminRoute,
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
