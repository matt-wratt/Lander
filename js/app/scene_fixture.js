define(['three', 'app/scale'], function(THREE, scale) {

  function SceneFixture(owner, fixture, object) {
    var geometry;
    var offsetZ = 0;
    switch(fixture.shape) {
      case 'circle':
        geometry = new THREE.SphereGeometry(fixture.radius * scale.scale);
        break;
      case 'polygon':
        var vector = scale.to3D(fixture.points[0]);
        var path = new THREE.Path();
        path.moveTo(vector.x, vector.y);
        for(var i = 1; i < fixture.points.length; ++i) {
          vector = scale.to3D(fixture.points[i]);
          path.lineTo(vector.x, vector.y);
        }
        vector = scale.to3D(fixture.points[0]);
        path.lineTo(vector.x, vector.y);
        geometry = new THREE.ExtrudeGeometry(path.toShapes(), { amount: fixture.scene.z * scale.scale, bevelEnabled: false});
        offsetZ = fixture.scene.z / 2;
        break;
      default: // block
        switch(fixture.scene.geometry || 'cube') {
          case 'vertical-cylinder':
            var radius = fixture.width * scale.scale * 0.5;
            geometry = new THREE.CylinderGeometry(radius, radius, fixture.height * scale.scale);
            break;
          default:
            geometry = new THREE.CubeGeometry(fixture.width * scale.scale, fixture.height * scale.scale, fixture.scene.z * scale.scale);
            break;
        }
      break;
    }
    this.mesh = new THREE.Mesh(geometry, fixture.scene.material);
    this.mesh.position.copy(scale.to3D(fixture.offset, offsetZ));
    this.mesh.rotation.z = fixture.angle;
    if(fixture.scene.shadows) {
      this.mesh.castShadow = fixture.scene.shadows.cast;
      this.mesh.receiveShadow = fixture.scene.shadows.receive;
    }
    object.add(this.mesh);
    if(fixture.scene.split) {
      this.mesh.position.z = (fixture.scene.split - offsetZ) * scale.scale;
      this.mesh = this.mesh.clone();
      this.mesh.position.z = -(fixture.scene.split + offsetZ) * scale.scale;
      object.add(this.mesh);
    }
  }

  SceneFixture.prototype = {
  };

  return SceneFixture;

});
