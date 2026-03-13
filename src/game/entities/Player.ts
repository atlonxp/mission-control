import Phaser from 'phaser'

export class Player extends Phaser.Physics.Arcade.Sprite {
  private lastDirection: 'down' | 'up' | 'left' | 'right' = 'down'
  private nameTag!: Phaser.GameObjects.Text

  constructor(scene: Phaser.Scene, x: number, y: number) {
    super(scene, x, y, 'hero', 0)
    
    this.setScale(1.2)
    
    // Add name tag above player
    this.nameTag = scene.add.text(x, y - 35, '⚡ HALL (CEO)', {
      fontFamily: 'monospace',
      fontSize: '10px',
      color: '#fbbf24',
      backgroundColor: '#000000aa',
      padding: { x: 4, y: 2 },
    }).setOrigin(0.5)
    
    // Start with idle animation
    this.play('player-idle-down')
  }

  updateAnimation(vx: number, vy: number): void {
    // Update name tag position
    this.nameTag.setPosition(this.x, this.y - 35)
    this.nameTag.setDepth(this.depth + 1)
    
    const isMoving = vx !== 0 || vy !== 0
    
    if (isMoving) {
      // Determine direction
      if (Math.abs(vx) > Math.abs(vy)) {
        this.lastDirection = vx < 0 ? 'left' : 'right'
        this.setFlipX(vx < 0)
        if (this.anims.currentAnim?.key !== 'player-walk-side') {
          this.play('player-walk-side')
        }
      } else {
        if (vy < 0) {
          this.lastDirection = 'up'
          this.setFlipX(false)
          if (this.anims.currentAnim?.key !== 'player-walk-up') {
            this.play('player-walk-up')
          }
        } else {
          this.lastDirection = 'down'
          this.setFlipX(false)
          if (this.anims.currentAnim?.key !== 'player-walk-down') {
            this.play('player-walk-down')
          }
        }
      }
    } else {
      // Idle animation based on last direction
      const idleAnim = this.lastDirection === 'left' || this.lastDirection === 'right'
        ? 'player-idle-side'
        : this.lastDirection === 'up'
          ? 'player-idle-up'
          : 'player-idle-down'
      
      if (this.anims.currentAnim?.key !== idleAnim) {
        this.play(idleAnim)
        if (this.lastDirection === 'left') {
          this.setFlipX(true)
        }
      }
    }
  }

  destroy(fromScene?: boolean): void {
    this.nameTag?.destroy()
    super.destroy(fromScene)
  }
}
