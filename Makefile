all: build

build:
	uglifyjs nacl.js -c -m -o nacl.min.js

test:
	cd tests && make test

bench:
	cd tests && make bench
