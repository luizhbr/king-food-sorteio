const GIST_ID = process.env.GIST_ID || ''
const GIST_TOKEN=process.env.GIST_TOKEN || ''
const ADMIN_PASSWORD=process.env.ADMIN_PASSWORD || ''

async function fetchDB() {
  const res = await fetch('https://api.github.com/gists/' + GIST_ID, {
    headers: {
      Authorization: 'token ' + GIST_TOKEN,
      Accept: 'application/vnd.github.v3+json'
    }
  })
  if (!res.ok) throw new Error('Gist fetch failed: ' + res.status)
  const gist = await res.json()
  const content = gist.files['participants.json']?.content || '{"participants":[]}'
  return JSON.parse(content)
}

async function saveDB(db) {
  const res = await fetch('https://api.github.com/gists/' + GIST_ID, {
    method: 'PATCH',
    headers: {
      Authorization: 'token ' + GIST_TOKEN,
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
  if (!res.ok) throw new Error('Gist save failed: ' + res.status)
}

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

function generateNumber(existing) {
  const used = new Set(existing.map(function(p) { return p.raffle_number }))
  for (let i = 0; i < 200; i++) {
    const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    if (!used.has(num)) return num
  }
  throw new Error('Nao foi possivel gerar numero unico')
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password'
  }
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: Object.assign({ 'Content-Type': 'application/json' }, corsHeaders())
  })
}

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace('/api', '')

  try {
    if (path === '/register' && req.method === 'POST') {
      const body = await req.json()
      const name = body.name
      const whatsapp = body.whatsapp

      if (!name || name.trim().length < 2) {
        return jsonResponse({ error: 'Nome invalido' }, 400)
      }
      const cleanPhone = (whatsapp || '').replace(/\D/g, '')
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return jsonResponse({ error: 'WhatsApp invalido' }, 400)
      }

      const db = await fetchDB()
      const existing = db.participants.find(function(p) { return p.whatsapp === cleanPhone })
      if (existing) {
        return jsonResponse({ existingNumber: existing.raffle_number })
      }

      const raffle_number = generateNumber(db.participants)
      const participant = {
        id: uuid(),
        name: name.trim(),
        whatsapp: cleanPhone,
        raffle_number: raffle_number,
        created_at: new Date().toISOString()
      }

      db.participants.push(participant)
      await saveDB(db)

      return jsonResponse({ success: true, participant: participant })
    }

    if (path === '/participants' && req.method === 'GET') {
      const adminPwd = req.headers.get('X-Admin-Password') || ''
      if (adminPwd !== ADMIN_PASSWORD) {
        return jsonResponse({ error: 'Nao autorizado' }, 401)
      }
      const db = await fetchDB()
      const sorted = db.participants.sort(function(a, b) {
        return b.created_at.localeCompare(a.created_at)
      })
      return jsonResponse({ participants: sorted })
    }

    return jsonResponse({ error: 'Endpoint nao encontrado' }, 404)
  } catch (err) {
    console.error('API error:', err)
    return jsonResponse({ error: 'Erro interno: ' + err.message }, 500)
  }
}