import Phaser from 'phaser'

export interface AgentData {
  id: string
  name: string
  role: string
  status: 'idle' | 'busy' | 'error'
}

const STATUS_COLORS = {
  idle: 0x34d399,    // green
  busy: 0xfbbf24,    // amber
  error: 0xef4444,   // red
}

const SPRITE_TINTS = {
  default: 0xffffff,
  warm: 0xffeedd,
  cool: 0xddeeff,
  mint: 0xddffee,
  violet: 0xeeddff,
}

export class AgentNPC extends Phaser.GameObjects.Container {
  public agentData: AgentData
  private sprite!: Phaser.GameObjects.Sprite
  private nameTag!: Phaser.GameObjects.Text
  private statusIndicator!: Phaser.GameObjects.Arc
  private speechBubble!: Phaser.GameObjects.Container
  private bubbleText!: Phaser.GameObjects.Text
  private animTimer: number = 0

  constructor(scene: Phaser.Scene, x: number, y: number, data: AgentData) {
    super(scene, x, y)
    this.agentData = data
    
    // Create sprite
    this.sprite = scene.add.sprite(0, 0, 'hero', 0)
    this.sprite.setScale(1.1)
    
    // Apply tint based on agent name hash
    const tintKeys = Object.keys(SPRITE_TINTS) as (keyof typeof SPRITE_TINTS)[]
    const tintIndex = this.hashString(data.name) % tintKeys.length
    this.sprite.setTint(SPRITE_TINTS[tintKeys[tintIndex]])
    
    // Create name tag
    const emoji = this.getAgentEmoji(data.id)
    this.nameTag = scene.add.text(0, -38, `${emoji} ${data.name}`, {
      fontFamily: 'monospace',
      fontSize: '9px',
      color: '#ffffff',
      backgroundColor: '#000000cc',
      padding: { x: 3, y: 1 },
    }).setOrigin(0.5)
    
    // Create status indicator
    this.statusIndicator = scene.add.arc(18, -30, 5, 0, 360, false, STATUS_COLORS[data.status])
    this.statusIndicator.setStrokeStyle(1, 0x000000)
    
    // Create speech bubble (initially hidden)
    this.speechBubble = this.createSpeechBubble(scene)
    this.speechBubble.setVisible(false)
    
    // Add all to container
    this.add([this.sprite, this.nameTag, this.statusIndicator, this.speechBubble])
    
    // Set depth for proper layering
    this.setDepth(y)
    
    // Start idle animation
    this.sprite.play('player-idle-down')
    
    // Show status bubble for busy agents
    if (data.status === 'busy') {
      this.showStatusBubble('Working...')
    }
  }

  private getAgentEmoji(id: string): string {
    const emojis: Record<string, string> = {
      forge: '⚒️',
      infra: '🔧',
      sentinel: '🛡️',
      architect: '🏛️',
      compass: '🧭',
      atlas: '🌍',
      scout: '🔭',
      sigma: '∑',
      quant: '📈',
      prism: '🌈',
      scribe: '✍️',
      council: '⚖️',
      oracle: '🔮',
    }
    return emojis[id] || '🤖'
  }

  private createSpeechBubble(scene: Phaser.Scene): Phaser.GameObjects.Container {
    const container = scene.add.container(0, -55)
    
    const bg = scene.add.rectangle(0, 0, 80, 20, 0x1a2332, 0.9)
    bg.setStrokeStyle(1, 0x22d3ee, 0.5)
    
    this.bubbleText = scene.add.text(0, 0, '', {
      fontFamily: 'monospace',
      fontSize: '8px',
      color: '#22d3ee',
    }).setOrigin(0.5)
    
    // Triangle pointer
    const pointer = scene.add.triangle(0, 12, -5, 0, 5, 0, 0, 6, 0x1a2332)
    
    container.add([bg, this.bubbleText, pointer])
    return container
  }

  showStatusBubble(text: string): void {
    this.bubbleText.setText(text)
    
    // Resize bubble background to fit text
    const bg = this.speechBubble.getAt(0) as Phaser.GameObjects.Rectangle
    bg.setSize(Math.max(60, this.bubbleText.width + 16), 20)
    
    this.speechBubble.setVisible(true)
  }

  hideStatusBubble(): void {
    this.speechBubble.setVisible(false)
  }

  setStatus(status: 'idle' | 'busy' | 'error'): void {
    this.agentData.status = status
    this.statusIndicator.setFillStyle(STATUS_COLORS[status])
    
    if (status === 'busy') {
      this.showStatusBubble('Working...')
    } else if (status === 'error') {
      this.showStatusBubble('⚠️ Error')
    } else {
      this.hideStatusBubble()
    }
  }

  update(): void {
    this.animTimer += 1
    
    // Subtle idle animation - bobbing
    if (this.animTimer % 60 < 30) {
      this.sprite.setY(-1)
    } else {
      this.sprite.setY(1)
    }
    
    // Pulse status indicator for busy agents
    if (this.agentData.status === 'busy') {
      const pulse = Math.sin(this.animTimer * 0.1) * 0.3 + 0.7
      this.statusIndicator.setAlpha(pulse)
    }
  }

  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash)
    }
    return Math.abs(hash)
  }
}
