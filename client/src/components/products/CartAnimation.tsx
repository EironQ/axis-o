import { useEffect, useState, useRef } from 'react'

interface CartAnimationProps {
  startX: number
  startY: number
  endX: number
  endY: number
  onComplete: () => void
}

export default function CartAnimation({ startX, startY, endX, endY, onComplete }: CartAnimationProps) {
  const [style, setStyle] = useState({
    transform: `translate(${startX}px, ${startY}px) scale(1)`,
    opacity: 1,
  })

  useEffect(() => {
    const duration = 600
    const startTime = performance.now()

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime
      const progress = Math.min(elapsed / duration, 1)

      const easeOutCubic = 1 - Math.pow(1 - progress, 3)

      const dx = endX - startX
      const dy = endY - startY

      const arcHeight = -Math.max(Math.abs(dx), Math.abs(dy)) * 0.4
      const midProgress = 0.5
      
      let yOffset = 0
      if (progress < midProgress) {
        const t = progress / midProgress
        yOffset = arcHeight * Math.sin(t * Math.PI)
      } else {
        const t = (progress - midProgress) / (1 - midProgress)
        yOffset = arcHeight * Math.sin(Math.PI - t * Math.PI)
      }

      const x = startX + dx * easeOutCubic
      const y = startY + dy * easeOutCubic + yOffset

      const scale = 1 - progress * 0.7

      setStyle({
        transform: `translate(${x}px, ${y}px) scale(${scale})`,
        opacity: 1 - progress * 0.3,
      })

      if (progress < 1) {
        requestAnimationFrame(animate)
      } else {
        onComplete()
      }
    }

    requestAnimationFrame(animate)
  }, [startX, startY, endX, endY, onComplete])

  return (
    <div
      className="fixed top-0 left-0 pointer-events-none z-[9999]"
      style={{
        ...style,
        transition: 'none',
      }}
    >
      <div className="w-8 h-8 rounded-full bg-[#C89460] shadow-lg flex items-center justify-center">
        <svg
          className="w-4 h-4 text-white"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      </div>
    </div>
  )
}
