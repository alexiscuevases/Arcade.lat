import { User, Mail, Shield, Trash2 } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Separator } from "@/shared/components/ui/separator"
import { Avatar, AvatarFallback } from "@/shared/components/ui/avatar"
import { getUser } from "@/shared/lib/auth"

function getInitials(email: string) {
  return email.slice(0, 2).toUpperCase()
}

export function AccountPage() {
  const user = getUser()
  if (!user) return null

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Account</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your profile and preferences.
        </p>
      </div>

      {/* Profile */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Profile</CardTitle>
          <CardDescription>Your public identity on Arcade.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="size-14 ring-2 ring-primary/20">
              <AvatarFallback className="text-lg bg-primary/10 text-primary font-bold">
                {getInitials(user.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-bold text-base">{user.email.split("@")[0]}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Account details */}
      <Card className="gaming-card">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-muted-foreground">Account Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/8 bg-primary/5">
              <Mail className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Email</p>
              <p className="text-sm font-medium">{user.email}</p>
            </div>
          </div>

          <Separator className="bg-white/6" />

          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/8 bg-primary/5">
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">User ID</p>
              <p className="text-sm font-medium font-mono">{user.id}</p>
            </div>
          </div>

          <Separator className="bg-white/6" />

          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-md border border-white/8 bg-primary/5">
              <Shield className="size-4 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Password</p>
              <p className="text-sm font-medium">••••••••</p>
            </div>
            <Button variant="outline" size="sm" disabled>
              Change
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Danger zone */}
      <Card className="border-destructive/30 bg-destructive/3">
        <CardHeader>
          <CardTitle className="text-xs uppercase tracking-wider text-destructive">Danger Zone</CardTitle>
          <CardDescription>
            Irreversible actions. Proceed with caution.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delete account</p>
              <p className="text-xs text-muted-foreground">
                Permanently remove your account and all data.
              </p>
            </div>
            <Button variant="destructive" size="sm" disabled>
              <Trash2 className="size-4 mr-1.5" />
              Delete
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
