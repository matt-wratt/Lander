define(['underscore'], function(_) {

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

});
