define(['underscore', 'three', 'app/scene', 'app/entities', 'app/entity'], function(_, THREE, scene, entities, Entity) {

  var vShader = [
      'attribute float size;',
      'attribute vec3 ccolor;',
      'varying vec3 vColor;',
      'void main() {',
        'vColor = ccolor;',
        'vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );',
        'gl_PointSize = size;',
        'gl_Position = projectionMatrix * mvPosition;',
      '}'
  ].join('\n');

  var fShader = [
      'uniform vec3 color;',
      'uniform sampler2D texture;',
      'varying vec3 vColor;',
      'void main() {',
        'gl_FragColor = vec4( color * vColor, 1.0 );',
        'gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );',
      '}'
  ].join('\n');

  var particles = 5000;

  function ParticleSystem() { }

  _.extend(ParticleSystem.prototype, new Entity(), {
    init: function() {
      this.motion = [];
      this.decay = [];
      var attributes = {
        start: {type: 'l', value: []},
        size: {type: 'f', value: []},
        ccolor: {type: 'c', value: []}
      };
      var uniforms = {
        color: {type: 'c', value: new THREE.Color(0xffffff)},
        texture: {type: "t", value: THREE.ImageUtils.loadTexture("particle.png")},
      };

      this.geometry = new THREE.Geometry();
      for ( var i = 0; i < particles; ++i ) {
        attributes.size.value.push(0.0);
        attributes.ccolor.value.push(new THREE.Color(0xff0000));
        this.geometry.vertices.push(new THREE.Vector3(99999999999999, 99999999999999, 0));
        this.motion.push(new THREE.Vector3());
      }

      var shaderMaterial = new THREE.ShaderMaterial( {
        uniforms:     uniforms,
        attributes:     attributes,
        vertexShader:   vShader,
        fragmentShader: fShader,
        blending:     THREE.AdditiveBlending,
        depthTest:    true,
        transparent:  true
      });

      this.nextParticle = 0;

      particleSystem = new THREE.ParticleSystem( this.geometry, shaderMaterial );
      particleSystem.dynamic = true;
      this.system = particleSystem;
      scene.add(this.system);
      entities.add(this);
    },

    removing: function() {
      Entity.prototype.removing.call(this);
      scene.remove(this.system);
    },

    update: function() {
      var x, y;
      var positions = this.geometry.vertices;
      var size = this.system.material.attributes.size;
      for(var i = 0; i < positions.length; ++i) {
        positions[i].x += this.motion[i].x;
        positions[i].y += this.motion[i].y;
        positions[i].z += this.motion[i].z;
        size.value[i] = Math.max(0, size.value[i] - this.decay[i]);
      }
      size.needsUpdate = true;
      this.geometry.verticesNeedUpdate = true;
    },

    explode: function(position, color, count) {
      color = color || new THREE.Color(0xff0000);
      count = count || 100;
      var positions = this.geometry.vertices;
      var motions = this.motion;
      var colors = this.system.material.attributes.ccolor.value;
      var start = this.nextParticle;
      var end = (this.nextParticle + Math.floor(count)) % positions.length;
      this.nextParticle = end;
      for(var i = start; i != end; i = (i + 1) % positions.length) {
        positions[i].x = position.x;
        positions[i].y = position.y;
        var a = Math.random() * 2 * Math.PI;
        var s = Math.random() * 10;
        motions[i].x = s * Math.cos(a);
        motions[i].y = s * Math.sin(a);
        this.system.material.attributes.ccolor.value[i].copy(color);
        this.system.material.attributes.size.value[i] = 30.0;
        this.decay[i] = Math.max(0.2, s * Math.random());
      }
      this.system.material.attributes.ccolor.needsUpdate = true;
    },

    cone: function(position, direction, color, count) {
      color = color || new THREE.Color(0xff0000);
      count = count || 100;
      var positions = this.geometry.vertices;
      var motions = this.motion;
      var colors = this.system.material.attributes.ccolor.value;
      var start = this.nextParticle;
      var end = (this.nextParticle + Math.floor(count)) % positions.length;
      this.nextParticle = end;
      for(var i = start; i != end; i = (i + 1) % positions.length) {
        positions[i].copy(position);
        motions[i].copy(direction);
        motions[i].x += (Math.random() - 0.5) * 1;
        motions[i].y += (Math.random() - 0.5) * 1;
        this.system.material.attributes.ccolor.value[i].copy(color);
        this.system.material.attributes.size.value[i] = 30.0;
        this.decay[i] = Math.max(0.2, 50 * Math.random());
      }
      this.system.material.attributes.ccolor.needsUpdate = true;
    }

  });

  return new ParticleSystem();

});
