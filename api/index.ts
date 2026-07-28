/**
 * API Serverless - King Food Sorteio
 * Esconde o token do GitHub no servidor (nao exposto no frontend)
 */

const GIST_ID = process.env.GIST_ID || ''
const GIST_TOKEN = process.env.GIST_TOKEN || ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

interface Participant {
  id: string
  name: string
  whatsapp: string
  raffle_number: string
  created_at: string
}

interface DBShape {
  participants: Participant[]
}

/** Busca banco do Gist */
async function fetchDB(): Promise<DBShape> {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      Accept: 'application/vnd.github.v3+json'
    }
  })
  if (!res.ok) throw new Error(`Gist fetch failed: ${res.status}`)
  const gist = await res.json()
  const content = gist.files['participants.json']?.content || '{"participants":[]}'
  return JSON.parse(content)
}

/** Salva banco no Gist */
async function saveDB(db: DBShape): Promise<void> {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
    method: 'PATCH',
    headers: {
      Authorization: `token ${GIST_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        'participants.json': {
          content: JSON.stringify(db, null, 2)
        }
      }
    })
  })
  if (!res.ok) throw new Error(`Gist save failed: ${res.status}`)
}

function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generateNumber(existing: Participant[]): string {
  const used = new Set(existing.map((p) => p.raffle_number))
  for (let i = 0; i < 200; i++) {
    const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    if (!used.has(num)) return num
  }
  throw new Error('Nao foi possivel gerar numero unico')
}

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password'
  }
}

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders()
    }
  })
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/api', '')

  try {
    // POST /api/register - cadastro publico
    if (path === '/register' && req.method === 'POST') {
      const body = await req.json()
      const { name, whatsapp } = body

      if (!name || name.trim().length < 2) {
        return json({ error: 'Nome invalido' }, 400)
      }
      const cleanPhone = (whatsapp || '').replace(/\D/g, '')
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return json({ error: 'WhatsApp invalido' }, 400)
      }

      const db = await fetchDB()

      const existing = db.participants.find((p) => p.whatsapp === cleanPhone)
      if (existing) {
        return json({ existingNumber: existing.raffle_number })
      }

      const raffle_number = generateNumber(db.participants)

      const participant: Participant = {
        id: uuid(),
        name: name.trim(),
        whatsapp: cleanPhone,
        raffle_number,
        created_at: new Date().toISOString()
      }

      db.participants.push(participant)
      await saveDB(db)

      return json({ success: true, participant })
    }

    // GET /api/participants - lista protegida
    if (path === '/participants' && req.method === 'GET') {
      const adminPwd = req.headers.get('X-Admin-Password') || ''
      if (adminPwd !== ADMIN_PASSWORD) {
        return json({ error: 'Nao autorizado' }, 401)
      }

      const db = await fetchDB()
      const sorted = db.participants.sort((a, b) =>
        b.created_at.localeCompare(a.created_at)
      )
      return json({ participants: sorted })
    }

    return json({ error: 'Endpoint nao encontrado' }, 404)
  } catch (err) {
    console.error('API error:', err)
    return json({ error: 'Erro interno do servidor' }, 500)
  }
}
