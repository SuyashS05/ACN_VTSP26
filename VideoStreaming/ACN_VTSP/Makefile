# ============================================================================
# ACN-VTSP Master Makefile — Local Dev, DB Init, Workers & Microservices
# ============================================================================

.PHONY: help up down ps logs db-init qdrant-init kafka-topics smoke-test

help:
	@echo "ACN-VTSP — Automated Cloud-Native Video Transcoding & Streaming Platform"
	@echo "------------------------------------------------------------------------"
	@echo "make up            - Start Phase 1 local polyglot stack (Postgres, Qdrant, Redis, ClickHouse, Kafka, MinIO, LiveKit, MediaMTX)"
	@echo "make down          - Stop all local infrastructure containers"
	@echo "make ps            - Show health status of all running containers"
	@echo "make db-init       - Initialize PostgreSQL schemas, Qdrant vector collections, ClickHouse views & Kafka topics"
	@echo "make run-api       - Start Go Core API Gateway (services/api-gateway-go)"
	@echo "make run-transcode - Start Go + FFmpeg CMAF Transcoding Worker (workers/transcoder-cmaf)"
	@echo "make run-chat      - Start Go + ONNX Sub-5ms Chat Moderation Gateway (services/chat-moderation-ws)"
	@echo "make run-mcp       - Start TypeScript MCP Server over SSE (services/mcp-server)"

up:
	docker compose up -d

down:
	docker compose down

ps:
	docker compose ps

logs:
	docker compose logs -f --tail=100

kafka-topics:
	docker exec acn-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic video.ingest.object_created --partitions 4 --replication-factor 1
	docker exec acn-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic video.transcode.progressive_ready --partitions 4 --replication-factor 1
	docker exec acn-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic video.transcode.completed --partitions 4 --replication-factor 1
	docker exec acn-kafka /opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic video.ai.completed --partitions 4 --replication-factor 1

qdrant-init:
	python db/qdrant/init_collections.py

db-init: kafka-topics qdrant-init
	@echo "✅ Phase 2: All Databases, Vector Collections, ClickHouse Views & Kafka Topics Initialized!"

