CFLAGS=-O3

all: csecretbox cscalarmult cbox chash csign

csecretbox: csecretbox.o tweetnacl.o

cscalarmult: cscalarmult.o tweetnacl.o

cbox: cbox.o tweetnacl.o

chash: chash.o tweetnacl.o

csign: csign.o tweetnacl.o

test: test_secretbox

#test_scalarmult test_box test_hash test_sign clean

test_secretbox: csecretbox
	tap --timeout 1800 ./secretbox.js

test_scalarmult: cscalarmult
	node ./scalarmult.js

test_box: cbox
	node ./box.js

test_hash: chash
	node ./hash.js

test_sign: csign
	node ./sign.js

clean:
	rm *.o csecretbox cscalarmult cbox chash csign
