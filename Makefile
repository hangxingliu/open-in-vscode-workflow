.PHONY: all build clean install

SRC_DIR = src
DIST_DIR = workflow/js

SRC_FILES = $(shell find $(SRC_DIR) -type f -name '*.ts')
DIST_FILES = $(patsubst $(SRC_DIR)/%.ts, $(DIST_DIR)/%.js, $(SRC_FILES))

all: build

build: $(DIST_FILES)
$(DIST_DIR)/%.js: $(SRC_DIR)/%.ts
	yarn run build

install: build
	SKIP_BUILD=1 ./scripts/install-workflow.sh

syncback:
	./scripts/sync-back.sh

clean:
	rm -rf $(DIST_DIR)
