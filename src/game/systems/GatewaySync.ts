import { useOfficeStore, type OfficeAgent } from '@/stores/office-store'

const SYNC_INTERVAL = 10000 // 10 seconds

// Agent desk positions by role
const DESK_POSITIONS: Record<string, { x: number; y: number }> = {
  // Engineering
  'forge': { x: 100, y: 180 },
  'infra': { x: 200, y: 180 },
  'sentinel': { x: 300, y: 180 },
  'architect': { x: 100, y: 310 },
  // Product
  'compass': { x: 500, y: 180 },
  'prism': { x: 600, y: 180 },
  'scribe': { x: 500, y: 310 },
  // Research
  'atlas': { x: 900, y: 180 },
  'scout': { x: 1000, y: 180 },
  'sigma': { x: 900, y: 310 },
  // Operations
  'quant': { x: 100, y: 530 },
  'council': { x: 200, y: 530 },
  'oracle': { x: 100, y: 660 },
  // Default
  'default': { x: 600, y: 500 },
}

export class GatewaySync {
  private intervalId: ReturnType<typeof setInterval> | null = null
  private isRunning = false

  constructor() {
    this.start()
  }

  async start(): Promise<void> {
    if (this.isRunning) return
    this.isRunning = true

    // Initial sync
    await this.syncAgents()

    // Periodic sync
    this.intervalId = setInterval(() => {
      this.syncAgents()
    }, SYNC_INTERVAL)
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
    this.isRunning = false
  }

  private async syncAgents(): Promise<void> {
    try {
      const response = await fetch('/api/agents')
      if (!response.ok) return

      const data = await response.json()
      const rawAgents = Array.isArray(data.agents) ? data.agents : []

      const agents: OfficeAgent[] = rawAgents.map((agent: any) => {
        const id = String(agent.id || agent.name || 'unknown').toLowerCase()
        const position = DESK_POSITIONS[id] || DESK_POSITIONS['default']
        
        return {
          id,
          name: agent.name || agent.id || 'Unknown',
          role: agent.role || 'Agent',
          status: this.mapStatus(agent.status),
          x: position.x,
          y: position.y,
          currentTask: agent.last_activity || undefined,
        }
      })

      useOfficeStore.getState().setAgents(agents)
    } catch (error) {
      console.warn('[GatewaySync] Failed to sync agents:', error)
    }
  }

  private mapStatus(status: string): 'idle' | 'busy' | 'error' {
    if (status === 'busy' || status === 'working') return 'busy'
    if (status === 'error' || status === 'alert') return 'error'
    return 'idle'
  }
}

// Singleton instance
let gatewaySyncInstance: GatewaySync | null = null

export function getGatewaySync(): GatewaySync {
  if (!gatewaySyncInstance) {
    gatewaySyncInstance = new GatewaySync()
  }
  return gatewaySyncInstance
}

export function destroyGatewaySync(): void {
  if (gatewaySyncInstance) {
    gatewaySyncInstance.stop()
    gatewaySyncInstance = null
  }
}
