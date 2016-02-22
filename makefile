DEPLOY_TARGET = `cat target.txt`
SRC = $(wildcard ./src/*.js)
BIN = ./node_modules/.bin
BUILD = ./public

develop: ./src
	@$(BIN)/watch "make assets" $<

assets: browserify

browserify: ./src/main.js
	@$(BIN)/browserify $< -o $(BUILD)/bundle.js

deploy:
	rsync --verbose --progress -r public/* $(DEPLOY_TARGET)
