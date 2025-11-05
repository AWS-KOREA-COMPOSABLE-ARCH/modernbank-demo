#!/bin/bash

echo "Starting all Modern Bank services..."

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
    if [ -d "$service" ]; then
        echo "Starting $service..."
        cd "$service"
        
        if [ "$service" = "modernbank_user" ]; then
            # Go service
            nohup ./bank-user > console.log 2>&1 &
        else
            # Java services
            nohup java -jar build/libs/${service}-0.0.1-SNAPSHOT.jar > console.log 2>&1 &
        fi
        
        echo $! > service.pid
        cd ..
    else
        echo "Warning: $service directory not found"
    fi
done

echo "All services started. Check console.log in each service directory for logs"