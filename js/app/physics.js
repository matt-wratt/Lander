define(['underscore', 'box2dweb', 'app/body'], function(_, Box2D, Game, Body) {

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
      if(!Body) Body = require('app/body');
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
      return this.world.CreateJoint(jointDef);
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

  return new Physics();
});
