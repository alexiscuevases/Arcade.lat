import { useState } from "react"
import {
  HelpCircle, ChevronDown, ChevronUp,
  Headphones, Mail, Clock, ExternalLink,
} from "lucide-react"
import { Card, CardContent } from "@/shared/components/ui/card"
import { Separator } from "@/shared/components/ui/separator"
import { getUser } from "@/shared/lib/auth"

const FAQ_ITEMS = [
  {
    q: "¿Cómo funciona el streaming de juegos?",
    a: "Arcade ejecuta los juegos en GPUs en la nube y transmite el video a tu navegador en tiempo real. Solo necesitas una conexión a internet estable de al menos 15 Mbps.",
  },
  {
    q: "¿Puedo jugar desde cualquier dispositivo?",
    a: "Sí. Arcade funciona en cualquier dispositivo con un navegador moderno: PC, Mac, tablets e incluso smartphones. Recomendamos Chrome o Edge para la mejor experiencia.",
  },
  {
    q: "¿Qué pasa si se me acaba el tiempo diario?",
    a: "Tu sesión se cerrará automáticamente al alcanzar el límite. Puedes esperar al siguiente día o mejorar tu plan para obtener más horas. Los usuarios PRO tienen tiempo ilimitado.",
  },
  {
    q: "¿Cómo cancelo mi suscripción?",
    a: "Ve a Facturación en tu cuenta y haz clic en 'Cambiar plan'. Puedes bajar al plan gratuito en cualquier momento. Tu plan actual seguirá activo hasta el final del período de facturación.",
  },
  {
    q: "¿Mis partidas guardadas se conservan?",
    a: "Sí. Todas las partidas guardadas se almacenan en la nube y están disponibles cada vez que inicies sesión, sin importar desde qué dispositivo juegues.",
  },
  {
    q: "¿Qué hago si tengo lag o mala calidad de imagen?",
    a: "Verifica tu conexión a internet (mínimo 15 Mbps). Cierra otras aplicaciones que consuman ancho de banda. Si el problema persiste, intenta cambiar a una resolución más baja desde los ajustes del stream.",
  },
]

export function SupportPage() {
  const user = getUser()
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="relative overflow-hidden border-b border-white/5">
        <div className="pointer-events-none absolute -top-32 left-1/4 size-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="pointer-events-none absolute -top-20 right-1/4 size-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="mx-auto max-w-4xl px-6 py-12">
          <p className="text-xs font-medium tracking-[0.2em] uppercase text-primary/70">Centro de ayuda</p>
          <h1 className="text-4xl font-bold tracking-tight mt-2">Soporte</h1>
          <p className="text-muted-foreground mt-1">Encuentra respuestas rápidas o chatea con nuestro equipo.</p>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-6 py-10 space-y-8">
        {/* Contact options */}
        <div className="grid gap-4 sm:grid-cols-3">
          <Card className="gaming-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 border border-primary/20">
                <Headphones className="size-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-sm">Chat en vivo</p>
                <p className="text-xs text-muted-foreground">Respuesta inmediata</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gaming-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-accent/10 border border-accent/20">
                <Mail className="size-5 text-accent" />
              </div>
              <div>
                <p className="font-semibold text-sm">Email</p>
                <p className="text-xs text-muted-foreground">soporte@arcade.gg</p>
              </div>
            </CardContent>
          </Card>
          <Card className="gaming-card">
            <CardContent className="flex items-center gap-4 p-5">
              <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                <Clock className="size-5 text-yellow-400" />
              </div>
              <div>
                <p className="font-semibold text-sm">Horario</p>
                <p className="text-xs text-muted-foreground">24/7 para usuarios PRO</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ */}
        <section className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 border border-primary/20">
              <HelpCircle className="size-4 text-primary" />
            </div>
            <div>
              <h2 className="font-bold tracking-tight">Preguntas frecuentes</h2>
              <p className="text-xs text-muted-foreground">Las dudas más comunes de nuestros jugadores</p>
            </div>
          </div>

          <div className="space-y-2">
            {FAQ_ITEMS.map((item, i) => (
              <Card key={i} className="gaming-card">
                <button
                  className="w-full flex items-center justify-between p-4 text-left cursor-pointer"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="font-medium text-sm pr-4">{item.q}</span>
                  {openFaq === i ? (
                    <ChevronUp className="size-4 text-primary shrink-0" />
                  ) : (
                    <ChevronDown className="size-4 text-muted-foreground shrink-0" />
                  )}
                </button>
                {openFaq === i && (
                  <CardContent className="pt-0 pb-4 px-4">
                    <Separator className="bg-white/6 mb-3" />
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </section>

        {/* Link to public support */}
        <div className="flex justify-center">
          <a href="/faq" className="flex items-center gap-2 text-sm text-primary hover:underline">
            Ver todas las preguntas frecuentes
            <ExternalLink className="size-3.5" />
          </a>
        </div>
      </div>
    </div>
  )
}
