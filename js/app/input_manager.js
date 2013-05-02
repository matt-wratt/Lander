define(['underscore'], function(_) {

  function InputManager() {
    this.bindings = {};
    this.actions = {};
    _.bindAll(this, 'onKeyDown', 'onKeyUp');
    this.logAll = false;
    addEventListener('keydown', this.onKeyDown)
    addEventListener('keyup', this.onKeyUp)
  }

  InputManager.prototype = {
    debug: function() {
      this.logAll = true;
    },

    bind: function(keyCode, action) {
      this.bindings[keyCode] = action;
      this.actions[action] = false;
    },

    onKeyDown: function(event) {
      if(this.logAll) console.log(event.keyCode, event);
      var action = this.bindings[event.keyCode];
      if(action) {
        event.preventDefault();
        this.actions[action] = true;
      }
    },

    onKeyUp: function(event) {
      var action = this.bindings[event.keyCode];
      if(action) {
        event.preventDefault();
        this.actions[action] = false;
      }
    },

    clearKeys: function() {
      for(var i in this.actions) {
        this.actions[i] = false;
      }
    }
  };


  return InputManager;

});
