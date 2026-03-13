'use client'

import { useEffect, useRef, useState } from 'react'
import { useOfficeStore } from '@/stores/office-store'

// Dynamic imports for client-only code
let createOfficeGame: typeof import('@/game/OfficeGame').createOfficeGame | null = null
let destroyOfficeGame: typeof import('@/game/OfficeGame').destroyOfficeGame | null = null
let getGatewaySync: typeof import('@/game/systems/GatewaySync').getGatewaySync | null = null
let destroyGatewaySync: typeof import('@/game/systems/GatewaySync').destroyGatewaySync | null = null

export function OfficeGameWrapper() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { 
    interaction, 
    closeInteraction, 
    setGameReady,
    gameReady,
    agents,
  } = useOfficeStore()

  useEffect(() => {
    const initGame = async () => {
      try {
        // Dynamic import Phaser and game modules
        const [gameModule, syncModule] = await Promise.all([
          import('@/game/OfficeGame'),
          import('@/game/systems/GatewaySync'),
        ])
        
        createOfficeGame = gameModule.createOfficeGame
        destroyOfficeGame = gameModule.destroyOfficeGame
        getGatewaySync = syncModule.getGatewaySync
        destroyGatewaySync = syncModule.destroyGatewaySync
        
        // Start gateway sync (fetches real agents)
        getGatewaySync()
        
        if (containerRef.current && !gameRef.current) {
          const rect = containerRef.current.getBoundingClientRect()
          
          gameRef.current = createOfficeGame({
            parent: containerRef.current,
            width: rect.width,
            height: rect.height,
            onReady: () => {
              setGameReady(true)
              setIsLoading(false)
            }
          })
        }
      } catch (err) {
        console.error('Failed to initialize game:', err)
        setError('Failed to load the office game')
        setIsLoading(false)
      }
    }

    initGame()

    return () => {
      if (destroyGatewaySync) destroyGatewaySync()
      if (gameRef.current && destroyOfficeGame) {
        destroyOfficeGame(gameRef.current)
        gameRef.current = null
      }
    }
  }, [setGameReady])

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (gameRef.current && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        gameRef.current.scale.resize(rect.width, rect.height)
      }
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const handleAssignTask = async () => {
    if (!interaction.agent) return
    // TODO: Implement task assignment
    alert(`Task assignment for ${interaction.agent.name} - Coming soon!`)
  }

  const handleSendMessage = async () => {
    if (!interaction.agent) return
    // TODO: Implement messaging
    alert(`Message to ${interaction.agent.name} - Coming soon!`)
  }

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#0a0e14] rounded-lg overflow-hidden">
      {/* Game canvas container */}
      <div 
        ref={containerRef} 
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14] z-10">
          <div className="text-center">
            <div className="text-cyan-400 text-2xl mb-2">🏢</div>
            <div className="text-cyan-400/70 text-sm font-mono">Loading Office...</div>
            <div className="mt-2 w-32 h-1 bg-slate-800 rounded overflow-hidden">
              <div className="h-full bg-cyan-400 animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Error overlay */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14] z-10">
          <div className="text-center">
            <div className="text-red-400 text-lg mb-2">⚠️</div>
            <div className="text-red-400/70 text-sm">{error}</div>
          </div>
        </div>
      )}
      
      {/* HUD - Agent count */}
      {gameReady && (
        <div className="absolute top-4 right-4 bg-black/70 border border-cyan-500/30 rounded px-3 py-2 z-20">
          <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider mb-1">Crew Online</div>
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-slate-300">{agents.filter(a => a.status === 'busy').length} active</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-green-400" />
              <span className="text-slate-300">{agents.filter(a => a.status === 'idle').length} idle</span>
            </span>
          </div>
        </div>
      )}
      
      {/* Controls hint */}
      {gameReady && (
        <div className="absolute bottom-4 left-4 bg-black/70 border border-cyan-500/30 rounded px-3 py-2 z-20">
          <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider mb-1">Controls</div>
          <div className="text-xs text-slate-300 font-mono space-y-0.5">
            <div>WASD / Arrows — Move</div>
            <div>E — Interact with agent</div>
          </div>
        </div>
      )}
      
      {/* Interaction Modal */}
      {interaction.isOpen && interaction.agent && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-50"
          onClick={closeInteraction}
        >
          <div 
            className="bg-[#1a2332] border border-cyan-500/30 rounded-lg p-6 max-w-sm w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{interaction.agent.name}</h3>
                <p className="text-sm text-slate-400">{interaction.agent.role}</p>
              </div>
              <button 
                onClick={closeInteraction}
                className="text-slate-400 hover:text-white text-xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${
                interaction.agent.status === 'busy' ? 'bg-amber-400 animate-pulse' :
                interaction.agent.status === 'idle' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-sm text-slate-300 capitalize">
                {interaction.agent.status === 'busy' ? 'Working' : interaction.agent.status}
              </span>
            </div>
            
            {interaction.agent.currentTask && (
              <div className="bg-black/30 rounded p-3 mb-4">
                <div className="text-[10px] text-cyan-400/60 uppercase tracking-wider mb-1">Current Task</div>
                <div className="text-sm text-slate-200">{interaction.agent.currentTask}</div>
              </div>
            )}
            
            <div className="space-y-2">
              <button 
                onClick={handleAssignTask}
                className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded px-4 py-2 text-sm transition-colors"
              >
                📋 Assign Task
              </button>
              <button 
                onClick={handleSendMessage}
                className="w-full bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/40 text-slate-300 rounded px-4 py-2 text-sm transition-colors"
              >
                💬 Send Message
              </button>
              <button 
                onClick={closeInteraction}
                className="w-full bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/40 text-slate-300 rounded px-4 py-2 text-sm transition-colors"
              >
                📊 View Stats
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
