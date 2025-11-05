#!/bin/bash

echo "Stopping all Modern Bank services..."

SERVICES=(
    "modernbank_account"
    "modernbank_b2bt"
    "modernbank_cqrs"
    "modernbank_customer"
    "modernbank_product"
    "modernbank_transfer"
    "modernbank_user"
)

for service in "${SERVICES[@]}"; do
    if [ -d "$service" ] && [ -f "$service/service.pid" ]; then
        PID=$(cat "$service/service.pid")
        echo "Stopping $service (PID: $PID)..."
        kill $PID 2>/dev/null
        rm "$service/service.pid"
    else
        echo "$service not running or PID file not found"
    fi
done

echo "All services stopped"