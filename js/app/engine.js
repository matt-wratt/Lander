define(['underscore', 'three', 'box2dweb', 'app/game', 'app/particle_system', 'app/entity', 'app/body_reference', 'app/scale'], function(_, THREE, Box2D, Game, particles, Entity, BodyReference, scale) {

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  function Engine(owner, offset, thrust, angle, upperLimit, lowerLimit) {
    Entity.call(this);

    if(!Game) Game = require('app/game');

    this.owner = owner;
    this.offset = offset;
    this.engineThrust = thrust;
    this.firing = false;

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
        lower: angle + lowerLimit,
        upper: angle + upperLimit
      },
      motor: {
        speed: 0,
        torque: 10
      }
    });
    this.angle = angle || 0;

    this.light = new THREE.PointLight(0xdd380c, 5, 10 * scale.scale);
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
      thrustVector = scale.to3D(thrustVector);
      thrustVector.multiplyScalar(-0.7 / this.engineThrust);
      var v = scale.to3D(this.body.main.velocity());
      v.multiplyScalar(0.2 / scale.scale);
      thrustVector.add(v);
      thrustPoint = this.body.main.worldPoint(new b2Vec2(0, 1));
      thrustPoint = scale.to3D(thrustPoint);
      particles.cone(thrustPoint, thrustVector, new THREE.Color(0xdd380c), this.engineThrust / 10);
      this.light.intensity = 5;
      this.light.position.copy(thrustPoint);
  }

  });

  return Engine;

});
