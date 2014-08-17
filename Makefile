
index.html: src/*
	@node src/build.js

db:
	@node --harmony src/make-db.js

.PHONY: db
