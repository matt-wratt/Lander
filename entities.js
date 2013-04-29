var Entities = (function() {

  function Entities() {
    this.entities = [];
    this.dtRemaining = 0;
    this.stepAmount = 1 / 60;
    this.toSpawn = [];
    this.toRemove = [];
  }

  Entities.prototype = {

    step: function(dt) {
      this.dtRemaining += dt;
      while(this.dtRemaining > this.stepAmount) {
        this.dtRemaining -= this.stepAmount;
        this.update(this.stepAmount);
      }
    },

    update: function(delta) {
      this.delta = delta;
      _.each(this.toSpawn, this._add, this);
      this.toSpawn.length = 0;
      _.each(this.entities, this._update, this);
      _.each(this.toRemove, this._remove, this);
      this.toRemove.length = 0;
    },

    add: function(entity) {
      this.toSpawn.push(entity);
      entity.adding();
    },

    remove: function(entity) {
      entity.removing();
      this.toRemove.push(entity);
    },

    removeAll: function() {
      _.each(this.entities, function(entity) {
        entity.removing();
        entity.removed();
      }, this);
      this.entities.length = 0;
    },

    _update: function(entity) {
      entity.update(this.delta);
    },

    _add: function(entity) {
      this.entities.push(entity);
      entity.added();
    },

    _remove: function(entity) {
      this.entities.splice(this.entities.indexOf(entity), 1);
      entity.removed();
    }

  };

  return Entities;

}());

var Entity = (function() {

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

}());

var BodyReference = (function() {

  function BodyReference(entity, body) {
    this.entity = entity;
    this.body = body;
  }

  BodyReference.prototype = {

    resolve: function() {
      return this.entity.body[this.body];
    }

  };

  return BodyReference;

}());
