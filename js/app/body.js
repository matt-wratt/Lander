define(['underscore', 'three', 'box2dweb', 'app/game', 'app/physics', 'app/scale', 'app/scene_fixture'], function(_, THREE, Box2D, Game, physics, scale, SceneFixture) {

  var b2Vec2 = Box2D.Common.Math.b2Vec2;
  var b2BodyDef = Box2D.Dynamics.b2BodyDef;
  var b2Body = Box2D.Dynamics.b2Body;
  var b2FixtureDef = Box2D.Dynamics.b2FixtureDef;
  var b2Fixture = Box2D.Dynamics.b2Fixture;
  var b2PolygonShape = Box2D.Collision.Shapes.b2PolygonShape;
  var b2CircleShape = Box2D.Collision.Shapes.b2CircleShape;

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
    if(!Game) Game = require('app/game');
    options = _.extend({}, defaults, options);

    var bodyDefOptions = _.pick(options, 'active', 'allowSleep', 'angle', 'angularVelocity',
                                'awake', 'bullet', 'fixedRotation', 'position');
    _.extend(bodyDef, bodyDefOptions);
    bodyDef.userData = this;
    bodyDef.type = options.type === 'static' ? b2Body.b2_staticBody : b2Body.b2_dynamicBody;

    this.object = new THREE.Object3D();
    this.object.position.copy(scale.to3D(options.position));

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
          fixtureDef.filter.categoryBits |= physics.collisionGroup(group);
        }, this);
      }
      if(fixture.collidesWith) {
        fixtureDef.filter.maskBits = 0x0000;
        _.each(fixture.collidesWith, function(group) {
          fixtureDef.filter.maskBits |= physics.collisionGroup(group);
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

    this.body = physics.add(bodyDef, fixtures);
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
      this.object.position.copy(scale.to3D(position));
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
      physics.remove(this.body);
      Game.scene.remove(this.object);
    }

  };

  return Body;

});
