CFLAGS=-O3

all: csecretbox cscalarmult cbox chash csign

csecretbox: csecretbox.o tweetnacl.o

cscalarmult: cscalarmult.o tweetnacl.o

cbox: cbox.o tweetnacl.o

chash: chash.o tweetnacl.o

csign: csign.o tweetnacl.o

test: simpletest test_secretbox test_scalarmult test_box test_hash test_sign test_signinput clean

simpletest:
	node ./test.js

test_secretbox: csecretbox
	node ./secretbox.js

test_scalarmult: cscalarmult
	node ./scalarmult.js

test_box: cbox
	node ./box.js

test_hash: chash
	node ./hash.js

test_sign: csign
	node ./sign.js

test_signinput:
	node ./sign.input.js

clean:
	rm *.o csecretbox cscalarmult cbox chash csign

bench:
	node ./bench.js
