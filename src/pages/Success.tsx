import { useState } from 'react'
import { useLocation, Link } from 'react-router-dom'
import Logo from '../components/Logo'

export default function Success() {
  const location = useLocation()
  const state = location.state as { raffleNumber?: string; name?: string } | null
  const [copied, setCopied] = useState(false)

  // Se acessou diretamente sem state, mostra fallback
  if (!state?.raffleNumber) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Logo className="w-20 h-20 object-contain mb-4" />
        <p className="text-white/70 text-center mb-4">
          Nenhum número encontrado. Faça seu cadastro para participar!
        </p>
        <Link
          to="/"
          className="bg-king-gold text-king-green font-bold px-6 py-3 rounded-xl shadow-lg"
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
      <Logo className="w-20 h-20 object-contain mb-4" />

      {/* Card de sucesso */}
      <div className="w-full max-w-md bg-white/10 backdrop-blur-sm rounded-3xl p-8 shadow-2xl border border-white/10 text-center">
        {/* Ícone de sucesso */}
        <div className="w-16 h-16 bg-king-gold rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
          <svg className="w-9 h-9 text-king-green" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <p className="text-white/90 text-lg mb-2">
          Parabéns{name ? `, ${name}` : ''}! 🎉
        </p>
        <p className="text-king-gold font-semibold text-sm mb-4">
          Seu número do sorteio é:
        </p>

        {/* Número grande em destaque */}
        <div className="animate-pop bg-gradient-to-br from-king-gold to-king-gold-light rounded-2xl py-8 px-4 mb-6 shadow-2xl">
          <span className="text-7xl font-black text-king-green tracking-wider">
            {raffleNumber}
          </span>
        </div>

        {/* Botão copiar */}
        <button
          onClick={copyNumber}
          className="w-full bg-white/15 hover:bg-white/25 border border-white/20 text-white font-semibold py-3.5 rounded-xl transition active:scale-[0.98] flex items-center justify-center gap-2 mb-4"
        >
          {copied ? (
            <>
              <svg className="w-5 h-5 text-king-gold-light" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
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

        <p className="text-sm text-white/70">
          📱 Guarde esse número e aguarde o sorteio no grupo
        </p>
      </div>

      <Link
        to="/"
        className="mt-6 text-white/50 text-sm hover:text-white/80 transition"
      >
        ← Voltar
      </Link>
    </div>
  )
}