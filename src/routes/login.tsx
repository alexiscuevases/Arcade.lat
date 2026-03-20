import { useNavigate, Link } from "@tanstack/react-router"
import { useForm } from "@tanstack/react-form"
import { toast } from "sonner"
import { Gamepad2 } from "lucide-react"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { api } from "@/lib/api"
import { setAuth } from "@/lib/auth"

const schema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Required"),
})

export function LoginPage() {
  const navigate = useNavigate()

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
    <div className="flex min-h-[calc(100svh-3.5rem)] items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="mx-auto flex size-12 items-center justify-center rounded-xl bg-primary/10 border border-primary/30 shadow-[0_0_24px_oklch(0.76_0.19_196/20%)]">
            <Gamepad2 className="size-6 text-primary" />
          </div>
          <p className="text-xs tracking-[0.3em] text-muted-foreground uppercase">Cloud Gaming</p>
        </div>

        <Card className="border-white/8 bg-card/80 backdrop-blur-sm shadow-[0_0_40px_oklch(0.76_0.19_196/8%)]">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold">Welcome back</CardTitle>
            <CardDescription>Sign in to your Arcade account</CardDescription>
          </CardHeader>

          <CardContent>
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
                    <Label htmlFor="email" className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder="you@example.com"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="border-white/8 bg-white/4 focus:border-primary/50 focus:bg-white/6 transition-colors"
                    />
                  </div>
                )}
              </form.Field>

              <form.Field name="password">
                {(field) => (
                  <div className="space-y-1.5">
                    <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={field.state.value}
                      onChange={(e) => field.handleChange(e.target.value)}
                      onBlur={field.handleBlur}
                      className="border-white/8 bg-white/4 focus:border-primary/50 focus:bg-white/6 transition-colors"
                    />
                  </div>
                )}
              </form.Field>

              <form.Subscribe selector={(s) => s.isSubmitting}>
                {(submitting) => (
                  <Button type="submit" className="w-full mt-2" size="lg" disabled={submitting}>
                    {submitting ? "Signing in…" : "Sign in"}
                  </Button>
                )}
              </form.Subscribe>
            </form>

            <p className="mt-4 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/register" className="text-primary hover:text-primary/80 font-medium transition-colors">
                Sign up
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
