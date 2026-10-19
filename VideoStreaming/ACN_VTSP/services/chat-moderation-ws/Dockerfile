FROM golang:1.23-alpine AS builder
WORKDIR /app
COPY . .
RUN go build -o /bin/chatgw ./cmd/chatgw/main.go

FROM alpine:3.20
WORKDIR /app
COPY --from=builder /bin/chatgw /usr/local/bin/chatgw
COPY models/detoxify_multilingual_int8.onnx /app/models/detoxify_multilingual_int8.onnx
EXPOSE 8081
ENTRYPOINT ["/usr/local/bin/chatgw"]

