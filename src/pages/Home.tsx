import { useState, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { registerParticipant, sanitizePhone, formatPhone, isValidPhone } from '../lib/db'
import Logo from '../components/Logo'

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
      const result = await registerParticipant(name, cleanPhone)

      if (result.success) {
        navigate('/sucesso', {
          state: { raffleNumber: result.participant.raffle_number, name: result.participant.name }
        })
      } else {
        setExistingNumber(result.existingNumber)
      }
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
              value={formatPhone(whatsapp)}
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

      <Link
        to="/admin"
        className="mt-4 text-[10px] text-white/20 hover:text-white/40 transition"
      >
        ⚙ Admin
      </Link>
    </div>
  )
}