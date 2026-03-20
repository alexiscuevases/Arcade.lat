import { useEffect, useRef, useState } from "react"
import { Link } from "@tanstack/react-router"
import {
  ArrowLeft, Clock, Tag, BookOpen, Calendar, ArrowRight,
  Share2, Check,
} from "lucide-react"

// ─── Post content ──────────────────────────────────────────────────────────────

const posts: Record<string, BlogPost> = {
  "cloud-gaming-futuro": {
    slug: "cloud-gaming-futuro",
    category: "Tecnología",
    title: "El futuro del cloud gaming: por qué 2025 es el año definitivo",
    excerpt:
      "La latencia ultrabaja, los avances en compresión de video y la expansión de la fibra óptica están transformando el cloud gaming de una promesa a una realidad.",
    date: "15 mar 2025",
    readTime: "5 min",
    gradient: "from-primary/20 to-accent/10",
    content: [
      {
        type: "lead",
        text: "Durante años, el cloud gaming fue considerado una tecnología prometedora pero frustrantemente lejana. Latencia alta, compresión visible, cortes de conexión. En 2025, eso cambió.",
      },
      {
        type: "h2",
        text: "El problema histórico: la latencia",
      },
      {
        type: "p",
        text: "El mayor obstáculo del cloud gaming siempre fue el input lag. Un jugador espera que su acción (presionar un botón) se refleje en pantalla en menos de 20ms para no notar ningún retraso perceptible. En los primeros servicios de streaming, ese número rondaba los 80–120ms. Suficiente para arruinar cualquier juego competitivo.",
      },
      {
        type: "p",
        text: "La solución llegó de varias frentes simultáneas: servidores más cercanos al usuario (edge computing), protocolos de red optimizados para video en tiempo real (basados en WebRTC y variantes propietarias), y CPUs y GPUs con encoders de hardware ultrarrápidos capaces de comprimir un frame de 4K en menos de 2ms.",
      },
      {
        type: "h2",
        text: "La revolución de la compresión de video",
      },
      {
        type: "p",
        text: "El códec AV1 fue un cambio de paradigma. Donde H.264 necesitaba 50 Mbps para transmitir 4K con calidad aceptable, AV1 lo hace con 15–20 Mbps y mejor fidelidad visual. Esto no solo reduce el costo de infraestructura para los proveedores, sino que hace el cloud gaming accesible para usuarios con conexiones domésticas estándar.",
      },
      {
        type: "callout",
        text: "Con AV1, un usuario con fibra de 50 Mbps puede disfrutar de juegos en 4K HDR con una calidad indistinguible de tener el hardware localmente.",
      },
      {
        type: "h2",
        text: "La expansión de la fibra óptica",
      },
      {
        type: "p",
        text: "En América Latina, la penetración de fibra óptica al hogar creció un 340% entre 2020 y 2024. Regiones que antes dependían de ADSL o coaxial ahora tienen acceso a 300–1000 Mbps simétricos. Esto elimina la barrera de ancho de banda que frenaba la adopción del cloud gaming.",
      },
      {
        type: "p",
        text: "Combinado con la expansión de 5G en zonas urbanas, el cloud gaming móvil también dejó de ser una fantasía. En condiciones de 5G estable, la latencia de red se sitúa por debajo de los 10ms, suficiente para juegos de acción en tiempo real.",
      },
      {
        type: "h2",
        text: "¿Qué significa esto para ti?",
      },
      {
        type: "p",
        text: "Significa que en 2025, por primera vez, no necesitas una PC gamer de $1,500 ni una consola de $600 para jugar AAA con la máxima calidad. Una tablet de $200 con buena conexión te da la misma experiencia que el hardware más caro del mercado.",
      },
      {
        type: "p",
        text: "El acceso democrático al gaming de alto rendimiento ya no es una promesa de marketing. Es una realidad que Arcade y otros servicios están construyendo hoy.",
      },
    ],
    related: ["arcade-infraestructura", "optimizar-conexion"],
  },

  "optimizar-conexion": {
    slug: "optimizar-conexion",
    category: "Guías",
    title: "Cómo optimizar tu conexión para jugar en la nube",
    excerpt:
      "Pequeños ajustes en tu router y configuración de red pueden marcar una gran diferencia en tu experiencia de juego. Sigue estos pasos.",
    date: "8 mar 2025",
    readTime: "7 min",
    gradient: "from-blue-500/15 to-primary/10",
    content: [
      {
        type: "lead",
        text: "El cloud gaming depende de tu red tanto como del servidor. Con unos pocos ajustes, puedes reducir la latencia a la mitad y eliminar los micro-cortes que arruinan tus partidas.",
      },
      {
        type: "h2",
        text: "1. Usa cable Ethernet, siempre que puedas",
      },
      {
        type: "p",
        text: "El WiFi introduce variabilidad (jitter) que el cloud gaming no perdona. Un cable Cat5e o Cat6 de $10 puede reducir tu latencia de red en 5–15ms y eliminar por completo los micro-cortes por interferencia inalámbrica. Si tu dispositivo no tiene puerto Ethernet, un adaptador USB-C a RJ45 cuesta menos de $20.",
      },
      {
        type: "h2",
        text: "2. Si usas WiFi, conéctate a 5 GHz",
      },
      {
        type: "p",
        text: "La banda de 5 GHz tiene más canales disponibles, menos interferencia de vecinos y mayor velocidad a corta distancia. La mayoría de routers modernos la ofrecen. En configuración, busca el SSID que termina en '_5G' o '_5GHz' y conéctate a ese.",
      },
      {
        type: "callout",
        text: "Regla de oro: si estás a menos de 5 metros del router, 5 GHz > 2.4 GHz. Si estás lejos o hay paredes de por medio, considera un sistema de malla (mesh) o un repetidor.",
      },
      {
        type: "h2",
        text: "3. Activa QoS en tu router",
      },
      {
        type: "p",
        text: "Quality of Service (QoS) permite priorizar el tráfico de gaming sobre otros dispositivos de tu red. Si alguien en casa está haciendo una videollamada o descargando archivos, QoS se asegura de que tu juego tenga el ancho de banda necesario. La mayoría de routers con firmware OpenWrt o interfaces modernas lo tienen.",
      },
      {
        type: "h2",
        text: "4. Configura DNS de baja latencia",
      },
      {
        type: "p",
        text: "Tu DNS afecta la velocidad de conexión inicial al servidor. Cambia el DNS de tu router a 1.1.1.1 (Cloudflare) o 8.8.8.8 (Google). Ambos tienen latencias menores a 5ms desde la mayoría de regiones de América Latina.",
      },
      {
        type: "h2",
        text: "5. Cierra aplicaciones en background",
      },
      {
        type: "p",
        text: "Actualizaciones de Windows, backups de Google Drive, Dropbox sincronizando... todo eso consume ancho de banda y aumenta el jitter. Antes de una sesión, desactiva sincronizaciones automáticas o prográmalas para la noche.",
      },
      {
        type: "h2",
        text: "6. Haz un test de latencia a nuestros servidores",
      },
      {
        type: "p",
        text: "Desde el panel de Arcade, en Configuración → Conexión, puedes hacer un diagnóstico que mide tu latencia a los servidores de cada región. Te recomendará automáticamente la región óptima para tu ubicación.",
      },
      {
        type: "h2",
        text: "Tabla de requisitos de velocidad",
      },
      {
        type: "table",
        headers: ["Calidad", "Resolución", "FPS", "Mbps mínimo"],
        rows: [
          ["Básica", "720p", "30", "10 Mbps"],
          ["Estándar", "1080p", "60", "25 Mbps"],
          ["Alta", "1440p", "60", "35 Mbps"],
          ["Ultra", "4K", "60", "50 Mbps"],
        ],
      },
    ],
    related: ["cloud-gaming-futuro", "plan-pro-vale-la-pena"],
  },

  "nuevos-juegos-marzo": {
    slug: "nuevos-juegos-marzo",
    category: "Novedades",
    title: "Nuevos juegos disponibles en Arcade — Marzo 2025",
    excerpt:
      "Añadimos 8 nuevos títulos este mes, incluyendo los últimos AAA de los estudios más importantes. Descubre qué hay de nuevo en el catálogo.",
    date: "1 mar 2025",
    readTime: "3 min",
    gradient: "from-accent/15 to-purple-500/10",
    content: [
      {
        type: "lead",
        text: "Marzo llega con fuerza al catálogo de Arcade. Ocho nuevos títulos, incluyendo tres lanzamientos AAA de la primera semana del mes. Aquí el resumen completo.",
      },
      {
        type: "h2",
        text: "Los protagonistas del mes",
      },
      {
        type: "p",
        text: "Este mes agregamos una mezcla de juegos de acción, RPG y simulación que cubre un rango amplio de gustos. Todos disponibles desde el primer día en todos los planes de Arcade, sin costo adicional.",
      },
      {
        type: "gamelist",
        items: [
          {
            title: "Horizon: Forbidden West Complete Edition",
            genre: "Acción / RPG",
            desc: "La edición completa del épico RPG de Guerrilla Games, incluyendo la expansión Burning Shores. Exploración en mundo abierto con gráficos espectaculares que muestran todo el potencial de nuestra infraestructura 4K.",
          },
          {
            title: "Returnal",
            genre: "Roguelite / Acción",
            desc: "El aclamado roguelite de Housemarque llega a Arcade. Su exigente sistema de combate se beneficia enormemente de la baja latencia de nuestra plataforma.",
          },
          {
            title: "Ghostrunner 2",
            genre: "Acción / Plataformas",
            desc: "El cyberpunk parkour-slasher más exigente del género. A 60fps estables en servidores, cada run se siente perfectamente fluido.",
          },
          {
            title: "Baldur's Gate 3",
            genre: "RPG por turnos",
            desc: "El GOTY 2023 de Larian Studios finalmente en Arcade. Más de 100 horas de contenido, totalmente en español.",
          },
          {
            title: "Dave the Diver",
            genre: "Aventura / Simulación",
            desc: "Una de las sorpresas indie del año pasado. Buceo de día, gestión de sushi bar de noche. Ideal para sesiones cortas.",
          },
          {
            title: "Alan Wake 2",
            genre: "Terror / Thriller",
            desc: "Remedy Entertainment entrega su obra más ambiciosa. Técnicamente impresionante y narrativamente fascinante.",
          },
          {
            title: "Hades II (Early Access)",
            genre: "Roguelite",
            desc: "La secuela de uno de los mejores roguelites de la historia ya está disponible en acceso anticipado. El progreso se guarda en la nube.",
          },
          {
            title: "Pacific Drive",
            genre: "Survival / Conducción",
            desc: "Supervivencia en el noroeste pacífico con tu station wagon como compañero fiel. Atmosférico y único.",
          },
        ],
      },
      {
        type: "h2",
        text: "Juegos retirados este mes",
      },
      {
        type: "p",
        text: "Por acuerdos de licencia, tres títulos salieron del catálogo el 1 de marzo: Cyberpunk 2077 (temporalmente, mientras renegociamos), Watch Dogs Legion y Assassin's Creed Odyssey. Esperamos que Cyberpunk 2077 regrese antes de fin de mes.",
      },
      {
        type: "h2",
        text: "Lo que viene en abril",
      },
      {
        type: "p",
        text: "Ya podemos anticipar que en abril llegan al menos dos juegos muy esperados: uno de acción en mundo abierto de un gran estudio japonés, y un simulador de gestión que ha generado mucho buzz en redes. Más detalles próximamente.",
      },
    ],
    related: ["plan-pro-vale-la-pena", "gamepad-compatible"],
  },

  "plan-pro-vale-la-pena": {
    slug: "plan-pro-vale-la-pena",
    category: "Consejos",
    title: "¿Vale la pena el plan Pro? Un análisis honesto",
    excerpt:
      "Comparamos en detalle el plan Basic vs Pro para diferentes perfiles de jugador. ¿Cuándo tiene sentido pagar más?",
    date: "22 feb 2025",
    readTime: "6 min",
    gradient: "from-green-500/15 to-primary/10",
    content: [
      {
        type: "lead",
        text: "No vamos a venderte el plan más caro por defecto. Este análisis es honesto: el plan Pro vale la pena para algunos perfiles de jugador, y para otros el Free es más que suficiente.",
      },
      {
        type: "h2",
        text: "Qué incluye cada plan",
      },
      {
        type: "table",
        headers: ["Característica", "Free", "Basic", "Pro"],
        rows: [
          ["Precio", "$0/mes", "$9/mes", "$19/mes"],
          ["Horas diarias", "1 hora", "10 horas", "Ilimitado"],
          ["Resolución máxima", "720p", "1080p", "4K"],
          ["Cola de acceso", "Estándar", "Estándar", "Prioritaria"],
          ["Guardado en nube", "✓", "✓", "✓"],
          ["Soporte", "FAQ", "Email", "Chat en vivo"],
        ],
      },
      {
        type: "h2",
        text: "El plan Free: para quién es ideal",
      },
      {
        type: "p",
        text: "Si juegas menos de 1 hora al día o estás evaluando si el cloud gaming es para ti, el plan Free hace exactamente lo que promete. 720p a 30fps no es espectacular, pero es perfectamente jugable en una pantalla de 15' o menos. Perfecto para juegos de estrategia por turnos, RPGs, o aventuras gráficas donde la resolución importa menos que el gameplay.",
      },
      {
        type: "h2",
        text: "El plan Basic: el punto dulce",
      },
      {
        type: "p",
        text: "Por $9 al mes, el plan Basic cubre a la mayoría de jugadores casuales e intermedios. 10 horas diarias equivalen a más de 300 horas mensuales, suficiente para casi cualquier persona. 1080p a 60fps es la resolución estándar de la industria y se ve excelente en pantallas de hasta 27'.",
      },
      {
        type: "callout",
        text: "Para contexto: el jugador promedio en plataformas de streaming dedica entre 2 y 4 horas diarias. El plan Basic les sobra.",
      },
      {
        type: "h2",
        text: "El plan Pro: para quién realmente lo justifica",
      },
      {
        type: "p",
        text: "El Pro tiene sentido si: (1) juegas más de 10 horas diarias frecuentemente, (2) tienes una pantalla 4K y no quieres desperdiciarla, (3) juegas en horas pico y la cola prioritaria marca la diferencia, o (4) tu trabajo o entretenimiento gira en torno a los videojuegos.",
      },
      {
        type: "p",
        text: "Si eres streamer, creador de contenido, o simplemente alguien que juega todos los días varias horas, el Pro es la opción correcta. El 4K en Horizon o Alan Wake 2 es una experiencia visualmente diferente al 1080p.",
      },
      {
        type: "h2",
        text: "Nuestra recomendación",
      },
      {
        type: "p",
        text: "Empieza con Free. Si en una semana sientes que necesitas más tiempo o mejor calidad, sube a Basic. Si después de un mes de Basic estás frecuentemente topando con el límite de 10 horas o tienes pantalla 4K, entonces Pro vale cada centavo. No hay penalización por cambiar de plan en cualquier momento.",
      },
    ],
    related: ["nuevos-juegos-marzo", "cloud-gaming-futuro"],
  },

  "gamepad-compatible": {
    slug: "gamepad-compatible",
    category: "Hardware",
    title: "Los mejores gamepads compatibles con Arcade en 2025",
    excerpt:
      "Probamos más de 15 controladores para darte nuestra selección definitiva, desde opciones económicas hasta premium.",
    date: "10 feb 2025",
    readTime: "8 min",
    gradient: "from-orange-500/15 to-accent/10",
    content: [
      {
        type: "lead",
        text: "Arcade detecta automáticamente cualquier controlador compatible con HID estándar. Probamos 15 gamepads para recomendarte los mejores en cada rango de precio.",
      },
      {
        type: "h2",
        text: "Compatibilidad: lo que necesitas saber",
      },
      {
        type: "p",
        text: "Arcade funciona en el navegador vía la Web Gamepad API, que soporta cualquier controlador que aparezca como dispositivo HID (Human Interface Device) en tu sistema operativo. Esto incluye virtualmente todos los gamepads modernos conectados por USB o por Bluetooth.",
      },
      {
        type: "p",
        text: "Los controladores inalámbricos con su dongle USB propio (como los DualSense o Xbox con el adaptador USB) funcionan igual que por cable y tienen la misma latencia. Bluetooth directo añade 1–3ms de latencia adicional, imperceptible en la práctica.",
      },
      {
        type: "h2",
        text: "Nuestra selección por categoría",
      },
      {
        type: "padlist",
        items: [
          {
            name: "Xbox Series Controller",
            price: "$59",
            rating: 5,
            badge: "Recomendado",
            pros: ["Ergonomía perfecta", "Driver nativo en Windows", "Detección instantánea", "Gatillos de alta precisión"],
            cons: ["Requiere pilas AA (o kit de batería $25)"],
          },
          {
            name: "PlayStation DualSense",
            price: "$69",
            rating: 5,
            badge: "Premium",
            pros: ["Mejor calidad de construcción", "Gatillos adaptativos", "Bluetooth o USB"],
            cons: ["Vibración háptica no funciona en cloud", "Driver adicional en Windows"],
          },
          {
            name: "8BitDo Pro 2",
            price: "$49",
            rating: 4,
            badge: "Mejor relación calidad/precio",
            pros: ["Compatible con todo", "Botones traseros extra", "Batería interna", "Multi-platform"],
            cons: ["Diseño más compacto (no ideal manos grandes)"],
          },
          {
            name: "Gamesir G7 SE",
            price: "$39",
            rating: 4,
            badge: "Económico",
            pros: ["USB-C nativo", "Detección perfecta en Chrome", "Buena ergonomía"],
            cons: ["Sin Bluetooth", "Build quality básica"],
          },
          {
            name: "Logitech F310",
            price: "$25",
            rating: 3,
            badge: "Budget",
            pros: ["Precio imbatible", "USB universal", "Sin setup"],
            cons: ["Calidad de botones mediocre", "Sin vibración en cloud gaming"],
          },
        ],
      },
      {
        type: "h2",
        text: "¿Qué pasa con el teclado y ratón?",
      },
      {
        type: "p",
        text: "Los juegos que tienen soporte nativo de teclado y ratón (la mayoría de FPS y RTS) funcionan perfectamente. El input se captura directamente por el navegador. Para juegos que solo admiten gamepad, recomendamos un emulador de teclado a gamepad como AntiMicroX, aunque en Arcade ya configuramos la mayoría de juegos para aceptar ambos.",
      },
      {
        type: "h2",
        text: "Mandos que no recomendamos",
      },
      {
        type: "p",
        text: "Controladores de marcas blancas con chipsets poco comunes a veces tienen problemas de detección en la Web Gamepad API. Si tu mando no aparece en Arcade, prueba reconectarlo o visita gamepad-tester.com para verificar que tu sistema operativo lo detecta correctamente antes de reportar el problema.",
      },
    ],
    related: ["optimizar-conexion", "nuevos-juegos-marzo"],
  },

  "arcade-infraestructura": {
    slug: "arcade-infraestructura",
    category: "Tecnología",
    title: "Detrás de Arcade: cómo funciona nuestra infraestructura",
    excerpt:
      "Una mirada técnica a cómo gestionamos las instancias virtuales, el streaming de video y la sincronización de input para ofrecer la menor latencia posible.",
    date: "28 ene 2025",
    readTime: "10 min",
    gradient: "from-primary/15 to-cyan-500/10",
    content: [
      {
        type: "lead",
        text: "Cuando haces click en 'Jugar', ocurren decenas de cosas en nuestra infraestructura en menos de 10 segundos. Este artículo explica, con un nivel de detalle técnico moderado, cómo funciona todo.",
      },
      {
        type: "h2",
        text: "El stack de infraestructura",
      },
      {
        type: "p",
        text: "Arcade se apoya en GPUs NVIDIA RTX 4000 Series alojadas en datacenters distribuidos en tres regiones: Norteamérica, Europa y América Latina. Cada instancia de juego corre en un contenedor aislado con acceso directo a la GPU (GPU passthrough), sin virtualización de nivel de hipervisor que añada latencia.",
      },
      {
        type: "p",
        text: "El orquestador de instancias está construido sobre Kubernetes con un scheduler personalizado que considera la ubicación geográfica del usuario, la carga actual de cada nodo, y el perfil de recursos del juego (algunos necesitan más VRAM que CPU, otros lo contrario) para asignar la instancia óptima.",
      },
      {
        type: "h2",
        text: "El pipeline de streaming de video",
      },
      {
        type: "p",
        text: "El juego corre en el servidor y produce frames a la resolución y tasa configurada (hasta 4K@60fps). Esos frames pasan por un encoder de hardware NVENC (el encoder integrado en la GPU), que los comprime a H.264, H.265 o AV1 según las capacidades del cliente y las condiciones de red.",
      },
      {
        type: "callout",
        text: "NVENC puede encodear un frame 4K en menos de 2ms, lo que es esencial para mantener el pipeline de latencia total por debajo de 20ms.",
      },
      {
        type: "p",
        text: "El stream de video se envía via WebRTC con nuestro propio servidor TURN/STUN. WebRTC usa UDP como protocolo de transporte, que a diferencia de TCP no reintenta paquetes perdidos. Para video en tiempo real esto es correcto: un frame llegado tarde es peor que un frame perdido.",
      },
      {
        type: "h2",
        text: "Sincronización de input",
      },
      {
        type: "p",
        text: "Tu input (teclado, ratón, gamepad) se captura en el navegador y se envía al servidor via el mismo canal WebRTC en el sentido contrario. El servidor aplica el input al juego y genera el siguiente frame con ese input ya incorporado.",
      },
      {
        type: "p",
        text: "Para reducir la latencia percibida, implementamos prediction del lado del cliente para movimientos de cámara y ciertos inputs de movimiento, similar a las técnicas usadas en juegos multijugador online. Esto hace que la experiencia se sienta más fluida incluso con 20–30ms de latencia de red real.",
      },
      {
        type: "h2",
        text: "Gestión de sesiones y guardado",
      },
      {
        type: "p",
        text: "Cada sesión tiene un estado persistente almacenado en nuestra base de datos distribuida. Al pausar o cerrar el juego, el estado del save se sincroniza automáticamente. Los save files se almacenan cifrados y versionados: puedes volver a un estado anterior si algo sale mal.",
      },
      {
        type: "h2",
        text: "El desafío de la escalabilidad",
      },
      {
        type: "p",
        text: "El mayor reto técnico no es el streaming en sí, sino la escala. En momentos de pico (viernes por la noche, lanzamientos grandes), podemos tener miles de usuarios conectados simultáneamente. Nuestro sistema de auto-scaling puede aprovisionar nuevas instancias en ~8 segundos, aunque mantenemos un pool caliente de instancias pre-iniciadas para los primeros usuarios en cola.",
      },
      {
        type: "p",
        text: "Esto es lo que diferencia el plan Pro: los usuarios Pro tienen acceso al pool caliente, mientras que los usuarios Free y Basic pueden esperar un poco más en momentos de alta demanda.",
      },
    ],
    related: ["cloud-gaming-futuro", "optimizar-conexion"],
  },
}

// ─── Types ─────────────────────────────────────────────────────────────────────

type ContentBlock =
  | { type: "lead" | "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "callout"; text: string }
  | { type: "table"; headers: string[]; rows: string[][] }
  | { type: "gamelist"; items: { title: string; genre: string; desc: string }[] }
  | { type: "padlist"; items: { name: string; price: string; rating: number; badge: string; pros: string[]; cons: string[] }[] }

type BlogPost = {
  slug: string
  category: string
  title: string
  excerpt: string
  date: string
  readTime: string
  gradient: string
  content: ContentBlock[]
  related: string[]
}

// ─── Hooks ─────────────────────────────────────────────────────────────────────

function useScrollProgress() {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    const handler = () => {
      const scrolled = window.scrollY
      const total = document.documentElement.scrollHeight - window.innerHeight
      setProgress(total > 0 ? (scrolled / total) * 100 : 0)
    }
    window.addEventListener("scroll", handler, { passive: true })
    return () => window.removeEventListener("scroll", handler)
  }, [])
  return progress
}

// ─── Components ────────────────────────────────────────────────────────────────

function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
  return (
    <div className="space-y-6">
      {blocks.map((block, i) => {
        if (block.type === "lead") {
          return (
            <p key={i} className="text-lg text-foreground/90 leading-relaxed font-medium border-l-2 border-primary pl-4">
              {block.text}
            </p>
          )
        }
        if (block.type === "h2") {
          return (
            <h2 key={i} className="text-xl font-bold text-foreground mt-10 mb-2 first:mt-0">
              {block.text}
            </h2>
          )
        }
        if (block.type === "p") {
          return (
            <p key={i} className="text-sm text-muted-foreground leading-relaxed">
              {block.text}
            </p>
          )
        }
        if (block.type === "callout") {
          return (
            <div
              key={i}
              className="rounded-xl border border-primary/25 bg-primary/6 px-5 py-4 relative overflow-hidden"
            >
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 80% at 0% 50%, oklch(0.76 0.19 196 / 8%), transparent)" }}
              />
              <p className="text-sm text-foreground/90 leading-relaxed relative z-10 italic">"{block.text}"</p>
            </div>
          )
        }
        if (block.type === "table") {
          return (
            <div key={i} className="overflow-x-auto rounded-xl border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-card/40">
                    {block.headers.map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {block.rows.map((row, ri) => (
                    <tr key={ri} className={`border-b border-border/30 last:border-0 ${ri % 2 === 1 ? "bg-card/20" : ""}`}>
                      {row.map((cell, ci) => (
                        <td key={ci} className={`px-4 py-2.5 text-xs ${ci === 0 ? "font-medium text-foreground" : "text-muted-foreground"}`}>
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        if (block.type === "gamelist") {
          return (
            <div key={i} className="space-y-3">
              {block.items.map((game) => (
                <div key={game.title} className="gaming-card rounded-xl p-4 flex gap-4 hover:border-primary/30 transition-colors">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-lg border border-primary/20 bg-primary/8">
                    <BookOpen className="size-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="text-sm font-semibold">{game.title}</span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full border border-accent/30 bg-accent/8 text-accent font-medium">
                        {game.genre}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{game.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )
        }
        if (block.type === "padlist") {
          return (
            <div key={i} className="space-y-4">
              {block.items.map((pad) => (
                <div key={pad.name} className="gaming-card rounded-xl p-5 hover:border-primary/30 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-semibold">{pad.name}</span>
                        {pad.badge && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border border-primary/30 bg-primary/8 text-primary font-medium">
                            {pad.badge}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1 mt-1">
                        {Array.from({ length: 5 }).map((_, si) => (
                          <div
                            key={si}
                            className={`size-1.5 rounded-full ${si < pad.rating ? "bg-primary" : "bg-border"}`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="text-sm font-mono font-bold text-primary shrink-0">{pad.price}</span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-muted-foreground/60 mb-1.5 font-medium">Pros</p>
                      <ul className="space-y-1">
                        {pad.pros.map((p) => (
                          <li key={p} className="flex items-center gap-1.5 text-muted-foreground">
                            <Check className="size-3 text-primary shrink-0" />
                            {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-muted-foreground/60 mb-1.5 font-medium">Contras</p>
                      <ul className="space-y-1">
                        {pad.cons.map((c) => (
                          <li key={c} className="flex items-center gap-1.5 text-muted-foreground">
                            <span className="size-3 shrink-0 text-center text-[10px] text-muted-foreground/50">—</span>
                            {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        }
        return null
      })}
    </div>
  )
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function BlogPostPage({ slug }: { slug: string }) {
  const progress = useScrollProgress()
  const [copied, setCopied] = useState(false)
  const post = posts[slug]

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  if (!post) {
    return (
      <div className="min-h-[60svh] flex flex-col items-center justify-center gap-4 px-6">
        <BookOpen className="size-10 text-muted-foreground/30" />
        <p className="text-muted-foreground text-sm">Artículo no encontrado.</p>
        <Link to="/blog" className="text-primary text-sm hover:underline flex items-center gap-1.5">
          <ArrowLeft className="size-3.5" />
          Volver al blog
        </Link>
      </div>
    )
  }

  const relatedPosts = post.related.map((s) => posts[s]).filter(Boolean)

  return (
    <div className="overflow-x-hidden">
      {/* Scroll progress */}
      <div className="fixed top-0 left-0 right-0 h-0.5 z-50 bg-border/20 pointer-events-none">
        <div
          className="h-full bg-primary transition-[width] duration-75"
          style={{ width: `${progress}%`, boxShadow: "0 0 8px oklch(0.76 0.19 196 / 70%)" }}
        />
      </div>

      {/* ─── Cover ─── */}
      <div className={`relative pt-24 pb-14 bg-gradient-to-br ${post.gradient} overflow-hidden`}>
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(oklch(1 0 0 / 3%) 1px, transparent 1px), linear-gradient(90deg, oklch(1 0 0 / 3%) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        <div className="absolute inset-0 bg-background/70 pointer-events-none" />

        <div className="relative z-10 max-w-3xl mx-auto px-6">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors mb-6"
          >
            <ArrowLeft className="size-3.5" />
            Blog
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary/10 border border-primary/25 text-primary text-xs font-medium">
              <Tag className="size-3" />
              {post.category}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="size-3" />
              {post.date}
            </span>
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="size-3" />
              {post.readTime} de lectura
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-bold leading-tight mb-4">{post.title}</h1>
          <p className="text-base text-muted-foreground leading-relaxed max-w-2xl">{post.excerpt}</p>
        </div>
      </div>

      {/* ─── Body ─── */}
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div className="grid lg:grid-cols-[1fr_200px] gap-10 items-start">
          {/* Article content */}
          <article>
            <ContentRenderer blocks={post.content} />
          </article>

          {/* Sidebar */}
          <aside className="lg:sticky lg:top-24 space-y-4">
            {/* Share */}
            <div className="gaming-card rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Compartir</p>
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border text-xs hover:border-primary/40 hover:text-primary transition-colors"
              >
                {copied ? <Check className="size-3.5 text-primary" /> : <Share2 className="size-3.5" />}
                {copied ? "¡Copiado!" : "Copiar enlace"}
              </button>
            </div>

            {/* CTA */}
            <div className="gaming-card rounded-xl p-4 space-y-3 relative overflow-hidden">
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse 80% 80% at 50% 0%, oklch(0.76 0.19 196 / 8%), transparent)" }}
              />
              <p className="text-xs font-semibold relative z-10">¿Listo para jugar?</p>
              <p className="text-xs text-muted-foreground relative z-10">Prueba Arcade gratis, sin tarjeta.</p>
              <Link
                to="/register"
                className="relative z-10 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:opacity-90 transition-opacity"
              >
                Empezar gratis
                <ArrowRight className="size-3" />
              </Link>
            </div>
          </aside>
        </div>

        {/* ─── Related posts ─── */}
        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-border/50">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-6">
              Artículos relacionados
            </h2>
            <div className="grid sm:grid-cols-2 gap-4">
              {relatedPosts.map((rel) => (
                <Link
                  key={rel.slug}
                  to={`/blog/${rel.slug}` as never}
                  className="gaming-card rounded-xl p-5 hover:border-primary/40 transition-colors group block"
                >
                  <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border border-border bg-card text-muted-foreground mb-3">
                    <Tag className="size-2.5" />
                    {rel.category}
                  </span>
                  <p className="text-sm font-medium leading-snug group-hover:text-primary transition-colors">{rel.title}</p>
                  <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                    <Clock className="size-3" />
                    {rel.readTime}
                    <ArrowRight className="size-3 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Back link */}
        <div className="mt-10">
          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="size-3.5" />
            Volver a todos los artículos
          </Link>
        </div>
      </div>
    </div>
  )
}
