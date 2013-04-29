var Lander = (function() {
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

    if(this.mode === 'Multi Rocket') {
      this.engine = new Engine(this, new b2Vec2(x, y + 2.5), 800, 0, 0);
      this.engineRight = new Engine(this, new b2Vec2(x - 2, y - 2), 100, -Math.PI / 2, 0);
      this.engineLeft = new Engine(this, new b2Vec2(x + 2, y - 2), 100, Math.PI / 2, 0);
    } else {
      this.engine = new Engine(this, new b2Vec2(x, y + 2.5), 800, 0, 0.7);
    }
  }

  _.extend(Lander.prototype, new Entity(), {

    adding: function() {
      Game.entities.add(this.engine);
      if(this.mode === 'Multi Rocket') {
        Game.entities.add(this.engineRight);
        Game.entities.add(this.engineLeft);
      }
    },

    update: function() {
      this.engine[Game.input.actions.up ? 'on' : 'off']();
      if(this.mode === 'Multi Rocket') {
        this.engineRight[Game.input.actions.left ? 'on' : 'off']();
        this.engineLeft[Game.input.actions.right ? 'on' : 'off']();
      } else {
        var angle = 0;
        if(Game.input.actions.left) { angle += 0.7; }
        if(Game.input.actions.right) { angle -= 0.7; }
        this.engine.rotateTo(angle);
      }
    }
  });

  return Lander;
}());

var Engine = (function() {

  function Engine(owner, offset, thrust, angle, limit) {
    Entity.call(this);

    this.owner = owner;
    this.offset = offset;
    this.engineThrust = thrust;
    this.firing = false;

    limit = limit !== undefined ? limit : 0.7;

    var metal = new THREE.MeshLambertMaterial({color: 0x555555, ambient: 0x222222});

    this.registerBody('main', {
      position: offset,
      fixtures: [{
        width: 1,
        height: 1,
        scene: {
          material: metal,
          z: 0.8
        }
      }, {
        shape: 'polygon',
        points: [
          new b2Vec2(0, 0),
          new b2Vec2(0.2, 1),
          new b2Vec2(-0.2, 1)
        ],
        scene: {
          material: metal,
          z: 0.5,
          shadows: {
            cast: true,
            receive: false
          }
        }
      }]
    });

    this.registerJoint('main', {
      type: 'revolute',
      bodies: ['main', new BodyReference(owner, 'main')],
      anchorTarget: 'main',
      anchor: new b2Vec2(0, 0),
      limit: {
        lower: angle - limit,
        upper: angle + limit
      },
      motor: {
        speed: 0,
        torque: 10
      }
    });
    this.angle = angle || 0;

    this.light = new THREE.PointLight(0xdd380c, 5, 10 * to3D.scale);
    this.light.position.set(0, 0, 0);
    Game.scene.add(this.light);
  }

  _.extend(Engine.prototype, new Entity(), {

    removing: function() {
      Game.scene.remove(this.light);
    },

    rotateTo: function(angle) {
      this.angle = angle;
    },

    on: function() {
      this.firing = true;
    },

    off: function() {
      this.firing = false;
    },

    update: function() {
      if(this.firing) {
        this.thrust();
      } else {
        this.light.intensity = 0;
      }
      var angle = this.joint.main.angle();
      this.joint.main.motorSpeed(10 * (this.angle - angle));
    },

    thrust: function() {
      var thrustPoint = this.body.main.worldPoint(new b2Vec2(0, 0));
      var angle = this.body.main.angle() - Math.PI / 2;
      var thrustVector = new b2Vec2(
        this.engineThrust * Math.cos(angle),
        this.engineThrust * Math.sin(angle)
      );
      this.body.main.force(thrustVector, thrustPoint);
      thrustVector = to3D(thrustVector);
      thrustVector.multiplyScalar(-0.7 / this.engineThrust);
      var v = to3D(this.body.main.velocity());
      v.multiplyScalar(0.2 / to3D.scale);
      thrustVector.add(v);
      thrustPoint = this.body.main.worldPoint(new b2Vec2(0, 2));
      thrustPoint = to3D(thrustPoint);
      Game.particles.cone(thrustPoint, thrustVector, new THREE.Color(0xdd380c), 50);
      this.light.intensity = 5;
      this.light.position.copy(thrustPoint);
   }

  });

  return Engine;

}());
