define(['three', 'box2dweb'], function(THREE, Box2D) {

  var b2Vec2 = Box2D.Common.Math.b2Vec2;

  var scale = 10;

  function from3D(vec) {
    return new b2Vec2(vec.x / -scale, vec.y / -scale);
  }

  function to3D(vec, z) {
    return new THREE.Vector3(vec.x * -scale, vec.y * -scale, (z || 0) * -scale);
  }

  return {
    to3D: to3D,
    from3D: from3D,
    scale: scale
  };
});
