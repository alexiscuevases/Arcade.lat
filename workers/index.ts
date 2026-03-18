// Durable Object class must be exported as a named export
export { QueueManager } from "./queue-manager"

// Workers must have a default export with at least a fetch handler.
// Direct requests to this worker are not intended — only the DO is used.
export default {
  fetch(): Response {
    return new Response("arcade-queue-worker: use the Durable Object", {
      status: 400,
    })
  },
}
