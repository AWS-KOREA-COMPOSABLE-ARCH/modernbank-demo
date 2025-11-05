#!/bin/bash

# build_services.sh
echo "Building all Modern Bank services (except user service)..."

SERVICES=(
    "modernbank_account"
    "modernbank_b2bt"
    "modernbank_cqrs"
    "modernbank_customer"
    "modernbank_transfer"
    "modernbank_product"
)

BASE_DIR="/home/ec2-user/workspace/modern-bank"

# 각 서비스별로 빌드 실행
for service in "${SERVICES[@]}"; do
    echo "================================================"
    echo "Building $service..."
    echo "================================================"
    
    cd "$BASE_DIR/$service"
    
    # gradlew 실행 권한 확인 및 부여
    if [ ! -x "./gradlew" ]; then
        echo "Adding execute permission to gradlew"
        chmod +x ./gradlew
    fi
    
    # 빌드 실행
    ./gradlew build
    
    # 빌드 결과 확인
    if [ $? -eq 0 ]; then
        echo "✅ $service built successfully"
    else
        echo "❌ $service build failed"
    fi
    
    echo ""
done

echo "All builds completed"
