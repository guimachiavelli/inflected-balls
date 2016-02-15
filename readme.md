# Inflected objects – Mise en Séance

Micro-site for the second Inflected Objects exhibition, Mise en Séance.

Heavily inspired by [Three.js's sandbox example](http://threejs.org/examples/#webgl_sandbox).

## Setup
1. `npm install`
2. launch some type of server and point it to the build directory.

## Tools
* `resize.sh`: quick script to resize the 4mb+ images originally provided
* `json-from-images.rb`: creates an array with all the images in build/imgs and saves it to a json file (that is later loaded via javascript to create all the sphere textures).

## Dependencies
* Node
* Three.js
* Browserify
* NPM watch
* Imagemagick (to use resize.sh)
