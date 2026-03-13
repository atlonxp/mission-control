import Phaser from 'phaser'
import { BootScene } from './scenes/BootScene'
import { OfficeScene } from './scenes/OfficeScene'

export interface OfficeGameConfig {
  parent: HTMLElement
  width: number
  height: number
  onReady?: () => void
}

export function createOfficeGame(config: OfficeGameConfig): Phaser.Game {
  const gameConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: config.parent,
    width: config.width,
    height: config.height,
    backgroundColor: '#0a0e14',
    pixelArt: true,
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 },
        debug: process.env.NODE_ENV === 'development',
      },
    },
    scene: [BootScene, OfficeScene],
    callbacks: {
      postBoot: () => {
        config.onReady?.()
      },
    },
  }

  return new Phaser.Game(gameConfig)
}

export function destroyOfficeGame(game: Phaser.Game): void {
  game.destroy(true)
}
