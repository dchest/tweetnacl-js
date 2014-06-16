CFLAGS=-O3

all: chash csign

csign: csign.o tweetnacl.o

chash: chash.o tweetnacl.o

test: csign
	node ./sign.js

test_hash: chash
	node ./hash.js

clean:
	rm *.o csign chash
