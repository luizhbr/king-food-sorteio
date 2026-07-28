import { useState, useEffect, useCallback } from 'react'
import { supabase, type Participant } from '../lib/supabase'
import Logo from '../components/Logo'

/** Senha do admin definida no .env */
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD as string

export default function Admin() {
  const [authed, setAuthed] = useState(false)
  const [passwordInput, setPasswordInput] = useState('')
  const [authError, setAuthError] = useState('')

  // Estados de dados
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(false)
  const [winner, setWinner] = useState<Participant | null>(null)
  const [drawing, setDrawing] = useState(false)

  // Verifica se já está autenticado na sessão
  useEffect(() => {
    const ok = sessionStorage.getItem('kf_admin') === '1'
    if (ok) setAuthed(true)
  }, [])

  /** Login simples */
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

  /** Logout */
  function handleLogout() {
    sessionStorage.removeItem('kf_admin')
    setAuthed(false)
    setPasswordInput('')
  }

  /** Carrega participantes do Supabase */
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

  /** Sortear vencedor */
  function drawWinner() {
    if (participants.length === 0) return
    setDrawing(true)
    setWinner(null)

    // Animação de sorteio (roll visual)
    const interval = setInterval(() => {
      const random = participants[Math.floor(Math.random() * participants.length)]
      setWinner(random)
    }, 80)

    setTimeout(() => {
      clearInterval(interval)
      const finalWinner = participants[Math.floor(Math.random() * participants.length)]
      setWinner(finalWinner)
      setDrawing(false)
    }, 2000)
  }

  /** Exportar CSV */
  function exportCSV() {
    const header = 'Nome,WhatsApp,Numero,Data\n'
    const rows = participants
      .map((p) => {
        const date = new Date(p.created_at).toLocaleString('pt-BR')
        // Escapa aspas no nome
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

  // ─── TELA DE LOGIN ───────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-5">
        <Logo className="w-20 h-20 object-contain mb-4" />
        <h1 className="text-2xl font-black mb-2">Admin</h1>
        <p className="text-white/60 text-sm mb-6">King Food – Sorteio</p>

        <form onSubmit={handleLogin} className="w-full max-w-xs space-y-3">
          <input
            type="password"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            placeholder="Senha do admin"
            autoFocus
            className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-king-gold"
          />
          {authError && (
            <p className="text-red-300 text-sm text-center">{authError}</p>
          )}
          <button
            type="submit"
            className="w-full bg-king-gold text-king-green font-bold py-3 rounded-xl shadow-lg"
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
          <Logo className="w-10 h-10 object-contain" />
          <div>
            <h1 className="text-xl font-black">Painel Admin</h1>
            <p className="text-xs text-white/50">King Food – Sorteio</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="text-sm text-white/60 hover:text-white border border-white/20 rounded-lg px-3 py-1.5"
        >
          Sair
        </button>
      </div>

      {/* Stats + Ações */}
      <div className="max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="bg-white/10 rounded-2xl p-5 text-center border border-white/10">
          <p className="text-3xl font-black text-king-gold">{participants.length}</p>
          <p className="text-xs text-white/60 mt-1">Participantes</p>
        </div>

        <button
          onClick={drawWinner}
          disabled={participants.length === 0 || drawing}
          className="bg-king-gold hover:bg-king-gold-light disabled:opacity-40 text-king-green font-black py-5 rounded-2xl shadow-lg transition active:scale-[0.98] flex items-center justify-center gap-2"
        >
          {drawing ? '🎲 Sorteando...' : '🏆 Sortear Vencedor'}
        </button>

        <button
          onClick={exportCSV}
          disabled={participants.length === 0}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-40 border border-white/20 text-white font-bold py-5 rounded-2xl transition flex items-center justify-center gap-2"
        >
          📥 Exportar CSV
        </button>
      </div>

      {/* Vencedor */}
      {winner && (
        <div className="max-w-3xl mx-auto mb-6">
          <div
            className={`rounded-2xl p-6 text-center border-2 ${
              drawing
                ? 'border-white/30 bg-white/5'
                : 'border-king-gold bg-king-gold/15 shadow-2xl'
            }`}
          >
            <p className="text-king-gold font-bold text-sm uppercase tracking-wide mb-2">
              {drawing ? 'Sorteando...' : '🎉 Vencedor!'}
            </p>
            <p className="text-2xl font-black">{winner.name}</p>
            <p className="text-white/70 text-sm mt-1">WhatsApp: {winner.whatsapp}</p>
            <p className="text-5xl font-black text-king-gold mt-3 tracking-wider">
              {winner.raffle_number}
            </p>
          </div>
        </div>
      )}

      {/* Lista de participantes */}
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold">Participantes</h2>
          <button
            onClick={loadParticipants}
            disabled={loading}
            className="text-sm text-white/60 hover:text-white"
          >
            {loading ? 'Carregando...' : '↻ Atualizar'}
          </button>
        </div>

        {participants.length === 0 ? (
          <div className="text-center text-white/50 py-12 bg-white/5 rounded-2xl">
            {loading ? 'Carregando...' : 'Nenhum participante ainda.'}
          </div>
        ) : (
          <div className="space-y-2">
            {participants.map((p, idx) => (
              <div
                key={p.id}
                className={`flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl p-3 border border-white/5 transition ${
                  winner?.id === p.id && !drawing ? 'ring-2 ring-king-gold' : ''
                }`}
              >
                <span className="text-xs text-white/40 w-6 text-right">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold truncate">{p.name}</p>
                  <p className="text-xs text-white/50">{p.whatsapp}</p>
                </div>
                <div className="text-right">
                  <span className="text-lg font-black text-king-gold">
                    {p.raffle_number}
                  </span>
                  <p className="text-[10px] text-white/40">
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