import Phaser from 'phaser'
import { AgentNPC } from '../entities/AgentNPC'

// Waypoints for idle agents to roam to
const LOUNGE_WAYPOINTS = [
  { x: 500, y: 500 },
  { x: 600, y: 550 },
  { x: 550, y: 600 },
  { x: 650, y: 500 },
]

const WHITEBOARD_WAYPOINTS = [
  { x: 920, y: 450 },
  { x: 980, y: 480 },
]

const COFFEE_WAYPOINTS = [
  { x: 450, y: 650 },
  { x: 500, y: 680 },
]

export class RoamingSystem {
  private scene: Phaser.Scene
  private roamingAgents: Map<string, RoamingState> = new Map()
  private checkInterval: ReturnType<typeof setInterval> | null = null

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.start()
  }

  start(): void {
    // Check for roaming candidates every 5 seconds
    this.checkInterval = setInterval(() => this.checkForRoamers(), 5000)
  }

  stop(): void {
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }
  }

  private checkForRoamers(): void {
    this.scene.events.emit('check-idle-agents')
  }

  // Called by OfficeScene when it has idle agents
  startRoaming(agent: AgentNPC): void {
    if (this.roamingAgents.has(agent.agentData.id)) return
    if (agent.agentData.status !== 'idle') return

    // Pick a random destination
    const destinations = [...LOUNGE_WAYPOINTS, ...WHITEBOARD_WAYPOINTS, ...COFFEE_WAYPOINTS]
    const dest = destinations[Math.floor(Math.random() * destinations.length)]
    
    const state: RoamingState = {
      agent,
      startX: agent.x,
      startY: agent.y,
      destX: dest.x,
      destY: dest.y,
      progress: 0,
      phase: 'moving',
      returnTimer: null,
    }

    this.roamingAgents.set(agent.agentData.id, state)
  }

  update(delta: number): void {
    for (const [id, state] of this.roamingAgents) {
      if (state.agent.agentData.status === 'busy') {
        // Agent became busy, return them to desk immediately
        this.returnToDesk(id, state, true)
        continue
      }

      if (state.phase === 'moving') {
        state.progress += delta / 2000 // 2 seconds to reach destination
        
        if (state.progress >= 1) {
          state.progress = 1
          state.phase = 'waiting'
          
          // Wait 3-8 seconds then return
          const waitTime = 3000 + Math.random() * 5000
          state.returnTimer = setTimeout(() => {
            this.returnToDesk(id, state, false)
          }, waitTime)
        }

        // Lerp position
        const x = state.startX + (state.destX - state.startX) * this.easeInOut(state.progress)
        const y = state.startY + (state.destY - state.startY) * this.easeInOut(state.progress)
        state.agent.setPosition(x, y)
        
      } else if (state.phase === 'returning') {
        state.progress += delta / 2000
        
        if (state.progress >= 1) {
          state.agent.setPosition(state.startX, state.startY)
          this.roamingAgents.delete(id)
          continue
        }

        const x = state.destX + (state.startX - state.destX) * this.easeInOut(state.progress)
        const y = state.destY + (state.startY - state.destY) * this.easeInOut(state.progress)
        state.agent.setPosition(x, y)
      }
    }
  }

  private returnToDesk(id: string, state: RoamingState, immediate: boolean): void {
    if (state.returnTimer) {
      clearTimeout(state.returnTimer)
      state.returnTimer = null
    }

    if (immediate) {
      state.agent.setPosition(state.startX, state.startY)
      this.roamingAgents.delete(id)
    } else {
      state.phase = 'returning'
      state.progress = 0
      // Swap start/dest for return journey
      const tempX = state.destX
      const tempY = state.destY
      state.destX = state.startX
      state.destY = state.startY
      state.startX = tempX
      state.startY = tempY
    }
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2
  }

  destroy(): void {
    this.stop()
    for (const state of this.roamingAgents.values()) {
      if (state.returnTimer) clearTimeout(state.returnTimer)
    }
    this.roamingAgents.clear()
  }
}

interface RoamingState {
  agent: AgentNPC
  startX: number
  startY: number
  destX: number
  destY: number
  progress: number
  phase: 'moving' | 'waiting' | 'returning'
  returnTimer: ReturnType<typeof setTimeout> | null
}
