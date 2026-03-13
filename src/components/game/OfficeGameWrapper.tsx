'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useOfficeStore } from '@/stores/office-store'

let createOfficeGame: typeof import('@/game/OfficeGame').createOfficeGame | null = null
let destroyOfficeGame: typeof import('@/game/OfficeGame').destroyOfficeGame | null = null
let getGatewaySync: typeof import('@/game/systems/GatewaySync').getGatewaySync | null = null
let destroyGatewaySync: typeof import('@/game/systems/GatewaySync').destroyGatewaySync | null = null
let TaskSystem: typeof import('@/game/systems/TaskSystem').TaskSystem | null = null

type ModalView = 'main' | 'task' | 'message'

export function OfficeGameWrapper() {
  const containerRef = useRef<HTMLDivElement>(null)
  const gameRef = useRef<Phaser.Game | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalView, setModalView] = useState<ModalView>('main')
  const [taskDescription, setTaskDescription] = useState('')
  const [taskPriority, setTaskPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitResult, setSubmitResult] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  
  const { 
    interaction, 
    closeInteraction, 
    setGameReady,
    gameReady,
    agents,
    isDemoMode,
  } = useOfficeStore()

  const handleCloseModal = useCallback(() => {
    closeInteraction()
    setModalView('main')
    setTaskDescription('')
    setSubmitResult(null)
  }, [closeInteraction])

  const handleAssignTask = useCallback(async () => {
    if (!interaction.agent || !TaskSystem || isDemoMode) return
    if (!taskDescription.trim()) {
      setSubmitResult({ type: 'error', message: 'Please enter a task description' })
      return
    }

    setIsSubmitting(true)
    setSubmitResult(null)

    try {
      const result = await TaskSystem.assignTask({
        agentId: interaction.agent.id,
        agentName: interaction.agent.name,
        description: taskDescription,
        priority: taskPriority,
      })

      if (result.success) {
        setSubmitResult({ type: 'success', message: '✓ Task assigned!' })
        setTimeout(() => {
          handleCloseModal()
        }, 1500)
      } else {
        setSubmitResult({ type: 'error', message: result.message })
      }
    } catch {
      setSubmitResult({ type: 'error', message: 'Failed to assign task' })
    } finally {
      setIsSubmitting(false)
    }
  }, [interaction.agent, taskDescription, taskPriority, isDemoMode, handleCloseModal])

  useEffect(() => {
    const initGame = async () => {
      try {
        const [gameModule, syncModule, taskModule] = await Promise.all([
          import('@/game/OfficeGame'),
          import('@/game/systems/GatewaySync'),
          import('@/game/systems/TaskSystem'),
        ])
        
        createOfficeGame = gameModule.createOfficeGame
        destroyOfficeGame = gameModule.destroyOfficeGame
        getGatewaySync = syncModule.getGatewaySync
        destroyGatewaySync = syncModule.destroyGatewaySync
        TaskSystem = taskModule.TaskSystem
        
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

  const busyCount = agents.filter(a => a.status === 'busy').length
  const idleCount = agents.filter(a => a.status === 'idle').length

  return (
    <div className="relative w-full h-full min-h-[600px] bg-[#0a0e14] rounded-lg overflow-hidden">
      <div 
        ref={containerRef} 
        className="absolute inset-0"
        style={{ imageRendering: 'pixelated' }}
      />
      
      {/* Loading */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14] z-10">
          <div className="text-center">
            <div className="text-4xl mb-3">🏢</div>
            <div className="text-cyan-400 text-lg font-mono mb-2">NightOWL Office</div>
            <div className="text-slate-500 text-sm font-mono">Loading...</div>
          </div>
        </div>
      )}
      
      {/* Error */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#0a0e14] z-10">
          <div className="text-red-400">{error}</div>
        </div>
      )}
      
      {/* HUD */}
      {gameReady && (
        <>
          {/* Title */}
          <div className="absolute top-4 left-4 z-20">
            <div className="text-cyan-400 font-bold text-lg">🏢 NightOWL Office</div>
            <div className="text-slate-500 text-xs font-mono">CEO: Hall ⚡</div>
          </div>
          
          {/* Agent count */}
          <div className="absolute top-4 right-4 bg-black/70 border border-cyan-500/30 rounded px-3 py-2 z-20">
            <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider mb-1">Crew Status</div>
            <div className="flex items-center gap-4 text-xs">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                <span className="text-slate-300">{busyCount} working</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-400" />
                <span className="text-slate-300">{idleCount} idle</span>
              </span>
            </div>
          </div>
          
          {/* Controls */}
          <div className="absolute bottom-4 left-4 bg-black/70 border border-cyan-500/30 rounded px-3 py-2 z-20">
            <div className="text-[10px] text-cyan-400/60 font-mono uppercase tracking-wider mb-1">Controls</div>
            <div className="text-xs text-slate-300 font-mono space-y-0.5">
              <div><span className="text-cyan-400">WASD</span> Move</div>
              <div><span className="text-cyan-400">E</span> Interact</div>
            </div>
          </div>

          {/* Demo mode badge */}
          {isDemoMode && (
            <div className="absolute bottom-4 right-4 bg-amber-500/20 border border-amber-500/40 text-amber-300 rounded px-3 py-1.5 z-20 text-xs font-mono">
              👀 Demo Mode
            </div>
          )}
        </>
      )}
      
      {/* Interaction Modal */}
      {interaction.isOpen && interaction.agent && (
        <div 
          className="absolute inset-0 flex items-center justify-center bg-black/60 z-50"
          onClick={handleCloseModal}
        >
          <div 
            className="bg-[#1a2332] border border-cyan-500/30 rounded-lg p-6 max-w-md w-full mx-4 shadow-2xl"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{interaction.agent.name}</h3>
                <p className="text-sm text-slate-400">{interaction.agent.role}</p>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-white text-2xl leading-none"
              >
                ×
              </button>
            </div>
            
            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              <span className={`w-3 h-3 rounded-full ${
                interaction.agent.status === 'busy' ? 'bg-amber-400 animate-pulse' :
                interaction.agent.status === 'idle' ? 'bg-green-400' : 'bg-red-400'
              }`} />
              <span className="text-sm text-slate-300 capitalize">
                {interaction.agent.status === 'busy' ? 'Working' : interaction.agent.status}
              </span>
            </div>

            {/* Main menu view */}
            {modalView === 'main' && (
              <div className="space-y-2">
                <button 
                  onClick={() => setModalView('task')}
                  disabled={isDemoMode}
                  className="w-full bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 rounded px-4 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>📋</span>
                  <span>Assign Task</span>
                </button>
                <button 
                  onClick={() => setModalView('message')}
                  disabled={isDemoMode}
                  className="w-full bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/40 text-slate-300 rounded px-4 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <span>💬</span>
                  <span>Send Message</span>
                </button>
                <button 
                  onClick={handleCloseModal}
                  className="w-full bg-slate-500/20 hover:bg-slate-500/30 border border-slate-500/40 text-slate-300 rounded px-4 py-3 text-sm transition-colors flex items-center gap-2"
                >
                  <span>📊</span>
                  <span>View Stats</span>
                </button>
                {isDemoMode && (
                  <p className="text-xs text-amber-400/70 text-center mt-2">
                    Actions disabled in demo mode
                  </p>
                )}
              </div>
            )}

            {/* Task assignment view */}
            {modalView === 'task' && (
              <div className="space-y-4">
                <button 
                  onClick={() => setModalView('main')}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                
                <div>
                  <label className="block text-xs text-cyan-400/60 uppercase tracking-wider mb-2">
                    Task Description
                  </label>
                  <textarea
                    value={taskDescription}
                    onChange={e => setTaskDescription(e.target.value)}
                    placeholder={`What should ${interaction.agent.name} work on?`}
                    className="w-full bg-black/30 border border-slate-600 rounded px-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="text-right text-xs text-slate-500 mt-1">
                    {taskDescription.length}/1000
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-cyan-400/60 uppercase tracking-wider mb-2">
                    Priority
                  </label>
                  <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as const).map(p => (
                      <button
                        key={p}
                        onClick={() => setTaskPriority(p)}
                        className={`flex-1 px-3 py-2 rounded text-sm capitalize transition-colors ${
                          taskPriority === p
                            ? p === 'high' ? 'bg-red-500/30 border-red-500 text-red-300'
                            : p === 'medium' ? 'bg-amber-500/30 border-amber-500 text-amber-300'
                            : 'bg-green-500/30 border-green-500 text-green-300'
                            : 'bg-slate-500/20 border-slate-600 text-slate-400'
                        } border`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {submitResult && (
                  <div className={`text-sm text-center py-2 rounded ${
                    submitResult.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'
                  }`}>
                    {submitResult.message}
                  </div>
                )}

                <button 
                  onClick={handleAssignTask}
                  disabled={isSubmitting || !taskDescription.trim()}
                  className="w-full bg-cyan-500 hover:bg-cyan-600 text-white font-medium rounded px-4 py-3 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Assigning...' : `Assign to ${interaction.agent.name}`}
                </button>
              </div>
            )}

            {/* Message view */}
            {modalView === 'message' && (
              <div className="space-y-4">
                <button 
                  onClick={() => setModalView('main')}
                  className="text-sm text-slate-400 hover:text-white"
                >
                  ← Back
                </button>
                <p className="text-sm text-slate-400 text-center py-8">
                  Direct messaging coming soon...
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
