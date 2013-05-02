requirejs.config({
  baseUrl: 'js/libs',
  paths: {
    app: '../app'
  }
});

require(['domReady', 'app/game'], function(ready, Game) {
  ready(function() {
    Game.init();
  });
});
