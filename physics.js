var b2Vec2 = Box2D.Common.Math.b2Vec2;
var b2BodyDef = Box2D.Dynamics.b2BodyDef;
var b2Body = Box2D.Dynamics.b2Body;
var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
var b2Fixture = Box2D.Dynamics.b2Fixture;
var b2World = Box2D.Dynamics.b2World;
var b2MassData = Box2D.Collision.Shapes.b2MassData;
var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;
var b2DebugDraw = Box2D.Dynamics.b2DebugDraw;

var Physics = (function() {

  function Physics(scale) {
    var gravity = new b2Vec2(0, 10);
    this.world = new b2World(gravity, true);
    this.scale = scale || 20;
    this.dtRemaining = 0;
    this.stepAmount = 1 / 60;
    this.collisionGroups = {all: 0xffff, none: 0x0000};
  }

  Physics.prototype = {

    step: function(dt) {
      this.dtRemaining += dt;
      while(this.dtRemaining > this.stepAmount) {
        this.dtRemaining -= this.stepAmount;
        this.world.Step(this.stepAmount, 10, 10);
      }
      this.world.ClearForces();
      this.eachBody(function(body) {
        body.updateObjectPosition();
      });
      if(this.debugDraw) {
        this.world.DrawDebugData();
      }
    },

    eachBody: function(func, context) {
      context = context || window;
      var body = this.world.GetBodyList();
      while(body) {
        var userData = body.GetUserData();
        if(userData instanceof Body) {
          func.call(context, body.GetUserData());
        }
        body = body.GetNext();
      }
    },

    debug: function(element) {
      this.debugDraw = new b2DebugDraw();
      this.debugDraw.SetSprite(element.getContext('2d'));
      this.debugDraw.SetDrawScale(this.scale);
      this.debugDraw.SetFillAlpha(0.3);
      this.debugDraw.SetLineThickness(1.0);
      this.debugDraw.SetFlags(b2DebugDraw.e_shapeBit | b2DebugDraw.e_jointBit);
      this.world.SetDebugDraw(this.debugDraw);
    },

    add: function(bodyDef, fixtures) {
      var body = this.world.CreateBody(bodyDef);
      _.each(fixtures, function(fixture) {
        body.CreateFixture(fixture);
      }, this);
      return body;
    },

    remove: function(body) {
      this.world.DestroyBody(body);
    },

    addJoint: function(jointDef) {
      return Game.physics.world.CreateJoint(jointDef);
    },

    removeJoint: function(joint) {
      this.world.DestroyJoint(joint);
    },

    removeAll: function() {
      this.eachBody(function(body) {
        body.remove();
      });
      var body = this.world.GetBodyList();
      while(body) {
        this.remove(body);
        body = body.GetNext();
      }
      var joint = this.world.GetJointList();
      while(joint) {
        this.removeJoint(joint);
        joint = joint.GetNext();
      }
    },

    collisionGroup: function(name) {
      if(!this.collisionGroups[name]) {
        var shift = _.keys(this.collisionGroups).length - 2;
        this.collisionGroups[name] = 0x0001 << shift;
      }
      return this.collisionGroups[name];
    },

    toWorld: function(point) {
      point.Multiply(1/this.scale);
      return point;
    },

    startDrag: function(point) {
      var self = this;
      point = this.toWorld(point);
      this.world.QueryPoint(function (fixture) {
        var jointDefinition = new Box2D.Dynamics.Joints.b2MouseJointDef();
        jointDefinition.bodyA = self.world.GetGroundBody();
        jointDefinition.bodyB = fixture.GetBody();
        jointDefinition.target.SetV(point);
        jointDefinition.maxForce = 100000;
        jointDefinition.timeStep = self.stepAmount;
        self.joint = self.world.CreateJoint(jointDefinition);
      }, point);
    },

    drag: function(point) {
      if(this.joint) {
        point = this.toWorld(point);
        this.joint.SetTarget(point);
      }
    },

    stopDrag: function() {
      if(this.joint) {
        this.world.DestroyJoint(this.joint);
        delete this.joint;
      }
    }

  };

  return Physics;

}());

var Body = (function() {

  var defaults = {
    position: new b2Vec2(0, 0),
    type: 'dynamic',
    active: true,
    allowSleep: true,
    angle: 0,
    angularVelocity: 0,
    awake: true,
    bullet: false,
    fixedRotation: false,
    fixtures: [{}]
  };

  var fixtureDefaults = {
    shape: "block",
    offset: new b2Vec2(0, 0),
    angle: 0,
    width: 5,
    height: 5,
    radius: 2.5,
    density: 2,
    friction: 1,
    restitution: 0.2
  };

  var bodyDef = new b2BodyDef();

  function Body(options) {
    options = _.extend({}, defaults, options);

    var bodyDefOptions = _.pick(options, 'active', 'allowSleep', 'angle', 'angularVelocity',
                                'awake', 'bullet', 'fixedRotation', 'position');
    _.extend(bodyDef, bodyDefOptions);
    bodyDef.userData = this;
    bodyDef.type = options.type === 'static' ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;

    this.object = new THREE.Object3D();
    this.object.position.copy(to3D(options.position));

    if(options.fixture) {
      options.fixtures = [options.fixture];
    }
    var fixtures = _.map(options.fixtures, function(fixture) {
      fixture = _.extend({}, fixtureDefaults, fixture);
      var fixtureDef = new b2FixtureDef();
      var fixtureOptions = _.pick(fixture, 'density', 'friction', 'restitution');
      _.extend(fixtureDef, fixtureOptions);
      if(fixture.group) {
        fixture.groups = [fixture.group];
      }
      if(fixture.groups) {
        fixtureDef.filter.categoryBits = 0x0000;
        _.each(fixture.groups, function(group) {
          fixtureDef.filter.categoryBits |= Game.physics.collisionGroup(group);
        }, this);
      }
      if(fixture.collidesWith) {
        fixtureDef.filter.maskBits = 0x0000;
        _.each(fixture.collidesWith, function(group) {
          fixtureDef.filter.maskBits |= Game.physics.collisionGroup(group);
        }, this);
      }

      switch(fixture.shape) {
        case 'circle':
          fixtureDef.shape = new b2CircleShape(fixture.radius);
          fixtureDef.shape.SetLocalPosition(fixture.offset);
          break;
        case 'polygon':
          fixtureDef.shape = new b2PolygonShape();
          fixtureDef.shape.SetAsArray(fixture.points, fixture.points.length);
          break;
        default: // block
          fixtureDef.shape = new b2PolygonShape();
          fixtureDef.shape.SetAsOrientedBox(fixture.width / 2, fixture.height / 2, fixture.offset, fixture.angle);
          break;
      }

      if(fixture.scene) {
        new SceneFixture(this, fixture, this.object);
      }

      return fixtureDef;
    }, this);

    this.body = Game.physics.add(bodyDef, fixtures);
    Game.scene.add(this.object);
  }

  Body.prototype = {

    angle: function(angle) {
      if(angle !== undefined) {
        this.body.SetAngle(angle);
      }
      return this.body.GetAngle();
    },

    updateObjectPosition: function() {
      var position = this.position();
      var angle = this.angle();
      this.object.position.copy(to3D(position));
      this.object.rotation.z = angle;
    },

    position: function(position) {
      if(position !== undefined) {
        this.body.SetPosition(position);
      }
      return this.body.GetPosition();
    },

    velocity: function(velocity) {
      if(velocity !== undefined) {
        this.body.SetLinearVelocity(velocity);
      }
      return this.body.GetLinearVelocity();
    },

    worldPoint: function(point) {
      return this.body.GetWorldPoint(point);
    },

    force: function(force, point) {
      this.body.ApplyForce(force, point);
    },

    impulse: function(impulse, point) {
      this.body.ApplyImpulse(impulse, point || this.body.GetPosition());
    },

    remove: function() {
      Game.physics.remove(this.body);
      Game.scene.remove(this.object);
    }

  };

  return Body;

}());

var Joint = (function() {

  var defaultOptions = {
    type: 'revolute'
  };

  function Joint(options) {
    options = _.extend({}, defaultOptions, options);
    var def;
    switch(options.type) {
      case 'revolute':
        def = new Box2D.Dynamics.Joints.b2RevoluteJointDef();
        break;
    }
    if(options.limit) {
      def.enableLimit = true;
      def.upperAngle = options.limit.upper;
      def.lowerAngle = options.limit.lower;
    }
    if(options.motor) {
      def.enableMotor = true;
      def.motorSpeed = options.motor.speed;
      def.maxMotorTorque = options.motor.torque;
    }
    def.Initialize(
      options.bodies[0].body,
      options.bodies[1].body,
      options.anchor
    );
    this.joint = Game.physics.addJoint(def);
  }

  Joint.prototype = {

    motorTorque: function(torque) {
      if(torque !== undefined) {
        this.joint.SetMaxMotorTorque(torque);
      }
      return this.joint.GetMotorTorque();
    },

    motorSpeed: function(speed) {
      if(speed !== undefined) {
        this.joint.SetMotorSpeed(speed);
      }
      return this.joint.GetMotorSpeed;
    },

    angle: function() {
      return this.joint.GetJointAngle();
    },

    remove: function() {
      Game.physics.remove(this.joint);
    }

  };

  return Joint;

}());

var SceneFixture = (function() {

  var scale = 10;

  window.from3D = function(vec) {
    return new b2Vec2(vec.x / -scale, vec.y / -scale);
  };

  window.to3D = function(vec, z) {
    return new THREE.Vector3(vec.x * -scale, vec.y * -scale, (z || 0) * -scale);
  };

  to3D.scale = scale;

  function SceneFixture(owner, fixture, object) {
    var geometry;
    var offsetZ = 0;
    switch(fixture.shape) {
      case 'circle':
        geometry = new THREE.SphereGeometry(fixture.radius * scale);
        break;
      case 'polygon':
        var vector = to3D(fixture.points[0]);
        var path = new THREE.Path();
        path.moveTo(vector.x, vector.y);
        for(var i = 1; i < fixture.points.length; ++i) {
          vector = to3D(fixture.points[i]);
          path.lineTo(vector.x, vector.y);
        }
        vector = to3D(fixture.points[0]);
        path.lineTo(vector.x, vector.y);
        geometry = new THREE.ExtrudeGeometry(path.toShapes(), { amount: fixture.scene.z * scale, bevelEnabled: false});
        offsetZ = fixture.scene.z / 2;
        break;
      default: // block
        switch(fixture.scene.geometry || 'cube') {
          case 'vertical-cylinder':
            var radius = fixture.width * scale * 0.5;
            geometry = new THREE.CylinderGeometry(radius, radius, fixture.height * scale);
            break;
          default:
            geometry = new THREE.CubeGeometry(fixture.width * scale, fixture.height * scale, fixture.scene.z * scale);
            break;
        }
       break;
    }
    this.mesh = new THREE.Mesh(geometry, fixture.scene.material);
    this.mesh.position.copy(to3D(fixture.offset, offsetZ));
    this.mesh.rotation.z = fixture.angle;
    if(fixture.scene.shadows) {
      this.mesh.castShadow = fixture.scene.shadows.cast;
      this.mesh.receiveShadow = fixture.scene.shadows.receive;
    }
    object.add(this.mesh);
    if(fixture.scene.split) {
      this.mesh.position.z = (fixture.scene.split - offsetZ) * to3D.scale;
      this.mesh = this.mesh.clone();
      this.mesh.position.z = -(fixture.scene.split + offsetZ) * to3D.scale;
      object.add(this.mesh);
    }
  }

  SceneFixture.prototype = {
  };

  return SceneFixture;

}());
