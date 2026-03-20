import { Link } from "@tanstack/react-router"
import { Gamepad2, Github, Twitter } from "lucide-react"

const links = {
  product: [
    { label: "Características", to: "/features" },
    { label: "Precios", to: "/pricing" },
  ],
  legal: [
    { label: "Términos", to: "/terms" },
    { label: "Privacidad", to: "/privacy" },
    { label: "Cookies", to: "/cookies" },
    { label: "Reembolso", to: "/refund" },
    { label: "Disclaimers", to: "/disclaimers" },
  ],
  resources: [
    { label: "Blog", to: "/blog" },
    { label: "FAQ", to: "/faq" },
    { label: "Soporte", to: "/support" },
    { label: "Acerca de", to: "/about" },
  ],
}

export function Footer() {
  return (
    <footer className="relative mt-auto border-t border-white/6 overflow-hidden">
      {/* subtle glow top edge */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent, oklch(0.76 0.19 196 / 40%), transparent)" }}
      />

      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex size-7 items-center justify-center rounded-md bg-primary/15 border border-primary/25">
                <Gamepad2 className="size-4 text-primary" />
              </div>
              <span className="font-bold text-foreground font-nasalization tracking-tight">Arcade</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed max-w-[180px]">
              Cloud gaming sin descargas. Juega AAA desde cualquier dispositivo.
            </p>
            <div className="flex items-center gap-3 pt-1">
              {[
                { icon: Twitter, label: "Twitter" },
                { icon: Github, label: "GitHub" },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="flex size-7 items-center justify-center rounded-md border border-white/8 text-muted-foreground hover:text-primary hover:border-primary/30 hover:bg-primary/5 transition-colors duration-200"
                >
                  <Icon className="size-3.5" />
                </button>
              ))}
            </div>
          </div>

          {/* Product */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Producto</p>
            <ul className="space-y-2">
              {links.product.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Recursos</p>
            <ul className="space-y-2">
              {links.resources.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground/60">Legal</p>
            <ul className="space-y-2">
              {links.legal.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="text-sm text-muted-foreground hover:text-foreground transition-colors duration-150"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-6 border-t border-white/6">
          <p className="text-xs text-muted-foreground/50">
            © 2025 Arcade Cloud Gaming. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-1.5">
            <span className="inline-block size-1.5 rounded-full bg-primary animate-pulse" />
            <span className="text-xs text-muted-foreground/50">Todos los sistemas operativos</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
