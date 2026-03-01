import http from "node:http"
import { executeCouncil, formatCouncilOutput, checkServerHealth, type CouncilResult } from "./council.js"

// ============================================================================
// CONFIGURATION
// ============================================================================

const PROXY_PORT = parseInt(process.env.PROXY_PORT || "4097", 10)
const OPENCODE_URL = process.env.OPENCODE_URL || "http://127.0.0.1:4096"
const OPENCODE_HOST = new URL(OPENCODE_URL).host

// ============================================================================
// HELPERS
// ============================================================================

async function parseJsonBody<T>(req: http.IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = ""
    req.on("data", (chunk: Buffer) => { body += chunk.toString() })
    req.on("end", () => {
      try {
        resolve(JSON.parse(body) as T)
      } catch {
        reject(new Error("Invalid JSON body"))
      }
    })
    req.on("error", reject)
  })
}

function sendJson(res: http.ServerResponse, status: number, data: unknown): void {
  res.writeHead(status, { "Content-Type": "application/json" })
  res.end(JSON.stringify(data))
}

// ============================================================================
// PROXY HANDLER
// ============================================================================

function proxyToOpencode(req: http.IncomingMessage, res: http.ServerResponse): void {
  const url = new URL(req.url || "/", OPENCODE_URL)
  
  const proxyReq = http.request(url, {
    method: req.method,
    headers: {
      ...req.headers,
      host: OPENCODE_HOST,
    },
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode || 500, proxyRes.headers)
    proxyRes.pipe(res)
  })
  
  req.pipe(proxyReq)
  
  proxyReq.on("error", (err) => {
    sendJson(res, 502, { error: "Bad Gateway", message: err.message })
  })
}

// ============================================================================
// COUNCIL HANDLERS
// ============================================================================

interface CouncilRequest {
  topic: string
  quick?: boolean
}

async function handleCouncil(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  if (req.method !== "POST") {
    sendJson(res, 405, { error: "Method Not Allowed", allowed: ["POST"] })
    return
  }
  
  try {
    const body = await parseJsonBody<CouncilRequest>(req)
    
    if (!body.topic || typeof body.topic !== "string") {
      sendJson(res, 400, { error: "Bad Request", message: "topic is required and must be a string" })
      return
    }
    
    const quick = body.quick === true
    const result = await executeCouncil(body.topic, quick)
    
    // Return both structured result and formatted output
    sendJson(res, 200, {
      success: true,
      result,
      formatted: formatCouncilOutput(result),
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    sendJson(res, 500, { success: false, error: message })
  }
}

async function handleCouncilHealth(req: http.IncomingMessage, res: http.ServerResponse): Promise<void> {
  if (req.method !== "GET") {
    sendJson(res, 405, { error: "Method Not Allowed", allowed: ["GET"] })
    return
  }
  
  const opencodeHealthy = await checkServerHealth()
  
  sendJson(res, opencodeHealthy ? 200 : 503, {
    healthy: opencodeHealthy,
    proxy: true,
    opencode: opencodeHealthy,
    version: "1.0.0",
  })
}

// ============================================================================
// MAIN SERVER
// ============================================================================

const server = http.createServer(async (req, res) => {
  const url = req.url || "/"
  
  // Council endpoints
  if (url === "/council" || url === "/council/") {
    await handleCouncil(req, res)
    return
  }
  
  if (url === "/council/health" || url === "/council/health/") {
    await handleCouncilHealth(req, res)
    return
  }
  
  // Proxy everything else to OpenCode
  proxyToOpencode(req, res)
})

server.listen(PROXY_PORT, "127.0.0.1", () => {
  console.log(`Council proxy server listening on http://127.0.0.1:${PROXY_PORT}`)
  console.log(`  /council        - POST council discussion`)
  console.log(`  /council/health - GET health check`)
  console.log(`  /*              - Proxied to ${OPENCODE_URL}`)
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\nShutting down...")
  server.close(() => {
    console.log("Server closed")
    process.exit(0)
  })
})

process.on("SIGTERM", () => {
  server.close(() => {
    process.exit(0)
  })
})
