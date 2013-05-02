define([
  'domReady',
  'underscore',
  'three',
  'box2dweb',
  'orbit_controls',
  'dat.gui',
  'app/scale',
  'app/entities',
  'app/scene',
  'app/input_manager',
  'app/particle_system',
  'app/physics',
  'app/body',
  'app/lander'
], function(ready, _, THREE, Box2D, OrbitControls, dat, scale, entities, scene, input, particles, physics, Body, Lander) {

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  function Game() {}

  Game.prototype = {
    init: function() {
      var self = this;

      _.bindAll(this, 'animate', 'reset');

      input.bind(38, 'up');
      input.bind(39, 'right');
      input.bind(40, 'down');
      input.bind(37, 'left');
      input.bind(16, 'turbo');

      var width = innerWidth;
      var height = innerHeight;

      scene.init();

      var ambientLight = new THREE.AmbientLight( 0xffffff );
      scene.add(ambientLight);

      var light = new THREE.DirectionalLight( 0xffffff, 0.7 );
      light.castShadow = true;
      light.position.copy(scale.to3D({x: -50, y: -90}, -30));
      // light.shadowCameraVisible = true;
      light.shadowCameraLeft = -50 * scale.scale;
      light.shadowCameraRight = 50 * scale.scale;
      light.shadowCameraTop = 80 * scale.scale;
      light.shadowCameraBottom = -80 * scale.scale;
      scene.add(light);

      this.controls = {
        reset: this.reset,
        'camera fixed': false,
        mode: 'Multi Rocket',
        thrust: 800,
        'side thrust': 400,
        'motor torque': 100
      };

      this.createWorld();

      var gui = new dat.GUI();
      gui.add(this.controls, 'reset');
      gui.add(this.controls, 'camera fixed');
      gui.add(this.controls, 'mode', ['Single Rocket', 'Multi Rocket']);
      gui.add(this.controls, 'thrust', 0, 2000);
      gui.add(this.controls, 'side thrust', 0, 2000);
      gui.add(this.controls, 'motor torque', 0, 200);

      addEventListener('mousedown', function(e) {
        physics.startDrag(new b2Vec2(e.x, e.y));
      });

      addEventListener('mouseup', function(e) {
        physics.stopDrag();
      });

      addEventListener('mousemove', function(e) {
        physics.drag(new b2Vec2(e.x, e.y));
      });

      this.lastFrame = 0;
      requestAnimationFrame(this.animate);
    },

    createWorld: function() {
      var width = innerWidth / physics.scale;
      var height = innerHeight / physics.scale;
      var position = new b2Vec2(width / 2, height);
      var material = new THREE.MeshPhongMaterial({color: 0x009900, ambient: 0x003300});
      var landing = new THREE.MeshPhongMaterial({color: 0x999999, ambient: 0x333333});
      new Body({
        type: 'static',
        position: position,
        fixtures: [{
          width: width * 10,
          height: 1,
          scene: {
            material: material,
            z: 100,
            shadows: {
              cast: false,
              receive: true
            }
          }
        }, {
          width: 10,
          height: 10,
          offset: new b2Vec2(-50, -5),
          scene: {
            material: landing,
            z: 10,
            shadows: {
              cast: true,
              receive: true
            }
          }
        }, {
          shape: 'polygon',
          points: [
            new b2Vec2(-2.5, -0.5),
            new b2Vec2(-2, -5),
            new b2Vec2(-1, -8),
            new b2Vec2(0, -10),
            new b2Vec2(1, -11),
            new b2Vec2(1.4, -7),
            new b2Vec2(1.4, -3),
            new b2Vec2(1, -0.5)
          ],
          scene: {
            material: material,
            z: 5,
            shadows: {
              cast: true,
              receive: true
            }
          }
        }]
      });
      var size = 2;
      var count = 15;
      position.x = 2;
      for(var i = 0; i < count; ++i) {
        new Body({
          position: position,
          fixture:{
            width: size,
            height: size,
            offset: new b2Vec2(0, 0),
            scene: {
              material: landing,
              z: size,
              shadows: {
                cast: true,
                receive: true
              }
            }
          }
        });
        position.y -= size;
      }

      this.lander = new Lander(this.controls.mode, width / 4, height - 5);
      entities.add(this.lander);
      particles.init();
    },

    reset: function() {
      entities.removeAll();
      physics.removeAll();
      this.createWorld();
    },

    animate: function(time) {
      if(!time) time = new Date().getTime();
      requestAnimationFrame(this.animate);
      var dt = Math.min(1/15, (time - this.lastFrame) / 1000);
      entities.step(dt);
      physics.step(dt);
      this.lander.engine.engineThrust = this.controls.thrust;
      this.lander.engine.joint.main.motorTorque(this.controls['motor torque']);
      if(this.lander.mode === 'Multi Rocket') {
        this.lander.engineRight.engineThrust = this.controls['side thrust'];
        this.lander.engineLeft.engineThrust = this.controls['side thrust'];
        this.lander.engineRight.joint.main.motorTorque(this.controls['motor torque']);
        this.lander.engineLeft.joint.main.motorTorque(this.controls['motor torque']);
      }
      if(this.controls['camera fixed']) {
        scene.camera.position.copy(scale.to3D({x: 20, y: 20}, -50));
      } else {
        scene.camera.position.copy(scale.to3D(this.lander.body.main.position(), -50));
      }
      if(this.cameraControls) {
        this.cameraControls.update();
      }
      scene.render();
      this.lastFrame = time;
    }
  };

  var game = new Game();

  return game;

});
