import { useNavigate } from "@tanstack/react-router"
import { useQuery } from "@tanstack/react-query"
import { cn } from "@/shared/lib/utils"
import { Badge } from "@/shared/components/ui/badge"
import { Users, Play } from "lucide-react"
import { api } from "@/shared/lib/api"

interface GameCatalogProps {
  disabled?: boolean
}

export function GameCatalog({ disabled }: GameCatalogProps) {
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({
    queryKey: ["games"],
    queryFn: api.games.list,
  })

  const games = data?.games ?? []

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="aspect-3/4 rounded-2xl bg-white/3 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
      {games.map((game) => (
        <button
          key={game.id}
          onClick={() => !disabled && navigate({ to: "/game/$gameId", params: { gameId: game.id } })}
          disabled={disabled}
          className={cn(
            "group relative rounded-2xl overflow-hidden aspect-3/4 text-left transition-all duration-300",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            "hover:scale-[1.03] active:scale-[0.99]",
            "border border-white/6 hover:border-primary/50",
            "hover:shadow-[0_8px_40px_oklch(0.76_0.19_196/25%)]",
            disabled && "cursor-not-allowed opacity-40",
          )}
        >
          {/* Gradient background */}
          <div className={cn("absolute inset-0 bg-linear-to-br", game.gradient)} />

          {/* Persistent dark gradient bottom */}
          <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/10" />

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/8 transition-colors duration-300" />

          {/* Play button — centered, shows on hover */}
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <div className="flex size-14 items-center justify-center rounded-full bg-black/60 border border-primary/60 backdrop-blur-sm shadow-[0_0_20px_oklch(0.76_0.19_196/40%)]">
              <Play className="size-5 text-primary fill-primary ml-0.5" />
            </div>
          </div>

          {/* Content */}
          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2">
            <p className="text-white font-bold text-base leading-tight line-clamp-2">
              {game.title}
            </p>
            <div className="flex items-center justify-between gap-1">
              <Badge className="text-[10px] px-2 py-0.5 bg-black/50 text-white/80 border border-white/15 backdrop-blur-sm">
                {game.genre}
              </Badge>
              <span className="text-[10px] text-white/50 flex items-center gap-1">
                <Users className="size-2.5" />
                {game.players}
              </span>
            </div>
          </div>

          {/* Top shimmer on hover */}
          <div className="absolute top-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-primary/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </button>
      ))}
    </div>
  )
}
