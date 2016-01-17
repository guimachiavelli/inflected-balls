(function() {
    'use strict';

    var BallWorld = require('./sandbox.js');

    var app = {
        init: function() {
            var images = [
                'test.jpg',
                'test2.jpg',
                'test3.jpg',
                'test4.png',
                'test5.jpg',
                'test6.gif',
            ];
            this.world = new BallWorld(images);
            this.world.setup();
            this.world.animate();
        }
    };

    app.init();

}());
