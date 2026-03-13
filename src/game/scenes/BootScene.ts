import Phaser from 'phaser'

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' })
  }

  preload(): void {
    // Progress bar
    const width = this.cameras.main.width
    const height = this.cameras.main.height
    
    const progressBar = this.add.graphics()
    const progressBox = this.add.graphics()
    progressBox.fillStyle(0x1a2332, 0.8)
    progressBox.fillRect(width / 2 - 160, height / 2 - 25, 320, 50)
    
    const loadingText = this.add.text(width / 2, height / 2 - 50, 'Loading Office...', {
      fontFamily: 'monospace',
      fontSize: '16px',
      color: '#22d3ee',
    }).setOrigin(0.5)

    this.load.on('progress', (value: number) => {
      progressBar.clear()
      progressBar.fillStyle(0x22d3ee, 1)
      progressBar.fillRect(width / 2 - 150, height / 2 - 15, 300 * value, 30)
    })

    this.load.on('complete', () => {
      progressBar.destroy()
      progressBox.destroy()
      loadingText.destroy()
    })

    // Load Kenney office sprites
    this.load.image('floor', '/office-sprites/kenney/floorFull.png')
    this.load.image('desk', '/office-sprites/kenney/desk.png')
    this.load.image('chair', '/office-sprites/kenney/chairDesk.png')
    this.load.image('computer', '/office-sprites/kenney/computerScreen.png')
    this.load.image('plant1', '/office-sprites/kenney/plantSmall1.png')
    this.load.image('plant2', '/office-sprites/kenney/plantSmall2.png')
    
    // Load hero spritesheet for player and agents
    this.load.spritesheet('hero', '/office-sprites/cc0-hero/player_full_animation.png', {
      frameWidth: 32,
      frameHeight: 48,
    })
  }

  create(): void {
    // Create animations
    this.createAnimations()
    
    // Start main scene
    this.scene.start('OfficeScene')
  }

  private createAnimations(): void {
    // Player walk animations (using hero spritesheet)
    // Row 0: forward, Row 1: back, Row 2: side-left, Row 3: side-right
    
    this.anims.create({
      key: 'player-idle-down',
      frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 0 }),
      frameRate: 1,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-walk-down',
      frames: this.anims.generateFrameNumbers('hero', { start: 0, end: 5 }),
      frameRate: 8,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-idle-up',
      frames: this.anims.generateFrameNumbers('hero', { start: 6, end: 6 }),
      frameRate: 1,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-walk-up',
      frames: this.anims.generateFrameNumbers('hero', { start: 6, end: 11 }),
      frameRate: 8,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-idle-side',
      frames: this.anims.generateFrameNumbers('hero', { start: 18, end: 18 }),
      frameRate: 1,
      repeat: -1,
    })

    this.anims.create({
      key: 'player-walk-side',
      frames: this.anims.generateFrameNumbers('hero', { start: 18, end: 23 }),
      frameRate: 8,
      repeat: -1,
    })
  }
}
