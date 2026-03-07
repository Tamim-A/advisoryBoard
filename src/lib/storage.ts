import fs from 'fs'
import path from 'path'
import { v4 as uuidv4 } from 'uuid'

const SESSIONS_DIR = path.join(process.cwd(), 'data', 'sessions')

// Ensure directory exists
function ensureDir() {
  if (!fs.existsSync(SESSIONS_DIR)) {
    fs.mkdirSync(SESSIONS_DIR, { recursive: true })
  }
}

function sessionPath(id: string) {
  return path.join(SESSIONS_DIR, `${id}.json`)
}

export interface StoredSession {
  id: string
  companyProfile: Record<string, string>
  decision: Record<string, string>
  sessionType: string
  additionalAdvisors: string[]
  specificConcerns?: string
  status: 'pending' | 'running' | 'completed' | 'error'
  advisorResults?: unknown[]
  debate?: unknown
  synthesis?: unknown
  createdAt: string
  updatedAt: string
}

export function saveSession(data: Omit<StoredSession, 'id' | 'createdAt' | 'updatedAt'>): string {
  ensureDir()
  const id = uuidv4()
  const now = new Date().toISOString()
  const session: StoredSession = { ...data, id, createdAt: now, updatedAt: now }
  fs.writeFileSync(sessionPath(id), JSON.stringify(session, null, 2), 'utf-8')
  return id
}

export function getSession(id: string): StoredSession | null {
  ensureDir()
  const p = sessionPath(id)
  if (!fs.existsSync(p)) return null
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8')) as StoredSession
  } catch {
    return null
  }
}

export function updateSession(id: string, updates: Partial<StoredSession>): StoredSession | null {
  const session = getSession(id)
  if (!session) return null
  const updated = { ...session, ...updates, id, updatedAt: new Date().toISOString() }
  fs.writeFileSync(sessionPath(id), JSON.stringify(updated, null, 2), 'utf-8')
  return updated
}

export function getAllSessions(): StoredSession[] {
  ensureDir()
  try {
    return fs
      .readdirSync(SESSIONS_DIR)
      .filter((f) => f.endsWith('.json') && f !== '.gitkeep')
      .map((f) => {
        try {
          return JSON.parse(fs.readFileSync(path.join(SESSIONS_DIR, f), 'utf-8')) as StoredSession
        } catch {
          return null
        }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b!.createdAt).getTime() - new Date(a!.createdAt).getTime()) as StoredSession[]
  } catch {
    return []
  }
}
