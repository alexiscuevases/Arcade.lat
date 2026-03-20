import { Check, Crown, Zap, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Badge } from "@/shared/components/ui/badge"
import { Separator } from "@/shared/components/ui/separator"
import { api } from "@/shared/lib/api"
import { getUser } from "@/shared/lib/auth"

const plans = [
  {
    id: "FREE" as const,
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Try cloud gaming with limits",
    features: ["1 hour/day", "Standard queue", "720p streaming", "Community support"],
    icon: null,
  },
  {
    id: "BASIC" as const,
    name: "Basic",
    price: "$9",
    period: "/month",
    description: "Great for casual gamers",
    features: ["10 hours/day", "Priority queue", "1080p streaming", "Email support"],
    icon: Zap,
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious gamers",
    features: ["Unlimited hours", "Top priority queue", "4K streaming", "24/7 priority support", "Early access"],
    icon: Crown,
  },
]

export function BillingPage() {
  const user = getUser()
  const currentPlan = user?.plan ?? "FREE"

  async function handleUpgrade(planId: "BASIC" | "PRO") {
    try {
      const { url } = await api.stripe.createCheckoutSession(planId)
      if (url) window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to start checkout")
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Plan & Billing</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your subscription and plan.
        </p>
      </div>

      {/* Current plan */}
      <Card className={
        currentPlan === "PRO"
          ? "border-yellow-500/30 bg-yellow-500/3 shadow-[0_0_30px_oklch(0.85_0.2_85/8%)]"
          : currentPlan === "BASIC"
            ? "border-primary/30 shadow-[0_0_30px_oklch(0.76_0.19_196/8%)]"
            : "gaming-card"
      }>
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Current Plan</CardTitle>
          <CardDescription>Your active subscription.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {currentPlan === "PRO" && <Crown className="size-5 text-yellow-400" />}
              {currentPlan === "BASIC" && <Zap className="size-5 text-primary" />}
              {currentPlan === "FREE" && <Sparkles className="size-5 text-muted-foreground" />}
              <div>
                <p className="font-bold text-base">
                  {currentPlan === "PRO" ? "Pro" : currentPlan === "BASIC" ? "Basic" : "Free"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentPlan === "PRO"
                    ? "$29/month"
                    : currentPlan === "BASIC"
                      ? "$9/month"
                      : "No charge"}
                </p>
              </div>
            </div>
            <Badge className={
              currentPlan === "PRO"
                ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/30"
                : currentPlan === "BASIC"
                  ? "bg-primary/10 text-primary border-primary/30"
                  : "border-white/10 text-muted-foreground"
            }>
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Plans */}
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">
          Available Plans
        </h2>
        <div className="space-y-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === currentPlan
            const Icon = plan.icon
            return (
              <Card
                key={plan.id}
                className={
                  isCurrent
                    ? "border-primary/40 shadow-[0_0_20px_oklch(0.76_0.19_196/10%)]"
                    : "gaming-card"
                }
              >
                {isCurrent && (
                  <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent rounded-t-lg" />
                )}
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {Icon && (
                        <Icon className={`size-4 ${plan.id === "PRO" ? "text-yellow-400" : "text-primary"}`} />
                      )}
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      {isCurrent && (
                        <Badge className="text-xs bg-primary/10 text-primary border-primary/20">
                          Current
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className={`text-xl font-bold ${isCurrent ? "text-primary" : ""}`}>{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>

                <CardContent className="pb-2">
                  <Separator className="mb-3 bg-white/6" />
                  <ul className="grid grid-cols-2 gap-1.5">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-1.5 text-sm">
                        <Check className={`size-3.5 shrink-0 ${isCurrent ? "text-primary" : "text-green-400"}`} />
                        {f}
                      </li>
                    ))}
                  </ul>
                </CardContent>

                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current plan
                    </Button>
                  ) : plan.id === "FREE" ? (
                    <Button className="w-full" variant="outline" disabled>
                      Downgrade
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      variant={plan.id === "PRO" ? "default" : "outline"}
                      onClick={() => handleUpgrade(plan.id)}
                    >
                      {plan.id === "PRO" ? "Upgrade to Pro" : "Switch to Basic"}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
