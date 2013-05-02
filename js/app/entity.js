define(['underscore', 'app/body_reference', 'app/body', 'app/joint'], function(_, BodyReference, Body, Joint) {

  function Entity() { }

  Entity.prototype = {

    update: function() {},
    adding: function() {},
    removing: function() {},

    added: function() {
      if(this.bodyDef) {
        this.body = {};
        for(var i in this.bodyDef) {
          this.body[i] = new Body(this.bodyDef[i]);
        }
      }
      if(this.jointDef) {
        this.joint = {};
        for(i in this.jointDef) {
          var def = this.jointDef[i];
          def = _.extend({}, this.jointDef[i], {
            bodies: [def.bodies[0].resolve(), def.bodies[1].resolve()],
            anchor: this.body[def.anchorTarget].worldPoint(def.anchor)
          });
          this.joint[i] = new Joint(def);
        }
      }
    },

    removed: function() {
      if(this.body) {
        for(var i in this.body) {
          this.body[i].remove();
        }
      }
      if(this.joint) {
        for(var i in this.joint) {
          this.joint[i].remove();
        }
      }
    },

    registerBody: function(name, bodyDef) {
      this.bodyDef = this.bodyDef || {};
      this.bodyDef[name] = bodyDef;
    },

    registerJoint: function(name, jointDef) {
      this.jointDef = this.jointDef || {};
      for(var i in jointDef.bodies) {
        if(_.isString(jointDef.bodies[i])) {
          jointDef.bodies[i] = new BodyReference(this, jointDef.bodies[i]);
        }
      }
      this.jointDef[name] = jointDef;
    }

  };

  return Entity;

});
