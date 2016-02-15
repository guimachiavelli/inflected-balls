(function() {
    'use strict';

    var BallWorld = require('./balls.js');

    var app = {
        loader: null,
        init: function() {
            this.showLoadingMessage();
            this.fetchTextures();
        },

        showLoadingMessage: function() {
            this.loader = document.createElement('div');
            this.loader.innerHTML = 'Loading…';
            document.body.appendChild(this.loader);
        },

        removeLoadingMessage: function() {
            document.body.removeChild(this.loader);
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

            this.removeLoadingMessage();
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
