import express from 'express'
import path from 'path'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import { registerRoutes } from './routes.js'
import { registerPublicRoutes } from './routes-public.js'
import { setupSupabaseAuth } from './supabaseAuth.js'

// Load environment variables (including SUPABASE_URL, SUPABASE_ANON_KEY)
dotenv.config()

const app = express()
app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser()) // Add cookie parser middleware

// 1️⃣ Supabase Auth & Profile API endpoints
setupSupabaseAuth(app)

// 2️⃣ Config endpoint for client-side initialization
type SupabaseConfig = { url: string; key: string }
app.get('/api/config/supabase', (_req, res) => {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    return res.status(500).json({ error: 'Missing Supabase credentials' })
  }
  res.json({ url: SUPABASE_URL, key: SUPABASE_ANON_KEY } as SupabaseConfig)
})

// 3️⃣ Public and custom routes
registerPublicRoutes(app)
const httpServer = await registerRoutes(app)

// 4️⃣ Serve static assets and fallback for React app
import { fileURLToPath } from 'url'
import { setupVite, serveStatic } from './vite.js'

const isDev = process.env.NODE_ENV !== 'production'
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

if (isDev) {
  // In development mode, set up Vite middleware
  console.log('Running in development mode with Vite middleware')
  await setupVite(app, httpServer)
} else {
  // In production mode, serve static files
  console.log('Running in production mode with static files')
  const clientDist = path.join(__dirname, '../client/dist')
  app.use(express.static(clientDist))
  app.get('*', (_req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'))
  })
}

// 5️⃣ Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || 500
  console.error('Server error:', err)
  res.status(status).json({ message: err.message || 'Internal Server Error' })
})

// Start server
const port = parseInt(process.env.PORT || '5000', 10)
httpServer.listen(port, '0.0.0.0', () => console.log(`Server listening on port ${port}`))