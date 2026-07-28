import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Success() {
  const location = useLocation()
  const state = location.state as { raffleNumber?: string; name?: string } | null
  const [copied, setCopied] = useState(false)

  if (!state?.raffleNumber) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Logo className="w-20 h-20 object-contain mb-4 rounded-2xl" />
        <p className="text-white/50 text-center mb-4 text-sm">
          Nenhum número encontrado. Faça seu cadastro para participar!
        </p>
        <Link
          to="/"
          className="bg-kf-gold text-black font-bold px-6 py-3 rounded-2xl shadow-lg shadow-kf-gold/20 active:scale-[0.98] transition"
        >
          Voltar ao cadastro
        </Link>
      </div>
    )
  }

  const { raffleNumber, name } = state

  function copyNumber() {
    navigator.clipboard.writeText(raffleNumber!)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-5 py-8">
      <Logo className="w-20 h-20 object-contain mb-5 rounded-2xl" />

      <div className="w-full max-w-sm text-center animate-slide-up">
        {/* Ícone de sucesso */}
        <div className="w-14 h-14 bg-kf-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-kf-gold/20">
          <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-white/80 text-lg mb-1">
          Parabéns{name ? `, ${name}` : ''}! 🎉
        </p>
        <p className="text-kf-gold font-semibold text-sm mb-5">
          Seu número do sorteio é:
        </p>

        {/* Número grande em destaque */}
        <div className="animate-pop bg-gradient-to-br from-kf-gold to-kf-gold-dark rounded-2xl py-10 px-4 mb-6 shadow-2xl shadow-kf-gold/20">
          <span className="text-7xl font-black text-black tracking-wider">
            {raffleNumber}
          </span>
        </div>

        {/* Botão copiar */}
        <button
          onClick={copyNumber}
          className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold py-3.5 rounded-2xl transition active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5 text-kf-gold" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Número copiado!
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              Copiar número
            </>
          )}
        </button>

        <p className="text-sm text-white/40">
          📱 Guarde esse número e aguarde o sorteio no grupo
        </p>
      </div>

      <Link
        to="/"
        className="mt-6 text-white/30 text-sm hover:text-white/60 transition"
      >
        ← Voltar
      </Link>
    </div>
  )
}