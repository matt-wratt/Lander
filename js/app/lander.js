define(['underscore', 'three', 'box2dweb', 'app/entities', 'app/input_manager', 'app/entity', 'app/engine'], function(_, THREE, Box2D, entities, input, Entity, Engine) {

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  function Lander(mode, x, y) {
    Entity.call(this);

    this.mode = mode;

    var metal = new THREE.MeshLambertMaterial({color: 0x888888, ambient: 0x333333});

    var legSplit = 0.5;

    this.registerBody('main', {
      position: new b2Vec2(x, y),
      fixtures: [{
        width: 4,
        height: 5,
        scene: {
          geometry: 'vertical-cylinder',
          material: metal,
          shadows: {
            cast: true,
            receive: false
          }
        }
      }, {
        shape: 'circle',
        density: 0,
        offset: new b2Vec2(0, -2.5),
        radius: 2,
        scene: {
          material: metal,
          shadows: {
            cast: true,
            receive: false
          }
        }
      }, {
        width: 0.3,
        height: 4,
        offset: new b2Vec2(-2.2, 4),
        angle: 0.2,
        scene: {
          split: legSplit,
          material: metal,
          z: 0.2,
          shadows: {
            cast: true,
            receive: false
          }
        }
      }, {
        width: 0.3,
        height: 4,
        offset: new b2Vec2(2.2, 4),
        angle: -0.2,
        scene: {
          split: legSplit,
          material: metal,
          z: 0.2,
          shadows: {
            cast: true,
            receive: false
          }
        }
      }]
    });

    this.registerBody('rightFoot', {
      position: new b2Vec2(x+2.6, y+5.8),
      fixture: {
        shape: 'polygon',
        points: [
          new b2Vec2(0, -0.25),
          new b2Vec2(1, 0.25),
          new b2Vec2(-0.5, 0.25)
        ],
        scene: {
          material: metal,
          split: legSplit,
          z: 0.5,
          shadows: {
            cast: true,
            receive: false
          }
        }
      }
    });

    this.registerBody('leftFoot', {
      position: new b2Vec2(x-2.6, y+5.8),
      fixture: {
        shape: 'polygon',
        points: [
          new b2Vec2(0, -0.25),
          new b2Vec2(0.5, 0.25),
          new b2Vec2(-1, 0.25)
        ],
        scene: {
          material: metal,
          split: legSplit,
          z: 0.5,
          shadows: {
            cast: true,
            receive: false
          }
        }
      }
    });

    this.registerJoint('rightFoot', {
      type: 'revolute',
      bodies: ['main', 'rightFoot'],
      anchorTarget: 'main',
      anchor: new b2Vec2(2.6, 5.8),
      limit: {
        lower: -0.7,
        upper: 0.7
      }
    });

    this.registerJoint('leftFoot', {
      type: 'revolute',
      bodies: ['main', 'leftFoot'],
      anchorTarget: 'main',
      anchor: new b2Vec2(-2.6, 5.8),
      limit: {
        lower: -0.7,
        upper: 0.7
      }
    });

    this.turboAngle = 1.2;
    this.angle90 = Math.PI / 2;

    if(this.mode === 'Multi Rocket') {
      this.engine = new Engine(this, new b2Vec2(x, y + 2.5), 800, 0, 0, 0);
      this.engineRight = new Engine(this, new b2Vec2(x - 2, y - 2), 100, -this.angle90, this.turboAngle, -this.turboAngle);
      this.engineLeft = new Engine(this, new b2Vec2(x + 2, y - 2), 100, this.angle90, this.turboAngle, -this.turboAngle);
    } else {
      this.engine = new Engine(this, new b2Vec2(x, y + 2.5), 800, 0, 0.7, -0.7);
    }
  }

  _.extend(Lander.prototype, new Entity(), {

    adding: function() {
      entities.add(this.engine);
      if(this.mode === 'Multi Rocket') {
        entities.add(this.engineRight);
        entities.add(this.engineLeft);
      }
    },

    update: function() {
      this.engine[input.actions.up ? 'on' : 'off']();
      if(this.mode === 'Multi Rocket') {
        var rightAngle = -this.angle90;
        var leftAngle = this.angle90;
        this.engineRight[input.actions.left ? 'on' : 'off']();
        this.engineLeft[input.actions.right ? 'on' : 'off']();
        if(input.actions.turbo) {
          this.engine.on();
          if(!input.actions.right) {
            leftAngle -=  this.turboAngle;
            this.engineRight.on();
          }
          if(!input.actions.left) {
            this.engineLeft.on();
            rightAngle +=  this.turboAngle;
          }
        }
        if(input.actions.down) {
          this.engineRight.on();
          this.engineLeft.on();
          if(!input.actions.right) {
            leftAngle += this.turboAngle;
          }
          if(!input.actions.left) {
            rightAngle -= this.turboAngle;
          }
        }
        this.engineRight.rotateTo(rightAngle);
        this.engineLeft.rotateTo(leftAngle);
      } else {
        var angle = 0;
        if(input.actions.left) { angle += 0.7; }
        if(input.actions.right) { angle -= 0.7; }
        this.engine.rotateTo(angle);
      }
    }
  });

  return Lander;

});
