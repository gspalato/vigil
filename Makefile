### Protobuf Generation
PROTO_DIR=shared/proto
NODE_MODULES_DIR=/usr/lib/node_modules
ROOT_DIR=./
SERVICES_DIR=./services

# All projects that need protobuf generation
PROTO_PY_PROJECTS=analytics ml
PROTO_TS_PROJECTS=gateway portal

# All projects that need openapi generation
OPENAPI_SERVER_TS_PROJECTS=services/gateway
OPENAPI_CLIENT_TS_PROJECTS=apps/mobile

.PHONY: all proto-ts proto-py openapi-ts

all: proto-ts proto-py

proto-ts:
	@for project in $(PROTO_TS_PROJECTS); do \
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
	@for project in $(PROTO_PY_PROJECTS); do \
		echo "Generating Python for $$project..."; \
		mkdir -p $(SERVICES_DIR)/$$project/generated; \
		if ! [ -e "$(SERVICES_DIR)/$$project/generated/__init__.py" ] ; then touch "$(SERVICES_DIR)/$$project/generated/__init__.py"; fi; \
		tools/python-proto-codegen/venv/bin/python -m grpc_tools.protoc \
			-I=$(PROTO_DIR) \
			--python_out=$(SERVICES_DIR)/$$project/generated \
			--grpc_python_out=$(SERVICES_DIR)/$$project/generated \
			--pyi_out=$(SERVICES_DIR)/$$project/generated \
			$(PROTO_DIR)/*.proto; \
		sed -i 's/^import \(.*_pb2\)/from . import \1/' $(SERVICES_DIR)/$$project/generated/*_pb2*.py; \
	done

openapi-ts:
	@for server_project in $(OPENAPI_SERVER_TS_PROJECTS); do \
		echo "Generating OpenAPI Spec for $$server_project..."; \
		npx tspec generate --output $(ROOT_DIR)/$$server_project/openapi.json; \
		@for client_project in $(OPENAPI_CLIENT_TS_PROJECTS); do \
			echo "Generating OpenAPI Client for $$server_project on $$client_project..."; \
			npx @hey-api/openapi-ts -i $(ROOT_DIR)/$$server_project/openapi.json -o $(ROOT_DIR)/$$client_project/generated/api; \
		done; \
	done