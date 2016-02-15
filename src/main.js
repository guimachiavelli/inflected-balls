(function() {
    'use strict';

    var BallWorld = require('./balls.js');

    var app = {
        init: function() {
            this.fetchTextures();
        },

        fetchTextures: function() {
            var request;

            request = new XMLHttpRequest();
            request.open('GET', './imgs.json', true);

            request.onload = this.onLoadedTextures.bind(this, request);

            request.send();
        },

        onLoadedTextures: function(request) {
            var textures;

            if (request.status !== 200) {
                return;
            }

            this.initWorld(JSON.parse(request.responseText));

        },

        initWorld: function(textures) {
            this.world = new BallWorld(textures);
            this.world.setup();
            this.world.animate();
        }
    };

    app.init();

}());
