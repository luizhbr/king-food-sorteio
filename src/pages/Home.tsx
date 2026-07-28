import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase, type Participant } from '../lib/supabase'
import Logo from '../components/Logo'

/** Gera número de sorteio único de 001 a 999 com zero à esquerda */
async function generateUniqueNumber(): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const num = Math.floor(Math.random() * 999) + 1
    const formatted = String(num).padStart(3, '0')

    const { data } = await supabase
      .from('participants')
      .select('raffle_number')
      .eq('raffle_number', formatted)
      .maybeSingle()

    if (!data) return formatted
  }
  throw new Error('Não foi possível gerar um número único. Tente novamente.')
}

/** Sanitiza WhatsApp: apenas dígitos */
function sanitizePhone(value: string): string {
  return value.replace(/\D/g, '')
}

/**
 * Formata WhatsApp para exibição — internacional de verdade.
 * Detecta DDI e formata corretamente para qualquer país.
 * +1 (EUA): +1 (267) 826-5740
 * +55 (BR): +55 (11) 98765-4321
 */
function formatPhoneDisplay(raw: string): string {
  const d = sanitizePhone(raw)
  if (d.length === 0) return ''

  // EUA/Canadá: DDI 1, total 11 dígitos (1 + 10)
  if (d.length === 11 && d.startsWith('1')) {
    return `+1 (${d.slice(1, 4)}) ${d.slice(4, 7)}-${d.slice(7)}`
  }
  // Brasil: DDI 55, total 12-13 dígitos
  if (d.startsWith('55') && d.length >= 12) {
    const rest = d.slice(2)
    if (rest.length === 11) return `+55 (${rest.slice(0, 2)}) ${rest.slice(2, 7)}-${rest.slice(7)}`
    if (rest.length === 10) return `+55 (${rest.slice(0, 2)}) ${rest.slice(2, 6)}-${rest.slice(6)}`
    return `+55 ${rest}`
  }
  // Outros internacionais: mostrar com + e espaços simples
  if (d.length > 10) {
    // Tenta separar DDI (2-3 dígitos) do resto
    if (d.length >= 12) {
      const cc = d.slice(0, d.length - 10)
      const rest = d.slice(d.length - 10)
      return `+${cc} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
    }
    return `+${d.slice(0, 2)} ${d.slice(2)}`
  }
  // Número curto sem DDI — mostrar como digitado
  return d
}

/**
 * Valida WhatsApp internacional.
 * - Apenas dígitos (após remover + e espaços)
 * - Mínimo 8 dígitos (números locais curtos)
 * - Máximo 15 dígitos (limite ITU-T)
 * - Aceita qualquer DDI: +1 (EUA), +55 (BR), +44 (UK), etc.
 */
function isValidPhone(raw: string): boolean {
  const d = sanitizePhone(raw)
  return d.length >= 8 && d.length <= 15
}

export default function Home() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [existingNumber, setExistingNumber] = useState<string | null>(null)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setExistingNumber(null)

    const cleanPhone = sanitizePhone(whatsapp)
    if (name.trim().length < 2) {
      setError('Por favor, digite seu nome completo.')
      return
    }
    if (!isValidPhone(cleanPhone)) {
      setError('Digite um WhatsApp válido (mínimo 8 dígitos, com DDI se fora do Brasil).')
      return
    }

    setLoading(true)
    try {
      // 1. Verifica se WhatsApp já está cadastrado
      const { data: existing } = await supabase
        .from('participants')
        .select('*')
        .eq('whatsapp', cleanPhone)
        .maybeSingle<Participant>()

      if (existing) {
        setExistingNumber(existing.raffle_number)
        setLoading(false)
        return
      }

      // 2. Gera número único
      const raffleNumber = await generateUniqueNumber()

      // 3. Insere no banco
      const { error: insertError } = await supabase
        .from('participants')
        .insert({
          name: name.trim(),
          whatsapp: cleanPhone,
          raffle_number: raffleNumber
        })

      if (insertError) {
        if (insertError.code === '23505') {
          const { data: retry } = await supabase
            .from('participants')
            .select('raffle_number')
            .eq('whatsapp', cleanPhone)
            .maybeSingle<Participant>()
          if (retry) {
            setExistingNumber(retry.raffle_number)
            setLoading(false)
            return
          }
        }
        throw insertError
      }

      navigate('/sucesso', { state: { raffleNumber, name: name.trim() } })
    } catch (err) {
      console.error(err)
      setError('Erro ao cadastrar. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-5 pt-12 pb-8">
      <Logo className="w-24 h-24 object-contain mb-3 rounded-2xl" />

      <h1 className="text-2xl font-extrabold tracking-tight mb-1">King Food</h1>
      <p className="text-kf-gold text-sm font-semibold mb-8">Sorteio</p>

      <div className="w-full max-w-sm animate-slide-up">
        <p className="text-center text-sm text-white/50 mb-5">
          Cadastre-se e receba seu número da sorte 🎉
        </p>

        {existingNumber && (
          <div className="mb-4 rounded-2xl border border-kf-gold/30 bg-kf-gold/10 p-4 text-center">
            <p className="text-kf-gold font-bold text-sm">
              Você já está participando!
            </p>
            <p className="text-white text-lg font-black mt-1">
              Seu número: {existingNumber}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kf-gold/50 focus:border-transparent transition"
              autoComplete="name"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-white/60 mb-1.5">
              WhatsApp
            </label>
            <input
              type="tel"
              value={formatPhoneDisplay(whatsapp)}
              onChange={(e) => setWhatsapp(sanitizePhone(e.target.value))}
              placeholder="+1 267 826 5740"
              disabled={loading}
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kf-gold/50 focus:border-transparent transition"
              autoComplete="tel"
              inputMode="tel"
            />
            <p className="text-xs text-white/30 mt-1">
              Com DDI (ex: +1 para EUA, +55 para Brasil)
            </p>
          </div>

          {error && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3 text-red-300 text-sm text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-kf-gold hover:bg-kf-gold-dark disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold py-4 rounded-2xl text-base shadow-lg shadow-kf-gold/20 active:scale-[0.98] transition will-change-transform flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Cadastrando...
              </>
            ) : (
              '🎉 Participar do Sorteio'
            )}
          </button>
        </form>
      </div>

      <p className="text-xs text-white/25 mt-8 text-center max-w-xs">
        Ao participar, você concorda com os termos do sorteio. Guarde seu número!
      </p>

      {/* Link discreto para o painel admin */}
      <Link
        to="/admin"
        className="mt-4 text-[10px] text-white/20 hover:text-white/40 transition"
      >
        ⚙ Admin
      </Link>
    </div>
  )
}