import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

export interface OfficeAgent {
  id: string
  name: string
  role: string
  status: 'idle' | 'busy' | 'error'
  x: number
  y: number
  currentTask?: string
}

export interface InteractionState {
  isOpen: boolean
  agent: OfficeAgent | null
}

interface OfficeState {
  // Agents
  agents: OfficeAgent[]
  setAgents: (agents: OfficeAgent[]) => void
  updateAgentStatus: (id: string, status: 'idle' | 'busy' | 'error') => void
  
  // Interaction modal
  interaction: InteractionState
  openInteraction: (agent: OfficeAgent) => void
  closeInteraction: () => void
  
  // Game ready state
  gameReady: boolean
  setGameReady: (ready: boolean) => void
  
  // Player position (throttled updates)
  playerPosition: { x: number; y: number }
  setPlayerPosition: (x: number, y: number) => void
  
  // Demo mode
  isDemoMode: boolean
  setDemoMode: (enabled: boolean) => void
}

export const useOfficeStore = create<OfficeState>()(
  subscribeWithSelector((set) => ({
    // Initial agents (will be populated from OpenClaw Gateway)
    agents: [],
    setAgents: (agents) => set({ agents }),
    updateAgentStatus: (id, status) => set((state) => ({
      agents: state.agents.map(a => a.id === id ? { ...a, status } : a)
    })),
    
    // Interaction modal
    interaction: { isOpen: false, agent: null },
    openInteraction: (agent) => set({ interaction: { isOpen: true, agent } }),
    closeInteraction: () => set({ interaction: { isOpen: false, agent: null } }),
    
    // Game state
    gameReady: false,
    setGameReady: (ready) => set({ gameReady: ready }),
    
    // Player tracking (throttled - see ZustandBridge)
    playerPosition: { x: 600, y: 400 },
    setPlayerPosition: (x, y) => set({ playerPosition: { x, y } }),
    
    // Demo mode (for public visitors)
    isDemoMode: false,
    setDemoMode: (enabled) => set({ isDemoMode: enabled }),
  }))
)
