SRC = $(wildcard ./src/*.js)
BIN = ./node_modules/.bin
BUILD = ./build

develop: ./js/src
	@$(BIN)/watch "make assets" $<

assets: browserify

browserify: ./src/main.js
	@$(BIN)/browserify $< -o $(BUILD)/bundle.js
