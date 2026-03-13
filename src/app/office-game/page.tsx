'use client'

import dynamic from 'next/dynamic'

// Dynamic import to avoid SSR issues with Phaser
const OfficeGameWrapper = dynamic(
  () => import('@/components/game/OfficeGameWrapper').then(mod => ({ default: mod.OfficeGameWrapper })),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="text-cyan-400 font-mono">Loading Office...</div>
      </div>
    )
  }
)

export default function OfficeGamePage() {
  return (
    <div className="w-full h-screen bg-[#0a0e14]">
      <OfficeGameWrapper />
    </div>
  )
}
