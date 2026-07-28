/**
 * Cliente da API serverless.
 * O token do GitHub fica escondido no servidor (Vercel).
 * O frontend nunca tem acesso ao token.
 */

const API_URL = '/api'

export interface Participant {
  id: string
  name: string
  whatsapp: string
  raffle_number: string
  created_at: string
}

/** Sanitiza WhatsApp: apenas digitos */
export function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Formata WhatsApp internacional para exibicao
 */
export function formatPhone(d: string): string {
  if (!d) return ''
  if (d.length === 11 && d.startsWith('1')) {
    return '+1 (' + d.slice(1, 4) + ') ' + d.slice(4, 7) + '-' + d.slice(7)
  }
  if (d.startsWith('55') && d.length >= 12) {
    const rest = d.slice(2)
    if (rest.length === 11) return '+55 (' + rest.slice(0, 2) + ') ' + rest.slice(2, 7) + '-' + rest.slice(7)
    if (rest.length === 10) return '+55 (' + rest.slice(0, 2) + ') ' + rest.slice(2, 6) + '-' + rest.slice(6)
    return '+55 ' + rest
  }
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

/** Cadastra participante (publico) */
export async function registerParticipant(
  name: string,
  whatsapp: string
): Promise<{ success: true; participant: Participant } | { success: false; existingNumber: string }> {
  const res = await fetch(API_URL + '/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, whatsapp })
  })

  const data = await res.json()

  if (data.error) throw new Error(data.error)

  // API returns { duplicate: true, raffleNumber } for existing
  if (data.duplicate) {
    return { success: false, existingNumber: data.raffleNumber }
  }

  // API returns { success: true, raffleNumber } for new
  return {
    success: true,
    participant: {
      id: '',
      name,
      whatsapp,
      raffle_number: data.raffleNumber,
      created_at: new Date().toISOString()
    }
  }
}

/** Busca todos os participantes (protegido por senha admin) */
export async function getAllParticipants(adminPassword: string): Promise<Participant[]> {
  const res = await fetch(API_URL + '/participants', {
    headers: { 'X-Admin-Password': adminPassword }
  })

  const data = await res.json()

  if (data.error) throw new Error(data.error)

  return data.participants || []
}
/** Deleta um participante específico */
export async function deleteParticipant(id: string, adminPassword: string): Promise<void> {
  const res = await fetch(API_URL + '/participants', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Password': adminPassword 
    },
    body: JSON.stringify({ action: 'delete', id })
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error)
}

/** Limpa todos os participantes */
export async function clearAllParticipants(adminPassword: string): Promise<void> {
  const res = await fetch(API_URL + '/participants', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'X-Admin-Password': adminPassword 
    },
    body: JSON.stringify({ action: 'clear' })
  })

  const data = await res.json()
  if (data.error) throw new Error(data.error)
}
