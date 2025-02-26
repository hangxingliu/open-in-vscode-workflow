.PHONY: all build clean install

SRC_DIR = src
DIST_DIR = workflow/js

SRC_FILES   = $(shell find $(SRC_DIR) -type f -name '*.ts')
# _DIST_FILES = $(patsubst %.ts, %.js, $(SRC_FILES))
# DIST_FILES  = $(subst $(SRC_DIR), $(DIST_DIR), $(_DIST_FILES))
# $(info DEBUG= $(DIST_FILES))

all: build

build: $(DIST_DIR)/tsconfig.tsbuildinfo
$(DIST_DIR)/tsconfig.tsbuildinfo: $(SRC_FILES)
	yarn run build

install: build
	SKIP_BUILD=1 ./scripts/install-workflow.sh

syncback:
	./scripts/sync-back.sh

clean:
	rm -rf $(DIST_DIR)
