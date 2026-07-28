// Cadastro publico - POST /api/register
const GIST_ID = process.env.GIST_ID || ''
const GIST_TOKEN = process.env.GIST_TOKEN || ''

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

async function saveDB(db) {
  const res = await fetch('https://api.github.com/gists/' + GIST_ID, {
    method: 'PATCH',
    headers: {
      Authorization: 'Bearer ' + GIST_TOKEN,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      files: {
        ['participants.json']: {
          content: JSON.stringify(db, null, 2)
        }
      }
    })
  })
  if (!res.ok) throw new Error('Gist save failed: ' + res.status)
  return true
}

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { name, whatsapp } = req.body || {}

    if (!name || !whatsapp) {
      return res.status(400).json({ error: 'Nome e WhatsApp são obrigatórios' })
    }

    // Normalize whatsapp (digits only)
    const wa = String(whatsapp).replace(/\D/g, '')
    if (wa.length < 10 || wa.length > 15) {
      return res.status(400).json({ error: 'WhatsApp inválido' })
    }

    const db = await fetchDB()
    const participants = db.participants || []

    // Check duplicate
    const existing = participants.find(p => p.whatsapp === wa)
    if (existing) {
      return res.status(200).json({ duplicate: true, raffleNumber: existing.raffle_number })
    }

    // Generate unique raffle number (001-999)
    let raffleNumber
    const usedNumbers = new Set(participants.map(p => p.raffle_number))
    do {
      raffleNumber = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    } while (usedNumbers.has(raffleNumber))

    const newParticipant = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name: String(name).trim().slice(0, 100),
      whatsapp: wa,
      raffle_number: raffleNumber,
      created_at: new Date().toISOString()
    }

    participants.push(newParticipant)
    db.participants = participants
    await saveDB(db)

    return res.status(200).json({ success: true, raffleNumber })
  } catch (err) {
    console.error('Register error:', err)
    return res.status(500).json({ error: 'Erro interno: ' + err.message })
  }
}