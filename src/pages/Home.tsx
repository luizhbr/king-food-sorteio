import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, type Participant } from '../lib/supabase'
import Logo from '../components/Logo'

/** Gera número de sorteio único de 001 a 999 com zero à esquerda */
async function generateUniqueNumber(): Promise<string> {
  for (let i = 0; i < 100; i++) {
    const num = Math.floor(Math.random() * 999) + 1
    const formatted = String(num).padStart(3, '0')

    // Verifica se o número já existe no banco
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

    // Validações
    const cleanPhone = sanitizePhone(whatsapp)
    if (name.trim().length < 2) {
      setError('Por favor, digite seu nome completo.')
      return
    }
    if (cleanPhone.length < 10) {
      setError('Por favor, digite um WhatsApp válido com DDD (mínimo 10 dígitos).')
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
        // Pode ser race condition no unique constraint — tenta buscar novamente
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

      // 4. Navega para tela de sucesso passando o número
      navigate('/sucesso', { state: { raffleNumber, name: name.trim() } })
    } catch (err) {
      console.error(err)
      setError('Erro ao cadastrar. Tente novamente em instantes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center px-5 py-8">
      {/* Logo */}
      <Logo className="w-24 h-24 object-contain mb-4" />

      {/* Título */}
      <h1 className="text-3xl font-black text-center mb-1">
        King Food
      </h1>
      <p className="text-king-gold text-lg font-bold mb-6">Sorteio</p>

      {/* Card de cadastro */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-2xl p-6 shadow-2xl border border-white/10">
        <p className="text-center text-sm text-white/80 mb-5">
          Cadastre-se e receba seu número da sorte automaticamente! 🎉
        </p>

        {existingNumber && (
          <div className="mb-4 bg-king-gold/20 border border-king-gold rounded-xl p-4 text-center">
            <p className="text-king-gold-light font-bold text-sm">
              Você já está participando!
            </p>
            <p className="text-white text-lg font-black mt-1">
              Seu número: {existingNumber}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              Nome completo
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Digite seu nome"
              disabled={loading}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-king-gold focus:border-transparent transition"
              autoComplete="name"
            />
          </div>

          {/* WhatsApp */}
          <div>
            <label className="block text-sm font-medium text-white/90 mb-1.5">
              WhatsApp
            </label>
            <input
              type="tel"
              value={whatsapp}
              onChange={(e) => setWhatsapp(sanitizePhone(e.target.value))}
              placeholder="Ex: 11987654321"
              disabled={loading}
              maxLength={15}
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-king-gold focus:border-transparent transition"
              autoComplete="tel"
              inputMode="numeric"
            />
            <p className="text-xs text-white/50 mt-1">
              Apenas números, com DDD
            </p>
          </div>

          {/* Erro */}
          {error && (
            <div className="bg-red-500/20 border border-red-500 rounded-xl p-3 text-red-200 text-sm text-center">
              {error}
            </div>
          )}

          {/* Botão */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-king-gold hover:bg-king-gold-light disabled:opacity-50 disabled:cursor-not-allowed text-king-green font-black text-lg py-4 rounded-xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
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

      <p className="text-xs text-white/40 mt-6 text-center max-w-xs">
        Ao participar, você concorda com os termos do sorteio. Guarde seu número!
      </p>
    </div>
  )
}