all: uglify

uglify:
	uglifyjs nacl.js -c -m -o nacl.min.js

test:
	node tests/test.js
	cd tests && make test

bench:
	BENCHMARK=1 node tests/test.js
