import Phaser from 'phaser';
import StateMachine from 'javascript-state-machine';
import Bar from "./Bar";

class Hero extends Phaser.GameObjects.Sprite {

    constructor(scene, x, y) {
        super(scene, x, y, 'hero-run-sheet', 0);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.anims.play('hero-running');

        this.setOrigin(0.5, 1)
        this.body.setCollideWorldBounds(true);
        this.body.setSize(12, 40);
        this.body.setOffset(12, 23);
        this.body.setMaxVelocity(250, 400);
        this.body.setDragX(750);

        this.keys = scene.cursorKeys;
        this.myInput = {};
        this.myInput.slowMotionKey = scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);

        this.setupMovement();
        this.setupHorizontalMovement();
        this.setupAnimation();
        this.setupSlowMotionBar();

    }

    setupSlowMotionBar() {
        this.slowMotionBar = new Bar(this.scene, 0, 0);
        this.slowMotionBar.draw();
        this.slowMotionBar.bar.setScrollFactor(0, 0);
    }

    setupHorizontalMovement() {
        this.horizontalMovementState = new StateMachine({
            init: 'standing',
            transitions: [
                {name: 'goRight', from: ['standing', 'movingLeft'], to: 'movingRight'},
                {name: 'goLeft', from: ['standing', 'movingRight'], to: 'movingLeft'},
                {name: 'stop', from: ['movingLeft', 'movingRight'], to: 'standing'}
            ],
            methods: {
                onEnterState: (lifecycle) => {
                },
                onGoRight: () => {
                    this.body.setAccelerationX(1000);
                    this.setFlipX(false);
                    this.body.offset.x = 12;
                },
                onGoLeft: () => {
                    this.body.setAccelerationX(-1000);
                    this.setFlipX(true);
                    this.body.offset.x = 8;
                },
                onStop: () => {
                    this.body.setAccelerationX(0);
                }
            }
        });

        this.horizontalMovePredicates = {
            goLeft: () => {
                return !this.isDead() && this.myInput.keys.left.isDown;
            },
            goRight: () => {
                return !this.isDead() && this.myInput.keys.right.isDown;
            },
            stop: () => {
                return !this.myInput.keys.left.isDown && !this.myInput.keys.right.isDown;
            },
        }
    }

    setupAnimation() {
        this.animState = new StateMachine({
            init: 'idle',
            transitions: [
                {name: 'idle', from: ['falling', 'running', 'pivoting'], to: 'idle'},
                {name: 'run', from: ['falling', 'idle', 'pivoting'], to: 'running'},
                {name: 'pivot', from: ['falling', 'running'], to: 'pivoting'},
                {name: 'jump', from: ['idle', 'running', 'pivoting'], to: 'jumping'},
                {name: 'flip', from: ['jumping', 'falling'], to: 'flipping'},
                {name: 'fall', from: ['idle', 'running', 'pivoting', 'flipping','jumping'], to: 'falling'},
                {name: 'die', from: '*', to: 'dead'},
            ],
            methods: {
                onEnterState: (lifecycle) => {
                    const heroAnimation = 'hero-' + lifecycle.to
                    this.anims.play(heroAnimation);
                },
            }
        });

        this.animPredicates = {
            idle: () => {
                return this.body.onFloor() && this.body.velocity.x === 0;
            },
            run: () => {
                return this.body.onFloor() && Math.sign(this.body.velocity.x) === (this.flipX ? -1 : 1);
            },
            pivot: () => {
                return this.body.onFloor() && Math.sign(this.body.velocity.x) === (this.flipX ? 1 : -1);
            },
            jump: () => {
                return this.body.velocity.y < 0;
            },
            flip: () => {
                return this.body.velocity.y < 0 && this.moveState.is('flipping');
            },
            fall: () => {
                return this.body.velocity.y > 0;
            }
        }
    }

    setupMovement() {
        this.moveState = new StateMachine({
            init: 'standing',
            transitions: [
                {name: 'jump', from: 'standing', to: 'jumping'},
                {name: 'flip', from: 'jumping', to: 'flipping'},
                {name: 'fall', from: 'standing', to: 'falling'},
                {name: 'touchdown', from: ['jumping', 'flipping', 'falling'], to: 'standing'},
                {name: 'die', from: ['jumping', 'standing', 'flipping', 'falling'], to: 'dead'},
            ],
            methods: {
                onEnterState: (lifecycle) => {
                },
                onJump: () => {
                    this.body.setVelocityY(-400);
                },
                onFlip: () => {
                    this.body.setVelocityY(-300);
                },
                onDie: () => {
                    this.body.setVelocity(0, -500);
                    this.body.setAcceleration(0);
                }
            },
        });

        this.movePredicates = {
            jump: () => {
                return this.myInput.didPressJump;
            },
            flip: () => {
                return this.myInput.didPressJump;
            },
            fall: () => {
                return !this.body.onFloor();
            },
            touchdown: () => {
                return this.body.onFloor();
            },
        }
    }

    kill() {
        if (this.moveState.can('die')) {
            this.moveState.die();
            this.animState.die();
            this.emit('die');
        }
    }

    isDead() {
        return this.moveState.is('dead');
    }

    preUpdate(time, delta) {
        super.preUpdate(time, delta);

        this.myInput.didPressJump = !this.isDead() && Phaser.Input.Keyboard.JustDown(this.keys.up);
        this.myInput.didPressSlowMotionKey = Phaser.Input.Keyboard.JustDown(this.myInput.slowMotionKey);
        this.myInput.keys = this.keys;

        if (this.scene.isSlowMontionActive) {
            this.slowMotionBar.decrease(0.5);
            if (this.slowMotionBar.value <= 0) {
                this.emit('activateSlowMotion');
            }
        } else {
            this.slowMotionBar.increase(0.2);
        }

        if (this.myInput.didPressSlowMotionKey && this.slowMotionBar.value > 0) {
            this.emit('activateSlowMotion');
        }

        for (const t of this.horizontalMovementState.transitions()) {
            if (t in this.horizontalMovePredicates && this.horizontalMovePredicates[t]()) {
                this.horizontalMovementState[t]();
                break;
            }
        }

        for (const t of this.moveState.transitions()) {
            if (t in this.movePredicates && this.movePredicates[t]()) {
                this.moveState[t]();
                break;
            }
        }

        for (const t of this.animState.transitions()) {
            if (t in this.animPredicates && this.animPredicates[t]()) {
                this.animState[t]();
                break;
            }
        }
    }
}

export default Hero;
