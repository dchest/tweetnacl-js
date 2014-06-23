all: uglify

build:
	uglifyjs nacl.js -c -m -o nacl.min.js

test: build
	cd tests && make test

bench: build
	cd tests && make bench
