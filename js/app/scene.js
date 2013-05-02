define(['three', 'app/scale'], function(THREE, scale) {

  function SceneManager() {}

  SceneManager.prototype = {

    init: function() {
      var self = this;
      this.scene = new THREE.Scene();
      this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 1, 5000);
      this.camera.position.copy(scale.to3D({x: 20, y: 20}, -50));

      // this.cameraControls = new OrbitControls(this.camera);

      this.renderer = new THREE.WebGLRenderer({antialias: true, clearColor: 0x000000, clearAlpha: 1});
      this.renderer.shadowMapEnabled = true;
      this.renderer.shadowMapSoft = false;

      this.renderer.shadowCameraNear = 3;
      this.renderer.shadowCameraFar = this.camera.far;
      this.renderer.shadowCameraFov = 10;

      this.renderer.shadowMapBias = 0.0039;
      this.renderer.shadowMapDarkness = 0.5;
      this.renderer.shadowMapWidth = 1024;
      this.renderer.shadowMapHeight = 1024;
      this.renderer.setSize(window.innerWidth, window.innerHeight);

      document.body.appendChild(this.renderer.domElement);

      window.addEventListener('resize', function resize() {
        self.camera.aspect = window.innerWidth / window.innerHeight;
        self.camera.updateProjectionMatrix();
        self.renderer.setSize(window.innerWidth, window.innerHeight);
      });
    },

    render: function() {
      this.renderer.render(this.scene, this.camera);
    },

    add: function(object) {
      return this.scene.add(object);
    },

    remove: function(object) {
      return this.scene.remove(object);
    }

  };

  return new SceneManager();

});
