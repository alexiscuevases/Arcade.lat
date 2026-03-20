import { useState } from "react"
import { MessageCircle, ChevronDown, Send } from "lucide-react"
import { Card, CardHeader, CardTitle } from "@/shared/components/ui/card"
import { Button } from "@/shared/components/ui/button"
import { Input } from "@/shared/components/ui/input"
import { Badge } from "@/shared/components/ui/badge"
import { Separator } from "@/shared/components/ui/separator"
import { cn } from "@/shared/lib/utils"
import { getUser } from "@/shared/lib/auth"

interface ChatMessage {
  id: number
  from: "user" | "bot"
  text: string
}

const BOT_RESPONSES = [
  "¡Hola! Soy el asistente de Arcade. ¿En qué puedo ayudarte?",
  "Entiendo tu consulta. Déjame verificar eso para ti.",
  "Para problemas técnicos, te recomiendo revisar nuestra sección de FAQ. Si el problema persiste, un agente humano se conectará contigo pronto.",
  "¿Hay algo más en lo que pueda ayudarte?",
]

export function ChatWidget() {
  const user = getUser()
  const [chatOpen, setChatOpen] = useState(false)
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: 0, from: "bot", text: `¡Hola ${user?.email?.split("@")[0] ?? "jugador"}! Soy el asistente de Arcade. ¿En qué puedo ayudarte hoy?` },
  ])
  const [chatInput, setChatInput] = useState("")
  const [botIndex, setBotIndex] = useState(1)

  function sendMessage() {
    const text = chatInput.trim()
    if (!text) return

    const userMsg: ChatMessage = { id: Date.now(), from: "user", text }
    setChatMessages((prev) => [...prev, userMsg])
    setChatInput("")

    setTimeout(() => {
      setChatMessages((prev) => [
        ...prev,
        { id: Date.now() + 1, from: "bot", text: BOT_RESPONSES[botIndex % BOT_RESPONSES.length] },
      ])
      setBotIndex((i) => i + 1)
    }, 800)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {chatOpen && (
        <Card className="w-80 sm:w-96 border border-white/10 bg-card shadow-2xl shadow-black/40 rounded-2xl overflow-hidden">
          <CardHeader className="p-4 pb-2 flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-full bg-primary/15 border border-primary/20">
                <MessageCircle className="size-4 text-primary" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold">Chat de soporte</CardTitle>
                <p className="text-xs text-muted-foreground">En línea</p>
              </div>
            </div>
            <Badge className="bg-green-500/10 text-green-400 border-green-500/30 text-[10px]">
              <span className="size-1.5 rounded-full bg-green-400 mr-1 animate-pulse" />
              Online
            </Badge>
          </CardHeader>

          <Separator className="bg-white/6" />

          <div className="h-64 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "max-w-[80%] rounded-2xl px-3.5 py-2 text-sm",
                  msg.from === "user"
                    ? "ml-auto bg-primary text-primary-foreground rounded-br-md"
                    : "bg-white/5 border border-white/8 rounded-bl-md",
                )}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <Separator className="bg-white/6" />

          <form
            className="flex items-center gap-2 p-3"
            onSubmit={(e) => {
              e.preventDefault()
              sendMessage()
            }}
          >
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Escribe tu mensaje…"
              className="flex-1 h-9 text-sm bg-white/5 border-white/8"
            />
            <Button type="submit" size="sm" className="size-9 p-0 shrink-0">
              <Send className="size-4" />
            </Button>
          </form>
        </Card>
      )}

      <button
        onClick={() => setChatOpen((v) => !v)}
        className={cn(
          "flex size-14 items-center justify-center rounded-full shadow-lg transition-all duration-200",
          chatOpen
            ? "bg-white/10 border border-white/20 hover:bg-white/15"
            : "bg-primary hover:bg-primary/90 glow-cyan",
        )}
      >
        {chatOpen ? (
          <ChevronDown className="size-5" />
        ) : (
          <MessageCircle className="size-6 text-primary-foreground" />
        )}
      </button>
    </div>
  )
}
