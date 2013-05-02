define(function() {

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

});
