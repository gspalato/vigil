### Protobuf Generation
PROTO_DIR=shared/proto
NODE_MODULES_DIR=/usr/lib/node_modules
SERVICES_DIR=./services

# All TS projects that need generation
PY_PROJECTS=analytics
TS_PROJECTS=digest gateway

.PHONY: all proto-ts proto-py

all: proto-ts proto-py

proto-ts:
	@for project in $(TS_PROJECTS); do \
		echo "Generating TS for $$project..."; \
		mkdir -p $(SERVICES_DIR)/$$project/src/generated; \
		npx protoc \
			-I=$(PROTO_DIR) \
			--plugin=$(NODE_MODULES_DIR)/ts-proto/protoc-gen-ts_proto \
			--ts_proto_out=$(SERVICES_DIR)/$$project/src/generated \
			$(PROTO_DIR)/*.proto; \
	done

# This script is using a venv installed grpc-tools so the versions are compatible.
proto-py:
	@for project in $(PY_PROJECTS); do \
		echo "Generating Python for $$project..."; \
		mkdir -p $(SERVICES_DIR)/$$project/src/generated; \
		if ! [ -e "$(SERVICES_DIR)/$$project/src/generated/__init__.py" ] ; then touch "$(SERVICES_DIR)/$$project/src/generated/__init__.py"; fi; \
		tools/python-proto-codegen/venv/bin/python -m grpc_tools.protoc \
			-I=$(PROTO_DIR) \
			--python_out=$(SERVICES_DIR)/$$project/src/generated \
			--grpc_python_out=$(SERVICES_DIR)/$$project/src/generated \
			--pyi_out=$(SERVICES_DIR)/$$project/src/generated \
			$(PROTO_DIR)/*.proto; \
		sed -i 's/^import \(.*_pb2\)/from . import \1/' $(SERVICES_DIR)/$$project/src/generated/*_pb2*.py; \
	done

