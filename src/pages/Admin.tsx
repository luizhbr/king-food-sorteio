import { useState, useEffect, useCallback } from 'react'
import { supabase, type Participant } from '../lib/supabase'
import Logo from '../components/Logo'

/** Senha do admin definida no .env */
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [drawing, setDrawing] = useState(false)
  const [search, setSearch] = useState('')
  const [confirmDraw, setConfirmDraw] = useState(false)
  const [drawHistory, setDrawHistory] = useState<Participant[]>([])

  useEffect(() => {
    if (sessionStorage.getItem('kf_admin') === '1') setAuthed(true)
  }, [])

  function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    if (passwordInput === ADMIN_PASSWORD) {
      setAuthed(true)
      sessionStorage.setItem('kf_admin', '1')
      setAuthError('')
    } else {
      setAuthError('Senha incorreta')
    }
  }

  function handleLogout() {
    sessionStorage.removeItem('kf_admin')
    setAuthed(false)
    setPasswordInput('')
  }

  const loadParticipants = useCallback(async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('participants')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setParticipants(data || [])
    } catch (err) {
      console.error('Erro ao carregar participantes:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authed) loadParticipants()
  }, [authed, loadParticipants])

  /** Sortear vencedor com animação */
  function drawWinner() {
    if (participants.length === 0) return
    setConfirmDraw(false)
    setDrawing(true)
    setWinner(null)

    const interval = setInterval(() => {
      const random = participants[Math.floor(Math.random() * participants.length)]
      setWinner(random)
    }, 80)

    setTimeout(() => {
      clearInterval(interval)
      const finalWinner = participants[Math.floor(Math.random() * participants.length)]
      setWinner(finalWinner)
      setDrawing(false)
      // Adicionar ao histórico
      setDrawHistory((prev) => [finalWinner, ...prev])
    }, 2500)
  }

  /** Exportar CSV */
  function exportCSV() {
    const header = 'Nome,WhatsApp,Numero,Data\n'
    const rows = participants
      .map((p) => {
        const date = new Date(p.created_at).toLocaleString('pt-BR')
        const safeName = `"${p.name.replace(/"/g, '""')}"`
        return `${safeName},${p.whatsapp},${p.raffle_number},${date}`
      })
      .join('\n')

    const csv = header + rows
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `king-food-sorteio-${new Date().toISOString().slice(0, 10)}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  /** Formatar WhatsApp para exibição */
  function formatPhone(phone: string): string {
    const d = phone.replace(/\D/g, '')
    if (d.length > 11) {
      const cc = d.slice(0, d.length - 10)
      const rest = d.slice(d.length - 10)
      return `+${cc} ${rest.slice(0, 3)} ${rest.slice(3, 6)} ${rest.slice(6)}`
    }
    if (d.length <= 10) {
      return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
    }
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
  }

  /** Filtra participantes pela busca */
  const filtered = participants.filter((p) => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      p.name.toLowerCase().includes(q) ||
      p.whatsapp.includes(q) ||
      p.raffle_number.includes(q)
    )
  })

  // ─── TELA DE LOGIN ───────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Logo className="w-20 h-20 object-contain mb-4 rounded-2xl" />
        <h1 className="text-xl font-extrabold mb-1">Admin</h1>
        <p className="text-white/40 text-xs mb-6">King Food – Sorteio</p>

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Senha do admin"
            autoFocus
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kf-gold/50"
          />
          {authError && (
            <p className="text-red-300 text-sm text-center">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full bg-kf-gold text-black font-bold py-3.5 rounded-2xl shadow-lg shadow-kf-gold/20 active:scale-[0.98] transition"
          >
            Entrar
          </button>
        </form>
      </div>
    )
  }

  // ─── PAINEL ADMIN ────────────────────────────────────
  return (
    <div className="min-h-screen px-5 py-6">
      {/* Header */}
      <div className="flex items-center justify-between max-w-3xl mx-auto mb-6">
        <div className="flex items-center gap-3">
          <Logo className="w-10 h-10 object-contain rounded-xl" />
          <div>
            <h1 className="text-lg font-extrabold">Painel Admin</h1>
            <p className="text-xs text-white/40">King Food – Sorteio</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-white/50 hover:text-white border border-white/10 rounded-xl px-3 py-1.5 transition"
        >
          Sair
        </button>
      </div>

      {/* Stats + Ações */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 text-center">
          <p className="text-3xl font-black text-kf-gold">{participants.length}</p>
          <p className="text-xs text-white/40 mt-1">Participantes</p>
        </div>

        <button
          onClick={() => setConfirmDraw(true)}
          disabled={participants.length === 0 || drawing}
          className="bg-kf-gold hover:bg-kf-gold-dark disabled:opacity-30 text-black font-bold py-5 rounded-2xl shadow-lg shadow-kf-gold/20 active:scale-[0.98] transition flex items-center justify-center gap-2"
        >
          🏆 Sortear Vencedor
        </button>

        <button
          onClick={exportCSV}
          disabled={participants.length === 0}
          className="bg-white/5 hover:bg-white/10 disabled:opacity-30 border border-white/10 text-white font-bold py-5 rounded-2xl transition flex items-center justify-center gap-2"
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Modal de confirmação do sorteio */}
      {confirmDraw && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-5"
          onClick={() => setConfirmDraw(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-white/10 bg-neutral-900 p-6 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-lg font-bold mb-2">Confirmar sorteio?</p>
            <p className="text-sm text-white/50 mb-5">
              Será sorteado 1 vencedor entre {participants.length} participantes.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDraw(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-medium py-3 rounded-2xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={drawWinner}
                className="flex-1 bg-kf-gold text-black font-bold py-3 rounded-2xl shadow-lg shadow-kf-gold/20 active:scale-[0.98] transition"
              >
                Sortear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vencedor / Animação de sorteio */}
      {winner && (
        <div className="max-w-3xl mx-auto mb-6">
          <div
            className={`rounded-2xl p-6 text-center border ${
              drawing
                ? 'border-white/10 bg-white/5'
                : 'border-kf-gold/40 bg-kf-gold/10 shadow-2xl shadow-kf-gold/10'
            }`}
          >
            <p className="text-kf-gold font-bold text-sm uppercase tracking-wide mb-2">
              {drawing ? '🎲 Sorteando...' : '🎉 Vencedor!'}
            </p>
            <p className="text-xl font-extrabold">{winner.name}</p>
            <p className="text-white/50 text-sm mt-1">{formatPhone(winner.whatsapp)}</p>
            <p className="text-5xl font-black text-kf-gold mt-3 tracking-wider">
              {winner.raffle_number}
            </p>
            {!drawing && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(
                    `Vencedor: ${winner!.name} - WhatsApp: ${winner!.whatsapp} - Numero: ${winner!.raffle_number}`
                  )
                }}
                className="mt-4 text-sm text-white/40 hover:text-white border border-white/10 rounded-xl px-4 py-2 transition"
              >
                📋 Copiar dados do vencedor
              </button>
            )}
          </div>
        </div>
      )}

      {/* Histórico de sorteios */}
      {drawHistory.length > 0 && (
        <div className="max-w-3xl mx-auto mb-6">
          <p className="text-xs text-white/40 mb-2 uppercase tracking-wide">Histórico de sorteios</p>
          <div className="space-y-2">
            {drawHistory.map((w, i) => (
              <div
                key={`${w.id}-${i}`}
                className="flex items-center gap-3 rounded-xl border border-white/5 bg-white/5 p-3"
              >
                <span className="text-xs text-white/30 w-6 text-right">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate">{w.name}</p>
                  <p className="text-xs text-white/40">{formatPhone(w.whatsapp)}</p>
                </div>
                <span className="text-base font-black text-kf-gold">{w.raffle_number}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Busca */}
      <div className="max-w-3xl mx-auto mb-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, WhatsApp ou número..."
          className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:ring-2 focus:ring-kf-gold/50"
        />
      </div>

      {/* Lista de participantes */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold">
            Participantes
            <span className="text-white/40 text-sm ml-2">({filtered.length})</span>
          </h2>
          <button
            onClick={loadParticipants}
            disabled={loading}
            className="text-sm text-white/50 hover:text-white transition"
          >
            {loading ? 'Carregando...' : '↻ Atualizar'}
          </button>
        </div>

        {participants.length === 0 ? (
          <div className="text-center text-white/30 py-12 rounded-2xl border border-white/5 bg-white/5">
            {loading ? 'Carregando...' : 'Nenhum participante ainda.'}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-white/30 py-8 rounded-2xl border border-white/5 bg-white/5">
            Nenhum resultado para "{search}"
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 p-3 transition ${
                  winner?.id === p.id && !drawing ? 'ring-2 ring-kf-gold/60' : ''
                }`}
              >
                <span className="text-xs text-white/30 w-6 text-right">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-white/40">{formatPhone(p.whatsapp)}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-kf-gold">
                    {p.raffle_number}
                  </span>
                  <p className="text-[10px] text-white/30">
                    {new Date(p.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}