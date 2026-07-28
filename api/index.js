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

function setCors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password')
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0')
  res.setHeader('Vercel-CDN-Cache-Control', 'max-age=0')
  res.setHeader('CDN-Cache-Control', 'max-age=0')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
}

function getHeader(req, name) {
  if (!req.headers) return ''
  if (typeof req.headers.get === 'function') {
    return req.headers.get(name) || ''
  }
  return req.headers[name.toLowerCase()] || ''
}

function jsonResponse(res, data, status) {
  setCors(res)
  res.statusCode = status || 200
  res.end(JSON.stringify(data))
}

async function readBodyJson(req) {
  return new Promise((resolve) => {
    let data = ''
    req.on('data', c => data += c)
    req.on('end', () => {
      try { resolve(JSON.parse(data)) } catch { resolve({}) }
    })
  })
}

export default async function handler(req, res) {
  setCors(res)
  if (req.method === 'OPTIONS') {
    res.statusCode = 204
    return res.end()
  }

  const url = new URL(req.url, 'https://kingfoodsorteio.online')
  let path = url.pathname.replace('/api', '')
  const rawPath = url.searchParams.get('path') || ''
  if (rawPath) path = '/' + rawPath.split('/').filter(Boolean).join('/')

  try {
    if (path === '/register' && req.method === 'POST') {
      const body = await readBodyJson(req)
      const name = body.name
      const whatsapp = body.whatsapp

      if (!name || name.trim().length < 2) {
        return jsonResponse(res, { error: 'Nome invalido' }, 400)
      }
      const cleanPhone = (whatsapp || '').replace(/\D/g, '')
      if (cleanPhone.length < 8 || cleanPhone.length > 15) {
        return jsonResponse(res, { error: 'WhatsApp invalido' }, 400)
      }

      const db = await fetchDB()
      const existing = db.participants.find(function(p) { return p.whatsapp === cleanPhone })
      if (existing) {
        return jsonResponse(res, { existingNumber: existing.raffle_number })
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

      return jsonResponse(res, { success: true, participant: participant })
    }

    if (path === '/participants' && req.method === 'GET') {
      const adminPwd = getHeader(req, 'X-Admin-Password')
      if (adminPwd !== ADMIN_PASSWORD) {
        return jsonResponse(res, { error: 'Nao autorizado' }, 401)
      }
      const db = await fetchDB()
      const sorted = db.participants.sort(function(a, b) {
        return b.created_at.localeCompare(a.created_at)
      })
      return jsonResponse(res, { participants: sorted })
    }

    if (path === '/participants' && (req.method === 'POST' || req.method === 'DELETE')) {
      const adminPwd = getHeader(req, 'X-Admin-Password')
      if (adminPwd !== ADMIN_PASSWORD) {
        return jsonResponse(res, { error: 'Nao autorizado' }, 401)
      }
      let body = {}
      if (req.method === 'POST') {
        body = await readBodyJson(req)
      } else {
        body.id = url.searchParams.get('id')
      }
      const db = await fetchDB()

      if (body.action === 'clear' || (req.method === 'DELETE' && !body.id)) {
        db.participants = []
        await saveDB(db)
        return jsonResponse(res, { success: true })
      }

      if ((body.action === 'delete' || req.method === 'DELETE') && body.id) {
        db.participants = db.participants.filter((p) => p.id !== body.id)
        await saveDB(db)
        return jsonResponse(res, { success: true })
      }

      return jsonResponse(res, { error: 'Ação inválida' }, 400)
    }

    return jsonResponse(res, { error: 'Endpoint nao encontrado' }, 404)
  } catch (err) {
    console.error('API error:', err)
    return jsonResponse(res, { error: 'Erro interno: ' + err.message }, 500)
  }
}
