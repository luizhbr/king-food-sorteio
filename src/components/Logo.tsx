/** Logo placeholder do King Food */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo-kingfood.png"
      alt="King Food"
      className={className}
      onError={(e) => {
        // Fallback: se a logo não existir, mostra um badge estilizado
        const target = e.currentTarget
        target.onerror = null
        target.style.display = 'none'
        const parent = target.parentElement
        if (parent) {
          parent.innerHTML = `
            <div class="${className} flex items-center justify-center rounded-full bg-king-gold text-king-green font-black text-2xl shadow-lg">
              KF
            </div>
          `
        }
      }}
    />
  )
}