#!/bin/bash
# cd modernbank-demo
# 환경 변수 설정 (없을 경우 스크립트 종료)
if [ -z "$AWS_ACCOUNT_ID" ] || [ -z "$AWS_REGION" ]; then
    echo "Error: AWS_ACCOUNT_ID 또는 AWS_REGION 환경변수가 설정되지 않았습니다."
    echo "다음 명령어로 환경변수를 설정해주세요:"
    echo "export AWS_ACCOUNT_ID=<your-account-id>"
    echo "export AWS_REGION=<your-region>"
    exit 1
fi

# k8s 폴더 존재 확인
if [ ! -d "k8s" ]; then
    echo "Error: k8s 폴더를 찾을 수 없습니다."
    exit 1
fi

# cd modernbank-demo
# 모든 yaml 파일 찾기 및 처리
find k8s -type f -name "*.yaml" -o -name "*.yml" | while read file; do
    echo "처리중인 파일: $file"    
    # 임시 파일 생성
    temp_file=$(mktemp)
    
    # image 경로의 AWS_ACCOUNT_ID와 region 치환
    sed -E "s|(image: )([0-9]+)(\.dkr\.ecr\.)([a-z0-9-]+)(\.amazonaws\.com)|\1$AWS_ACCOUNT_ID\3$AWS_REGION\5|g" "$file" > "$temp_file"
    # role-arn의 AWS_ACCOUNT_ID 치환
    sed -i -E "s|(eks\.amazonaws\.com/role-arn: arn:aws:iam::)([0-9]+)(:role)|\1$AWS_ACCOUNT_ID\3|g" "$temp_file"
    
    # 원본 파일의 권한 유지
    original_permissions=$(stat -c %a "$file")
    # 변경된 내용을 원본 파일로 복사
    cp "$temp_file" "$file"
    # 원본 권한 복원
    chmod "$original_permissions" "$file"
    
    # 임시 파일 삭제
    rm "$temp_file"
    echo "완료: $file"
done

echo "모든 파일의 계정정보 설정이 완료되었습니다."
echo "RDB 엔드포인트 값을 업데이트 합니다."

CONFIG_FILE="k8s/service-cm.yaml"
# OUTPUT_FILE="k8s/service-cm-updated.yaml"

# 각 서비스의 엔드포인트 조회
ACCOUNT_ENDPOINT=$(aws rds describe-db-instances --query "DBInstances[?DBClusterIdentifier=='modernbank-account' && PromotionTier==\`0\`].Endpoint.Address" --output text)
CQRS_ENDPOINT=$(aws rds describe-db-instances --query "DBInstances[?DBClusterIdentifier=='modernbank-cqrs' && PromotionTier==\`0\`].Endpoint.Address" --output text)
CUSTOMER_ENDPOINT=$(aws rds describe-db-instances --query "DBInstances[?DBClusterIdentifier=='modernbank-customer' && PromotionTier==\`0\`].Endpoint.Address" --output text)
TRANSFER_ENDPOINT=$(aws rds describe-db-instances --query "DBInstances[?DBClusterIdentifier=='modernbank-transfer' && PromotionTier==\`0\`].Endpoint.Address" --output text)
USER_ENDPOINT=$(aws rds describe-db-instances --query "DBInstances[?DBClusterIdentifier=='modernbank-user' && PromotionTier==\`0\`].Endpoint.Address" --output text)

# 도메인 부분만 추출 (포트 제거)
ACCOUNT_ENDPOINT=${ACCOUNT_ENDPOINT%:*}
CQRS_ENDPOINT=${CQRS_ENDPOINT%:*}
CUSTOMER_ENDPOINT=${CUSTOMER_ENDPOINT%:*}
TRANSFER_ENDPOINT=${TRANSFER_ENDPOINT%:*}
USER_ENDPOINT=${USER_ENDPOINT%:*}

# MSK 클러스터 정보 가져오기
CLUSTER_ARN=$(aws kafka list-clusters --query 'ClusterInfoList[?ClusterName==`composable-bank-kafka-cluster`].ClusterArn' --output text)

# 브로커 주소 가져오기 (PLAINTEXT 리스너)
BROKER_STRING=$(aws kafka get-bootstrap-brokers \
    --cluster-arn "$CLUSTER_ARN" \
    --query 'BootstrapBrokerString || BootstrapBrokerStringTls' \
    --output text)

# RDB 엔드포인트 출력
echo "ACCOUNT DB endpoint : $ACCOUNT_ENDPOINT"
echo "CQRS DB endpoint : $CQRS_ENDPOINT"
echo "CUSTOMER DB endpoint : $CUSTOMER_ENDPOINT"
echo "TRANSFER DB endpoint : $TRANSFER_ENDPOINT"
echo "USER DB endpoint : $USER_ENDPOINT"
echo "KAFKA Broker string : $BROKER_STRING"

# ConfigMap 업데이트
sed -i.bak \
    -e "s|postgres-account-endpoint: .*|postgres-account-endpoint: $ACCOUNT_ENDPOINT|" \
    -e "s|postgres-cqrs-endpoint: .*|postgres-cqrs-endpoint: $CQRS_ENDPOINT|" \
    -e "s|postgres-customer-endpoint: .*|postgres-customer-endpoint: $CUSTOMER_ENDPOINT|" \
    -e "s|postgres-transfer-endpoint: .*|postgres-transfer-endpoint: $TRANSFER_ENDPOINT|" \
    -e "s|postgres-user-endpoint: .*|postgres-user-endpoint: $USER_ENDPOINT|" \
    -e "s|kafka-service: .*|kafka-service: $BROKER_STRING|" \
    "$CONFIG_FILE"

rm "$CONFIG_FILE.bak"

echo "Updated ConfigMap has been written to $CONFIG_FILE"