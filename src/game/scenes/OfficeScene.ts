import Phaser from 'phaser'
import { Player } from '../entities/Player'
import { AgentNPC } from '../entities/AgentNPC'

interface AgentData {
  id: string
  name: string
  role: string
  status: 'idle' | 'busy' | 'error'
  x: number
  y: number
}

export class OfficeScene extends Phaser.Scene {
  private player!: Player
  private agents: AgentNPC[] = []
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys
  private wasd!: { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key }
  private interactKey!: Phaser.Input.Keyboard.Key
  private interactionPrompt!: Phaser.GameObjects.Container
  private nearestAgent: AgentNPC | null = null

  // Office dimensions
  private readonly OFFICE_WIDTH = 1200
  private readonly OFFICE_HEIGHT = 800
  private readonly TILE_SIZE = 32

  constructor() {
    super({ key: 'OfficeScene' })
  }

  create(): void {
    // Create office floor
    this.createOfficeFloor()
    
    // Create zones
    this.createZones()
    
    // Create furniture
    this.createFurniture()
    
    // Create player (CEO)
    this.player = new Player(this, 600, 400)
    this.add.existing(this.player)
    this.physics.add.existing(this.player)
    
    // Create sample agents
    this.createSampleAgents()
    
    // Setup camera
    this.cameras.main.setBounds(0, 0, this.OFFICE_WIDTH, this.OFFICE_HEIGHT)
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1)
    this.cameras.main.setZoom(1.2)
    
    // Setup input
    this.cursors = this.input.keyboard!.createCursorKeys()
    this.wasd = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    }
    this.interactKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.E)
    
    // Create interaction prompt
    this.createInteractionPrompt()
    
    // Setup world bounds
    this.physics.world.setBounds(0, 0, this.OFFICE_WIDTH, this.OFFICE_HEIGHT)
    this.player.setCollideWorldBounds(true)
    
    // Interaction key handler
    this.interactKey.on('down', () => this.handleInteraction())
  }

  private createOfficeFloor(): void {
    // Create tiled floor
    for (let x = 0; x < this.OFFICE_WIDTH; x += this.TILE_SIZE) {
      for (let y = 0; y < this.OFFICE_HEIGHT; y += this.TILE_SIZE) {
        const tile = this.add.image(x, y, 'floor')
        tile.setOrigin(0, 0)
        tile.setScale(this.TILE_SIZE / tile.width)
        tile.setAlpha((Math.floor(x / this.TILE_SIZE) + Math.floor(y / this.TILE_SIZE)) % 2 === 0 ? 0.7 : 0.5)
        tile.setTint(0x1a2332)
      }
    }
  }

  private createZones(): void {
    const zones = [
      { x: 50, y: 50, w: 350, h: 300, label: 'Engineering Bay', color: 0x22d3ee },
      { x: 450, y: 50, w: 300, h: 300, label: 'Product Studio', color: 0x34d399 },
      { x: 800, y: 50, w: 350, h: 300, label: 'Research Lab', color: 0xa78bfa },
      { x: 50, y: 400, w: 300, h: 350, label: 'Operations', color: 0xfbbf24 },
      { x: 400, y: 400, w: 400, h: 350, label: 'Lounge', color: 0xf472b6 },
      { x: 850, y: 400, w: 300, h: 350, label: 'Meeting Room', color: 0x60a5fa },
    ]

    zones.forEach(zone => {
      // Zone background
      const bg = this.add.rectangle(zone.x, zone.y, zone.w, zone.h, zone.color, 0.08)
      bg.setOrigin(0, 0)
      bg.setStrokeStyle(1, zone.color, 0.3)
      
      // Zone label
      this.add.text(zone.x + 10, zone.y + 8, zone.label, {
        fontFamily: 'monospace',
        fontSize: '11px',
        color: '#' + zone.color.toString(16).padStart(6, '0'),
      })
    })
  }

  private createFurniture(): void {
    const deskPositions = [
      // Engineering
      { x: 100, y: 150 }, { x: 200, y: 150 }, { x: 300, y: 150 },
      { x: 100, y: 280 }, { x: 200, y: 280 }, { x: 300, y: 280 },
      // Product
      { x: 500, y: 150 }, { x: 600, y: 150 },
      { x: 500, y: 280 }, { x: 600, y: 280 },
      // Research
      { x: 900, y: 150 }, { x: 1000, y: 150 },
      { x: 900, y: 280 }, { x: 1000, y: 280 },
      // Operations
      { x: 100, y: 500 }, { x: 200, y: 500 },
      { x: 100, y: 630 }, { x: 200, y: 630 },
    ]

    deskPositions.forEach(pos => {
      const desk = this.add.image(pos.x, pos.y, 'desk')
      desk.setScale(0.8)
      desk.setDepth(pos.y)
      
      const chair = this.add.image(pos.x, pos.y + 30, 'chair')
      chair.setScale(0.6)
      chair.setDepth(pos.y + 30)
      
      const computer = this.add.image(pos.x, pos.y - 10, 'computer')
      computer.setScale(0.5)
      computer.setDepth(pos.y + 1)
    })

    // Plants
    this.add.image(45, 380, 'plant1').setScale(1.2)
    this.add.image(1155, 380, 'plant2').setScale(1.2)
    this.add.image(395, 750, 'plant1').setScale(1.0)
    this.add.image(805, 750, 'plant2').setScale(1.0)
  }

  private createSampleAgents(): void {
    // Sample agent data - will be replaced by real data from store
    const sampleAgents: AgentData[] = [
      { id: 'forge', name: 'FORGE', role: 'Full-Stack Dev', status: 'busy', x: 100, y: 180 },
      { id: 'infra', name: 'INFRA', role: 'DevOps', status: 'idle', x: 200, y: 180 },
      { id: 'sentinel', name: 'SENTINEL', role: 'Security', status: 'busy', x: 300, y: 180 },
      { id: 'architect', name: 'ARCHITECT', role: 'CTO', status: 'busy', x: 500, y: 180 },
      { id: 'compass', name: 'COMPASS', role: 'Product', status: 'idle', x: 600, y: 180 },
      { id: 'atlas', name: 'ATLAS', role: 'Research', status: 'busy', x: 900, y: 180 },
      { id: 'scout', name: 'SCOUT', role: 'Intel', status: 'idle', x: 1000, y: 180 },
      { id: 'sigma', name: 'SIGMA', role: 'AI/ML', status: 'busy', x: 100, y: 530 },
      { id: 'quant', name: 'QUANT', role: 'Fintech', status: 'idle', x: 200, y: 530 },
    ]

    sampleAgents.forEach(data => {
      const agent = new AgentNPC(this, data.x, data.y, data)
      this.add.existing(agent)
      this.agents.push(agent)
    })
  }

  private createInteractionPrompt(): void {
    this.interactionPrompt = this.add.container(0, 0)
    
    const bg = this.add.rectangle(0, 0, 80, 28, 0x000000, 0.7)
    bg.setStrokeStyle(1, 0x22d3ee)
    
    const text = this.add.text(0, 0, '[E] Talk', {
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#22d3ee',
    }).setOrigin(0.5)
    
    this.interactionPrompt.add([bg, text])
    this.interactionPrompt.setVisible(false)
    this.interactionPrompt.setDepth(1000)
  }

  update(): void {
    // Handle movement
    const speed = 150
    let vx = 0
    let vy = 0
    
    if (this.cursors.left.isDown || this.wasd.A.isDown) vx = -speed
    else if (this.cursors.right.isDown || this.wasd.D.isDown) vx = speed
    
    if (this.cursors.up.isDown || this.wasd.W.isDown) vy = -speed
    else if (this.cursors.down.isDown || this.wasd.S.isDown) vy = speed
    
    this.player.setVelocity(vx, vy)
    this.player.updateAnimation(vx, vy)
    
    // Update player depth for proper layering
    this.player.setDepth(this.player.y)
    
    // Check proximity to agents
    this.checkAgentProximity()
    
    // Update agents
    this.agents.forEach(agent => agent.update())
  }

  private checkAgentProximity(): void {
    const INTERACTION_RADIUS = 60
    let nearest: AgentNPC | null = null
    let nearestDist = INTERACTION_RADIUS

    for (const agent of this.agents) {
      const dist = Phaser.Math.Distance.Between(
        this.player.x, this.player.y,
        agent.x, agent.y
      )
      if (dist < nearestDist) {
        nearestDist = dist
        nearest = agent
      }
    }

    this.nearestAgent = nearest
    
    if (nearest !== null) {
      this.interactionPrompt.setPosition(nearest.x, nearest.y - 50)
      this.interactionPrompt.setVisible(true)
    } else {
      this.interactionPrompt.setVisible(false)
    }
  }

  private handleInteraction(): void {
    if (!this.nearestAgent) return
    
    // Emit event for React to handle
    this.events.emit('agent-interact', {
      id: this.nearestAgent.agentData.id,
      name: this.nearestAgent.agentData.name,
      role: this.nearestAgent.agentData.role,
      status: this.nearestAgent.agentData.status,
    })
    
    // Also emit to game registry for cross-scene communication
    this.game.events.emit('agent-interact', this.nearestAgent.agentData)
  }
}
