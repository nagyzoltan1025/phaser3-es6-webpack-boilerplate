import Phaser from 'phaser';
import Hero from '../entities/Hero';

class Game extends Phaser.Scene {
    constructor() {
        super({key: 'GameScene'});
    }

    init(data) {
    }

    preload() {
        this.load.tilemapTiledJSON('level-1', 'assets/tilemaps/level-1.json');

        this.load.spritesheet('world-1-sheet', 'assets/tileset/world-1.png', {
            frameWidth: 32,
            frameHeight: 32,
            margin: 1,
            spacing: 2
        })
        this.load.image('clouds-sheet', 'assets/tileset/clouds.png')

        this.load.spritesheet('hero-idle-sheet', 'assets/hero/idle.png', {
            frameWidth: 32,
            frameHeight: 64
        });

        this.load.spritesheet('hero-pivot-sheet', 'assets/hero/pivot.png', {
            frameWidth: 32,
            frameHeight: 64
        });

        this.load.spritesheet('hero-jump-sheet', 'assets/hero/jump.png', {
            frameWidth: 32,
            frameHeight: 64
        });

        this.load.spritesheet('hero-flip-sheet', 'assets/hero/spinjump.png', {
            frameWidth: 32,
            frameHeight: 64
        });

        this.load.spritesheet('hero-fall-sheet', 'assets/hero/fall.png', {
            frameWidth: 32,
            frameHeight: 64
        });

        this.load.spritesheet('hero-run-sheet', 'assets/hero/run.png', {
            frameWidth: 32,
            frameHeight: 64
        });

        this.load.spritesheet('hero-die-sheet', 'assets/hero/bonk.png', {
            frameWidth: 32,
            frameHeight: 64
        });
    }

    create(_) {

        this.cursorKeys = this.input.keyboard.createCursorKeys();

        this.anims.create({
            key: 'hero-running',
            frames: this.anims.generateFrameNumbers('hero-run-sheet'),
            repeat: -1
        });

        this.anims.create({
            key: 'hero-idle',
            frames: this.anims.generateFrameNumbers('hero-idle-sheet'),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'hero-pivoting',
            frames: this.anims.generateFrameNumbers('hero-pivot-sheet'),
        });

        this.anims.create({
            key: 'hero-jumping',
            frames: this.anims.generateFrameNumbers('hero-jump-sheet'),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'hero-flipping',
            frames: this.anims.generateFrameNumbers('hero-flip-sheet'),
            frameRate: 30,
            repeat: 0
        });

        this.anims.create({
            key: 'hero-falling',
            frames: this.anims.generateFrameNumbers('hero-fall-sheet'),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'hero-dead',
            frames: this.anims.generateFrameNumbers('hero-die-sheet'),
        });

        this.addMap();

        this.addHero();

        this.cameras.main.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
    }

    addHero() {
        this.hero = new Hero(this, this.spawnPos.x, this.spawnPos.y);
        this.children.moveTo(this.hero, this.children.getIndex(this.map.getLayer('Foreground').tilemapLayer));
        this.cameras.main.startFollow(this.hero);

        const groundCollider = this.physics.add.collider(this.hero, this.map.getLayer('Ground').tilemapLayer);

        const spikesCollider = this.physics.add.overlap(this.hero, this.spikeGroup, () => {
            this.hero.kill();
        });

        this.hero.on('die', () => {
            groundCollider.destroy();
            spikesCollider.destroy();
            this.hero.body.setCollideWorldBounds(false);
            this.cameras.main.stopFollow();
        });
    }

    update(time, delta) {
        const cameraBottom = this.cameras.main.getWorldPoint(0, this.cameras.main.height).y;

        if (this.hero.isDead() && this.hero.getBounds().top > cameraBottom + 100) {
            this.hero.destroy();
            this.addHero();
        }
    }

    addMap() {
        this.map = this.make.tilemap({key: 'level-1'});
        const groundTiles = this.map.addTilesetImage('world-1', 'world-1-sheet');
        const backgroundTiles = this.map.addTilesetImage('clouds', 'clouds-sheet');
        const backgroundLayer = this.map.createLayer('Background', backgroundTiles);
        backgroundLayer.setScrollFactor(0.6);

        const groundLayer = this.map.createLayer('Ground', groundTiles);
        // [1,2,4] array comes from world-1.png. these are the tiles which we want to collide with
        groundLayer.setCollision([1, 2, 4], true);

        this.physics.world.setBounds(0, 0, this.map.widthInPixels, this.map.heightInPixels);
        this.physics.world.setBoundsCollision(true, true, false, true);

        this.spikeGroup = this.physics.add.group({immovable: true, allowGravity: false});

        this.map.getObjectLayer('Objects').objects.forEach(object => {
            if (object.name === 'Start') {
                this.spawnPos = {x: object.x, y: object.y}
            }
            if (object.gid === 7) {
                const spike = this.spikeGroup.create(object.x, object.y, 'world-1-sheet', object.gid - 1);
                spike.setOrigin(0, 1);
                spike.setSize(object.width - 10, object.height - 10);
                spike.setOffset(5, 10);
            }
        });

        this.map.createLayer('Foreground', groundTiles);
        // const debugGraphics = this.add.graphics();
        // groundLayer.renderDebug(debugGraphics);
    }
}

export default Game;
