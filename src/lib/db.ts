/**
 * Banco de dados via GitHub Gist.
 * Armazena participantes num JSON em um Gist privado.
 * Funciona sem Supabase, sem servidor, sem configuracao manual.
 */

const GIST_ID = import.meta.env.VITE_GIST_ID as string
const GIST_TOKEN = import.meta.env.VITE_GIST_TOKEN as string

export interface Participant {
  id: string
  name: string
  whatsapp: string
  raffle_number: string
  created_at: string
}

interface DBShape {
  participants: Participant[]
}

/** Monta header de autorizacao para GitHub API */
function authHeader(): string {
  return 'token ' + GIST_TOKEN
}

/** Busca o estado atual do banco do Gist */
async function fetchDB(): Promise<DBShape> {
  const res = await fetch('https://api.github.com/gists/' + GIST_ID, {
    headers: {
      Authorization: authHeader(),
      Accept: 'application/vnd.github.v3+json'
    }
  })
  if (!res.ok) throw new Error('Gist fetch failed: ' + res.status)
  const gist = await res.json()
  const content = gist.files['participants.json']?.content || '{"participants":[]}'
  return JSON.parse(content)
}

/** Salva o estado completo do banco no Gist */
async function saveDB(db: DBShape): Promise<void> {
  const res = await fetch('https://api.github.com/gists/' + GIST_ID, {
    method: 'PATCH',
    headers: {
      Authorization: authHeader(),
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

/** Gera UUID simples */
function uuid(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/** Gera numero de sorteio unico 001-999 */
function generateNumber(existing: Participant[]): string {
  const used = new Set(existing.map((p) => p.raffle_number))
  for (let i = 0; i < 200; i++) {
    const num = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0')
    if (!used.has(num)) return num
  }
  throw new Error('Nao foi possivel gerar numero unico')
}

/** Sanitiza WhatsApp: apenas digitos */
export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Formata WhatsApp internacional para exibicao
 * +1 (267) 826-5740 / +55 (11) 98765-4321
 */
export function formatPhone(d: string): string {
  if (!d) return ''
  // EUA/Canada
  if (d.length === 11 && d.startsWith('1')) {
    return '+1 (' + d.slice(1, 4) + ') ' + d.slice(4, 7) + '-' + d.slice(7)
  }
  // Brasil
  if (d.startsWith('55') && d.length >= 12) {
    const rest = d.slice(2)
    if (rest.length === 11) return '+55 (' + rest.slice(0, 2) + ') ' + rest.slice(2, 7) + '-' + rest.slice(7)
    if (rest.length === 10) return '+55 (' + rest.slice(0, 2) + ') ' + rest.slice(2, 6) + '-' + rest.slice(6)
    return '+55 ' + rest
  }
  // Outros
  if (d.length > 10) {
    if (d.length >= 12) {
      const cc = d.slice(0, d.length - 10)
      const rest = d.slice(d.length - 10)
      return '+' + cc + ' ' + rest.slice(0, 3) + ' ' + rest.slice(3, 6) + ' ' + rest.slice(6)
    }
    return '+' + d.slice(0, 2) + ' ' + d.slice(2)
  }
  return d
}

/** Valida WhatsApp internacional: 8-15 digitos */
export function isValidPhone(raw: string): boolean {
  const d = sanitizePhone(raw)
  return d.length >= 8 && d.length <= 15
}

// --- API publica ---

export async function registerParticipant(
  name: string,
  whatsapp: string
): Promise<{ success: true; participant: Participant } | { success: false; existingNumber: string }> {
  const db = await fetchDB()

  // Verifica duplicidade
  const existing = db.participants.find((p) => p.whatsapp === whatsapp)
  if (existing) {
    return { success: false, existingNumber: existing.raffle_number }
  }

  // Gera numero unico
  const raffle_number = generateNumber(db.participants)

  // Cria participante
  const participant: Participant = {
    id: uuid(),
    name: name.trim(),
    whatsapp,
    raffle_number,
    created_at: new Date().toISOString()
  }

  // Salva
  db.participants.push(participant)
  await saveDB(db)

  return { success: true, participant }
}

export async function getAllParticipants(): Promise<Participant[]> {
  const db = await fetchDB()
  return db.participants.sort((a, b) => b.created_at.localeCompare(a.created_at))
}