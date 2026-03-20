import {
  createRouter,
  createRootRoute,
  createRoute,
  redirect,
  Outlet,
} from "@tanstack/react-router"
import { Toaster } from "sonner"
import { isAuthenticated, getUser } from "./shared/lib/auth"
import { Navbar } from "./shared/layout/navbar"
import { Footer } from "./shared/layout/footer"
import { LoginPage } from "./features/auth/login"
import { RegisterPage } from "./features/auth/register"
import { PricingPage } from "./features/marketing/pricing"
import { LandingPage } from "./features/marketing/landing"
import { DashboardPage } from "./features/dashboard/dashboard"
import { AccountPage } from "./features/account/account"
import { BillingPage } from "./features/account/billing"
import { GamePage } from "./features/game/game"
import { AdminPage } from "./features/admin/admin"
import { TermsPage } from "./features/legal/terms"
import { PrivacyPage } from "./features/legal/privacy"
import { AboutPage } from "./features/marketing/about"
import { FaqPage } from "./features/marketing/faq"
import { SupportPage } from "./features/marketing/support"
import { BlogPage } from "./features/marketing/blog"
import { NotFoundPage } from "./features/not-found"
import { CookiesPage } from "./features/legal/cookies"
import { RefundPage } from "./features/legal/refund"
import { DisclaimersPage } from "./features/legal/disclaimers"
import { FeaturesPage } from "./features/marketing/features"
import { BlogPostPage } from "./features/marketing/blog-post"

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

const aboutRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/about",
  component: AboutPage,
})

const faqRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/faq",
  component: FaqPage,
})

const supportRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/support",
  component: SupportPage,
})

const blogRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/blog",
  component: BlogPage,
})

const blogPostRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/blog/$slug",
  component: function BlogPostRouteComponent() {
    const { slug } = blogPostRoute.useParams()
    return <BlogPostPage slug={slug} />
  },
})

const cookiesRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/cookies",
  component: CookiesPage,
})

const refundRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/refund",
  component: RefundPage,
})

const disclaimersRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/disclaimers",
  component: DisclaimersPage,
})

const featuresRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "/features",
  component: FeaturesPage,
})

const notFoundRoute = createRoute({
  getParentRoute: () => publicLayoutRoute,
  path: "*",
  component: NotFoundPage,
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
  publicLayoutRoute.addChildren([
    indexRoute,
    pricingRoute,
    termsRoute,
    privacyRoute,
    aboutRoute,
    faqRoute,
    supportRoute,
    blogRoute,
    blogPostRoute,
    featuresRoute,
    cookiesRoute,
    refundRoute,
    disclaimersRoute,
    notFoundRoute,
  ]),
  appLayoutRoute.addChildren([loginRoute, registerRoute, dashboardRoute, accountRoute, billingRoute, gameRoute, adminRoute]),
])

export const router = createRouter({ routeTree })

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
