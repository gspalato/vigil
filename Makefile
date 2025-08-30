PROTO_DIR=shared/proto
NODE_MODULES_DIR=/usr/lib/node_modules
SERVICES_DIR=./services

# All TS projects that need generation
PY_PROJECTS=analytics
TS_PROJECTS=digest gateway viz

.PHONY: all proto-ts proto-py

all: proto-ts proto-py

proto-ts:
	@for project in $(TS_PROJECTS); do \
		echo "Generating TS for $$project..."; \
		mkdir -p $(SERVICES_DIR)/$$project/src/generated; \
		npx protoc \
			--plugin=$(NODE_MODULES_DIR)/ts-proto/protoc-gen-ts_proto \
			--ts_proto_out=$(SERVICES_DIR)/$$project/src/generated \
			$(PROTO_DIR)/*.proto; \
	done

proto-py:
	@for project in $(PY_PROJECTS); do \
		echo "Generating Python for $$project..."; \
		mkdir -p $(SERVICES_DIR)/$$project/src/generated; \
		python -m grpc_tools.protoc \
			-I=$(PROTO_DIR) \
			--python_out=$(SERVICES_DIR)/$$project/src/generated \
			--grpc_python_out=$(SERVICES_DIR)/$$project/src/generated \
			$(PROTO_DIR)/*.proto; \
	done
