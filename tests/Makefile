CFLAGS=-O3

all: cscalarmult cbox csecretbox

cscalarmult: cscalarmult.o tweetnacl.o

cbox: cbox.o tweetnacl.o

csecretbox: csecretbox.o tweetnacl.o

test_scalarmult: cscalarmult
	node ./scalarmult.js

test_box: cbox
	node ./box.js

test_secretbox: csecretbox
	node ./secretbox.js

test: test_secretbox test_box test_scalarmult

clean:
	rm *.o cscalarmult cbox csecretbox
