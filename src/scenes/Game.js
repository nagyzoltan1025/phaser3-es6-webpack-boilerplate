import Phaser from 'phaser';
import Hero from '../entities/Hero';

class Game extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  init(data) {}

  preload() {
    this.load.image('logo', 'assets/phaser3-logo.png');
    this.load.spritesheet('hero-run-sheet', 'assets/hero/run.png', {
      frameWidth: 32,
      frameHeight:64
    });
  }

  create(data) {

    this.cursorKeys = this.input.keyboard.createCursorKeys();

    this.input.keyboard.on('keydown-SPACE', () => {
      console.log('Pressed Space');
    });

    this.space = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.space.on('up', () => {
      console.log('Release Space');
    });

    this.anims.create({
      key: 'hero-running',
      frames: this.anims.generateFrameNumbers('hero-run-sheet'),
      frameRate: 10,
      repeat: -1
    });

    this.hero = new Hero(this, 250, 160);
  }

  update(time, delta) {
    if (this.space.isDown) {
      console.log('Holding Space')
    }
  }
}

export default Game;
