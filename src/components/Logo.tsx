/** Logo do King Food */
export default function Logo({ className = '' }: { className?: string }) {
  return (
    <img
      src="/logo-kingfood.png"
      alt="King Food"
      className={className}
      onError={(e) => {
        const target = e.currentTarget
        target.onerror = null
        target.style.display = 'none'
        const parent = target.parentElement
        if (parent) {
          parent.innerHTML = `
            <div class="${className} flex items-center justify-center rounded-2xl bg-kf-gold text-black font-black text-xl shadow-lg">
              KF
            </div>
          `
        }
      }}
    />
  )
}