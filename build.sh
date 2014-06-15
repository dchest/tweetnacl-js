#!/bin/sh

node tests/test.js && uglifyjs nacl.js -c -m -o nacl.min.js

#TODO automatically run browser tests.
#TODO use some test framework.
