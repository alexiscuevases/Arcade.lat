import { useState, useRef, useCallback, useEffect } from "react"
import { Link } from "@tanstack/react-router"
import { BookOpen, Clock, Tag, ArrowRight, Rss } from "lucide-react"

const posts = [
  {
    slug: "cloud-gaming-futuro",
    category: "Tecnología",
    title: "El futuro del cloud gaming: por qué 2025 es el año definitivo",
    excerpt: "La latencia ultrabaja, los avances en compresión de video y la expansión de la fibra óptica están transformando el cloud gaming de una promesa a una realidad. Te contamos por qué.",
    date: "15 mar 2025",
    readTime: "5 min",
    featured: true,
    gradient: "from-primary/20 to-accent/10",
  },
  {
    slug: "optimizar-conexion",
    category: "Guías",
    title: "Cómo optimizar tu conexión para jugar en la nube",
    excerpt: "Pequeños ajustes en tu router y configuración de red pueden marcar una gran diferencia en tu experiencia de juego. Sigue estos pasos.",
    date: "8 mar 2025",
    readTime: "7 min",
    featured: false,
    gradient: "from-blue-500/15 to-primary/10",
  },
  {
    slug: "nuevos-juegos-marzo",
    category: "Novedades",
    title: "Nuevos juegos disponibles en Arcade — Marzo 2025",
    excerpt: "Añadimos 8 nuevos títulos este mes, incluyendo los últimos AAA de los estudios más importantes. Descubre qué hay de nuevo en el catálogo.",
    date: "1 mar 2025",
    readTime: "3 min",
    featured: false,
    gradient: "from-accent/15 to-purple-500/10",
  },
  {
    slug: "plan-pro-vale-la-pena",
    category: "Consejos",
    title: "¿Vale la pena el plan Pro? Un análisis honesto",
    excerpt: "Comparamos en detalle el plan Basic vs Pro para diferentes perfiles de jugador. ¿Cuándo tiene sentido pagar más?",
    date: "22 feb 2025",
    readTime: "6 min",
    featured: false,
    gradient: "from-green-500/15 to-primary/10",
  },
  {
    slug: "gamepad-compatible",
    category: "Hardware",
    title: "Los mejores gamepads compatibles con Arcade en 2025",
    excerpt: "Probamos más de 15 controladores para darte nuestra selección definitiva, desde opciones económicas hasta premium.",
    date: "10 feb 2025",
    readTime: "8 min",
    featured: false,
    gradient: "from-orange-500/15 to-accent/10",
  },
  {
    slug: "arcade-infraestructura",
    category: "Tecnología",
    title: "Detrás de Arcade: cómo funciona nuestra infraestructura",
    excerpt: "Una mirada técnica a cómo gestionamos las instancias virtuales, el streaming de video y la sincronización de input para ofrecer la menor latencia posible.",
    date: "28 ene 2025",
    readTime: "10 min",
    featured: false,
    gradient: "from-primary/15 to-cyan-500/10",
  },
]

const allCategories = ["Todos", ...Array.from(new Set(posts.map(p => p.category)))]

const BG_PARTICLES = Array.from({ length: 16 }, (_, i) => ({
  id: i,
  left: `${(i * 6.23 + 7) % 100}%`,
  top: `${(i * 8.41 + 10) % 100}%`,
  size: (i % 3) + 1.5,
  duration: 8 + (i % 5) * 1.2,
  delay: -((i % 7) * 0.9),
  opacity: 0.07 + (i % 4) * 0.04,
  color: i % 3 === 0 ? "oklch(0.76 0.19 196)" : "oklch(0.62 0.26 300)",
}))

function useInView(threshold = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true) },
      { threshold }
    )
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, visible] as const
}



function PostCard({ post, index, featured = false }: { post: (typeof posts)[number]; index: number; featured?: boolean }) {
  const [ref, visible] = useInView()
  return (
    <div
      ref={ref}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(24px)",
        transition: `opacity 0.55s ease ${index * 70}ms, transform 0.55s ease ${index * 70}ms`,
      }}
      className={featured ? "sm:col-span-2" : ""}
    >
      <Link to={`/blog/${post.slug}` as never} className="gaming-card rounded-xl overflow-hidden hover:border-primary/40 transition-colors duration-200 group flex flex-col h-full">
        {/* Cover placeholder */}
        <div className={`h-40 ${featured ? "sm:h-52" : ""} bg-linear-to-br ${post.gradient} relative overflow-hidden`}>
          <div className="absolute inset-0 flex items-center justify-center opacity-20">
            <BookOpen className={`${featured ? "size-20" : "size-14"} text-white`} />
          </div>
          <div className="absolute top-3 left-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-background/60 backdrop-blur-sm text-xs font-medium border border-white/10">
              <Tag className="size-2.5" />
              {post.category}
            </span>
          </div>
        </div>

        <div className="p-5 flex flex-col gap-3 flex-1">
          <h3 className={`font-semibold leading-snug group-hover:text-primary transition-colors duration-200 ${featured ? "text-lg" : "text-sm"}`}>
            {post.title}
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{post.excerpt}</p>
          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <span>{post.date}</span>
              <span className="flex items-center gap-1">
                <Clock className="size-3" />
                {post.readTime}
              </span>
            </div>
            <ArrowRight className="size-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200 -translate-x-1 group-hover:translate-x-0" style={{ transition: "opacity 0.2s, transform 0.2s" }} />
          </div>
        </div>
      </Link>
    </div>
  )
}

export function BlogPage() {
  const [mouse, setMouse] = useState({ x: 50, y: 30 })
  const heroRef = useRef<HTMLDivElement>(null)
  const [activeCategory, setActiveCategory] = useState("Todos")

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = heroRef.current?.getBoundingClientRect()
    if (!rect) return
    setMouse({
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    })
  }, [])

  const filtered = activeCategory === "Todos" ? posts : posts.filter(p => p.category === activeCategory)

  return (
    <div className="overflow-x-hidden">
      

      {/* ─── HERO ─── */}
      <section
        ref={heroRef}
        onMouseMove={handleMouseMove}
        className="relative pt-24 pb-14 flex flex-col items-center overflow-hidden px-6"
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0 / 4%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 4%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }} />
        <div className="absolute inset-0 pointer-events-none transition-all duration-200"
          style={{ background: `radial-gradient(ellipse 55% 55% at ${mouse.x}% ${mouse.y}%, oklch(0.76 0.19 196 / 10%), transparent)` }} />
        <div className="absolute top-1/4 right-1/5 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: "oklch(0.76 0.19 196 / 6%)", filter: "blur(60px)", animation: "blogOrb1 11s ease-in-out infinite" }} />
        <div className="absolute bottom-0 left-1/5 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "oklch(0.62 0.26 300 / 5%)", filter: "blur(80px)", animation: "blogOrb2 14s ease-in-out infinite" }} />

        {BG_PARTICLES.map((p) => (
          <div key={p.id} className="absolute rounded-full pointer-events-none"
            style={{
              left: p.left, top: p.top,
              width: `${p.size}px`, height: `${p.size}px`,
              background: p.color, opacity: p.opacity,
              animation: `particleFloat ${p.duration}s ease-in-out ${p.delay}s infinite`,
              boxShadow: `0 0 ${p.size * 3}px ${p.color}`,
            }} />
        ))}

        <div className="relative z-10 text-center max-w-2xl mx-auto space-y-5">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-primary/30 bg-primary/8 text-primary text-sm font-medium">
            <Rss className="w-3.5 h-3.5" />
            Blog de Arcade
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
            Noticias &{" "}
            <span className="text-primary" style={{ textShadow: "0 0 24px oklch(0.76 0.19 196 / 60%)" }}>
              Guías
            </span>
          </h1>
          <p className="text-muted-foreground text-base">
            Lo último en cloud gaming, tutoriales, novedades del catálogo y análisis técnicos del equipo de Arcade.
          </p>
        </div>
      </section>

      {/* ─── FILTERS ─── */}
      <section className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex flex-wrap gap-2 justify-center">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-all duration-200 ${
                activeCategory === cat
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </section>

      {/* ─── POSTS GRID ─── */}
      <section className="max-w-5xl mx-auto px-6 py-24">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((post, i) => (
            <PostCard key={post.slug} post={post} index={i} featured={i === 0 && activeCategory === "Todos"} />
          ))}
        </div>
        {filtered.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="size-10 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay artículos en esta categoría aún.</p>
          </div>
        )}
      </section>

      <style>{`
        @keyframes blogOrb1 {
          0%, 100% { transform: translateY(0) translateX(0); }
          40% { transform: translateY(-16px) translateX(10px); }
          70% { transform: translateY(10px) translateX(-8px); }
        }
        @keyframes blogOrb2 {
          0%, 100% { transform: translateY(0) translateX(0); }
          35% { transform: translateY(14px) translateX(-12px); }
          65% { transform: translateY(-8px) translateX(10px); }
        }
        @keyframes particleFloat {
          0%, 100% { transform: translateY(0) translateX(0) scale(1); }
          25% { transform: translateY(-14px) translateX(8px) scale(1.2); }
          50% { transform: translateY(-5px) translateX(-9px) scale(0.9); }
          75% { transform: translateY(11px) translateX(4px) scale(1.1); }
        }
      `}</style>
    </div>
  )
}
