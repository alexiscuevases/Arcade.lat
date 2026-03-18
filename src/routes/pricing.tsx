import { useNavigate } from "@tanstack/react-router"
import { Check, Zap } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { api } from "@/lib/api"
import { isAuthenticated } from "@/lib/auth"

const plans = [
  {
    id: "FREE" as const,
    name: "Free",
    price: "$0",
    period: "/month",
    description: "Try cloud gaming with limits",
    features: ["1 hour/day", "Standard queue priority", "720p streaming", "Community support"],
    cta: "Get started",
    highlight: false,
  },
  {
    id: "BASIC" as const,
    name: "Basic",
    price: "$9",
    period: "/month",
    description: "Great for casual gamers",
    features: ["10 hours/day", "Priority queue", "1080p streaming", "Email support"],
    cta: "Subscribe",
    highlight: false,
  },
  {
    id: "PRO" as const,
    name: "Pro",
    price: "$29",
    period: "/month",
    description: "For serious gamers",
    features: ["Unlimited hours", "Top queue priority", "4K streaming", "24/7 priority support", "Early access features"],
    cta: "Go Pro",
    highlight: true,
  },
]

export function PricingPage() {
  const navigate = useNavigate()
  const authed = isAuthenticated()

  async function handleSubscribe(planId: "BASIC" | "PRO") {
    if (!authed) {
      navigate({ to: "/register" })
      return
    }
    try {
      const { url } = await api.stripe.createCheckoutSession(planId)
      if (url) window.location.href = url
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to create checkout")
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-16">
      <div className="mb-12 text-center">
        <Badge variant="secondary" className="mb-4">
          <Zap className="mr-1 size-3" /> Pricing
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">
          Play any game, instantly
        </h1>
        <p className="mt-3 text-lg text-muted-foreground">
          No hardware required. Stream from powerful GPU instances.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <Card
            key={plan.id}
            className={plan.highlight ? "border-primary shadow-lg ring-1 ring-primary" : ""}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{plan.name}</CardTitle>
                {plan.highlight && <Badge>Popular</Badge>}
              </div>
              <CardDescription>{plan.description}</CardDescription>
              <div className="pt-2">
                <span className="text-3xl font-bold">{plan.price}</span>
                <span className="text-muted-foreground">{plan.period}</span>
              </div>
            </CardHeader>

            <CardContent>
              <Separator className="mb-4" />
              <ul className="space-y-2">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm">
                    <Check className="size-4 shrink-0 text-green-500" />
                    {f}
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              {plan.id === "FREE" ? (
                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  onClick={() => navigate({ to: authed ? "/dashboard" : "/register" })}
                >
                  {plan.cta}
                </Button>
              ) : (
                <Button
                  className="w-full"
                  variant={plan.highlight ? "default" : "outline"}
                  onClick={() => handleSubscribe(plan.id)}
                >
                  {plan.cta}
                </Button>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  )
}
