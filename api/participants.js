// Lista participantes - GET /api/participants (protegido)
const GIST_ID = process.env.GIST_ID || ''
const GIST_TOKEN = process.env.GIST_TOKEN || ''
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || ''

async function fetchDB() {
  const res = await fetch('https://api.github.com/gists/' + GIST_ID, {
    headers: {
      Authorization: 'Bearer ' + GIST_TOKEN,
      Accept: 'application/vnd.github.v3+json'
    }
  })
  if (!res.ok) throw new Error('Gist fetch failed: ' + res.status)
  const gist = await res.json()
  const content = gist.files['participants.json']?.content || '{"participants":[]}'
  return JSON.parse(content)
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Admin-Password')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const adminPwd = req.headers['x-admin-password'] || ''
    if (adminPwd !== ADMIN_PASSWORD) {
      return res.status(401).json({ error: 'Nao autorizado' })
    }

    const db = await fetchDB()
    const sorted = (db.participants || []).sort(function(a, b) {
      return b.created_at.localeCompare(a.created_at)
    })

    return res.status(200).json({ participants: sorted })
  } catch (err) {
    console.error('Participants error:', err)
    return res.status(500).json({ error: 'Erro interno: ' + err.message })
  }
}