import Phaser from 'phaser'
import { useOfficeStore, type OfficeAgent } from '@/stores/office-store'

const POSITION_THRESHOLD = 8 // pixels
const UPDATE_INTERVAL = 100 // ms

export class ZustandBridge {
  private scene: Phaser.Scene
  private lastReportedPosition = { x: 0, y: 0 }
  private lastUpdateTime = 0
  private unsubscribers: (() => void)[] = []

  constructor(scene: Phaser.Scene) {
    this.scene = scene
    this.setupSubscriptions()
  }

  private setupSubscriptions(): void {
    // Subscribe to agent changes from store → sync to Phaser
    const unsubAgents = useOfficeStore.subscribe(
      (state) => state.agents,
      (agents) => this.syncAgentsToPhaser(agents)
    )
    this.unsubscribers.push(unsubAgents)
  }

  // Called from Phaser update loop - throttled
  updatePlayerPosition(x: number, y: number): void {
    const now = Date.now()
    const dx = Math.abs(x - this.lastReportedPosition.x)
    const dy = Math.abs(y - this.lastReportedPosition.y)
    const distance = Math.sqrt(dx * dx + dy * dy)

    // Only update if significant movement or time elapsed
    if (distance > POSITION_THRESHOLD || now - this.lastUpdateTime > UPDATE_INTERVAL) {
      useOfficeStore.getState().setPlayerPosition(x, y)
      this.lastReportedPosition = { x, y }
      this.lastUpdateTime = now
    }
  }

  // Sync agents from store to Phaser scene
  private syncAgentsToPhaser(agents: OfficeAgent[]): void {
    this.scene.events.emit('agents-updated', agents)
  }

  // Trigger interaction modal
  openAgentInteraction(agent: OfficeAgent): void {
    useOfficeStore.getState().openInteraction(agent)
  }

  destroy(): void {
    this.unsubscribers.forEach(unsub => unsub())
    this.unsubscribers = []
  }
}
