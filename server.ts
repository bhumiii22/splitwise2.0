import { createServer } from "http"
import { parse } from "url"
import next from "next"
import { Server } from "socket.io"

const dev = process.env.NODE_ENV !== "production"
const app = next({ dev })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  // Plain HTTP server — handles all normal Next.js requests
  const httpServer = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true)
    handle(req, res, parsedUrl)
  })

  // Attach Socket.io to the SAME server
  const io = new Server(httpServer, {
    path: "/api/socketio",
    cors: { origin: "*" },
  })

  // Store io globally so any API route can broadcast through it
  ;(global as any).io = io

  io.on("connection", (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`)

    // Client tells server "I'm viewing this group" → joins that room
    socket.on("join-group", (groupId: string) => {
      socket.join(`group:${groupId}`)
      console.log(`[Socket] ${socket.id} joined group:${groupId}`)
    })

    // Client leaves the page → leaves the room
    socket.on("leave-group", (groupId: string) => {
      socket.leave(`group:${groupId}`)
    })

    socket.on("disconnect", () => {
      console.log(`[Socket] Disconnected: ${socket.id}`)
    })
  })

  httpServer.listen(3000, () => {
    console.log("✅ Ready on http://localhost:3000")
    console.log("✅ Socket.io ready on /api/socketio")
  })
})