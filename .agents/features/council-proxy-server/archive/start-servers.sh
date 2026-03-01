#!/bin/bash

echo "Starting OpenCode server on :4096..."
opencode serve &
OPENCODE_PID=$!

echo "Waiting for OpenCode server to start..."
sleep 3

echo "Starting Council proxy on :4097..."
cd proxy-server
npm start &
PROXY_PID=$!

echo ""
echo "Both servers running:"
echo "  OpenCode: http://127.0.0.1:4096 (PID: $OPENCODE_PID)"
echo "  Council:  http://127.0.0.1:4097/council (PID: $PROXY_PID)"
echo ""
echo "Press Ctrl+C to stop both servers"

trap "kill $OPENCODE_PID $PROXY_PID 2>/dev/null; exit" SIGINT SIGTERM

wait
