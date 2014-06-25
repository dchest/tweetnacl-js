all: build

build:
	uglifyjs nacl.js -c -m -o nacl.min.js
	uglifyjs nacl-fast.js -c -m -o nacl-fast.min.js

test: test_normal test_fast

bench: bench_normal bench_fast

test_normal:
	cd tests && make test

test_fast:
	export FAST=1 && cd tests && make test

bench_normal:
	cd tests && make bench

bench_fast:
	export FAST=1 && cd tests && make bench
