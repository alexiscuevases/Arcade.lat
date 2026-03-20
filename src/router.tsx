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
import { Footer } from "./components/layout/footer"
import { LoginPage } from "./routes/login"
import { RegisterPage } from "./routes/register"
import { PricingPage } from "./routes/pricing"
import { LandingPage } from "./routes/landing"
import { DashboardPage } from "./routes/dashboard"
import { AccountPage } from "./routes/account"
import { BillingPage } from "./routes/billing"
import { GamePage } from "./routes/game"
import { AdminPage } from "./routes/admin"
import { TermsPage } from "./routes/terms"
import { PrivacyPage } from "./routes/privacy"

// Root shell (shared by all routes — only holds Toaster)
function RootLayout() {
  return (
    <>
      <Outlet />
      <Toaster richColors position="top-right" />
    </>
  )
}

// Public layout — navbar + full footer (landing, pricing, terms, privacy)
function PublicLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  )
}

// App layout — navbar only, no footer (auth, dashboard, admin, game)
function AppLayout() {
  return (
    <div className="min-h-svh bg-background text-foreground flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Outlet />
      </main>
    </div>
  )
}

const rootRoute = createRootRoute({ component: RootLayout })

// ── Public layout routes ────────────────────────────────────────────────────
const publicLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "public",
  component: PublicLayout,
})

const indexRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/",
  component: LandingPage,
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/dashboard" })
  },
})

const pricingRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/pricing",
  component: PricingPage,
})

const termsRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/terms",
  component: TermsPage,
})

const privacyRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/privacy",
  component: PrivacyPage,
})

// ── App layout routes (no footer) ───────────────────────────────────────────
const appLayoutRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  component: AppLayout,
})

const loginRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/login",
  component: LoginPage,
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/" })
  },
})

const registerRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/register",
  component: RegisterPage,
  beforeLoad: () => {
    if (isAuthenticated()) throw redirect({ to: "/" })
  },
})

const dashboardRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/dashboard",
  component: DashboardPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
  },
})

const accountRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/account",
  component: AccountPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
  },
})

const billingRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
  path: "/billing",
  component: BillingPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
  },
})

const gameRoute = createRoute({
  getParentRoute: () => appLayoutRoute,
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
  getParentRoute: () => appLayoutRoute,
  path: "/admin",
  component: AdminPage,
  beforeLoad: () => {
    if (!isAuthenticated()) throw redirect({ to: "/login" })
    if (getUser()?.role !== "ADMIN") throw redirect({ to: "/dashboard" })
  },
})

const routeTree = rootRoute.addChildren([
  publicLayoutRoute.addChildren([indexRoute, pricingRoute, termsRoute, privacyRoute]),
  appLayoutRoute.addChildren([loginRoute, registerRoute, dashboardRoute, accountRoute, billingRoute, gameRoute, adminRoute]),
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
