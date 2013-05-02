define(['box2dweb', 'app/game'], function(Box2D, Game) {

  var defaultOptions = {
    type: 'revolute'
  };

  function Joint(options) {
    if(!Game) Game = require('app/game');
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

});
