# Modern Bank 서비스 운영 가이드

## 개요
Modern Bank는 마이크로서비스 아키텍처로 구성된 은행 시스템으로, AWS EKS에 배포되어 운영되고 있습니다.

## EKS 클러스터 정보

### 클러스터 메타데이터
- **클러스터 이름**: Composable-Banking-Cluster
- **클러스터 ARN**: arn:aws:eks:ap-northeast-2:216989108269:cluster/Composable-Banking-Cluster
- **리전**: ap-northeast-2 (서울)
- **Kubernetes 버전**: 1.32
- **엔드포인트**: https://AB7CD7236630FFA4F1FFEA2ED5F011F4.gr7.ap-northeast-2.eks.amazonaws.com
- **네임스페이스**: modernbank
- **VPC ID**: vpc-0737d0e788d6ad0ad
- **OIDC 발급자**: https://oidc.eks.ap-northeast-2.amazonaws.com/id/AB7CD7236630FFA4F1FFEA2ED5F011F4
- **서비스 IPv4 CIDR**: 172.20.0.0/16
- **생성일**: 2025-02-16T00:26:21.479000+00:00

### 노드 정보
```bash
# 노드 상태 확인
kubectl get nodes

# 현재 3개 노드 운영 중 (m6i.4xlarge):
# - ip-10-0-137-10.ap-northeast-2.compute.internal (ap-northeast-2a)
# - ip-10-0-154-11.ap-northeast-2.compute.internal (ap-northeast-2b)
# - ip-10-0-171-83.ap-northeast-2.compute.internal (ap-northeast-2c)
```

### 서브넷 정보
- **프라이빗 서브넷**: 
  - subnet-00d3107331131f8a3 (ap-northeast-2a)
  - subnet-06739ef242ce4867e (ap-northeast-2b)  
  - subnet-05c94854cd7b7cd25 (ap-northeast-2c)
- **퍼블릭 서브넷**:
  - subnet-0d1a6cada0be9f571
  - subnet-0d8bd1e3738e86237
  - subnet-0b904cdc753bff394

## 서비스 구성

### 1. 계좌 서비스 (modernbank-account)
- **포트**: 8081
- **기능**: 계좌 조회, 계좌 생성, 계좌 목록 조회, 잔액 조회
- **ECR 이미지**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-account:latest
- **전용 DB**: modernbank-account Aurora PostgreSQL 클러스터
- **리소스 제한**: CPU 500m, Memory 1Gi (요청: CPU 250m, Memory 512Mi)
- **Service Account**: modernbank-account-sa

### 2. 타행이체 서비스 (modernbank-b2bt)
- **포트**: 8082
- **기능**: 타행 간 이체 처리 (Kafka 기반 비동기 처리)
- **ECR 이미지**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-b2bt:latest
- **공용 DB**: composable-db-1 PostgreSQL 클러스터
- **리소스 제한**: CPU 500m, Memory 1Gi (요청: CPU 250m, Memory 512Mi)
- **Service Account**: modernbank-b2bt-sa

### 3. 고객관리 서비스 (modernbank-customer)
- **포트**: 8083
- **기능**: 고객 정보 관리
- **ECR 이미지**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-customer:latest
- **전용 DB**: modernbank-customer Aurora PostgreSQL 클러스터
- **리소스 제한**: CPU 500m, Memory 1Gi (요청: CPU 250m, Memory 512Mi)
- **Service Account**: modernbank-customer-sa

### 4. CQRS 서비스 (modernbank-cqrs)
- **포트**: 8084
- **기능**: Command Query Responsibility Segregation 패턴 구현
- **ECR 이미지**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-cqrs:latest
- **전용 DB**: modernbank-cqrs Aurora PostgreSQL 클러스터
- **리소스 제한**: CPU 500m, Memory 1Gi (요청: CPU 250m, Memory 512Mi)
- **Service Account**: modernbank-cqrs-sa

### 5. 당행이체 서비스 (modernbank-transfer)
- **포트**: 8085
- **기능**: 당행 내 계좌 간 이체 처리
- **ECR 이미지**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-transfer:latest
- **전용 DB**: modernbank-transfer Aurora PostgreSQL 클러스터
- **리소스 제한**: CPU 500m, Memory 1Gi (요청: CPU 250m, Memory 512Mi)
- **Service Account**: modernbank-transfer-sa

### 6. 상품 서비스 (modernbank-product)
- **포트**: 8086
- **기능**: 금융 상품 관리 (DynamoDB 연동)
- **ECR 이미지**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-product:latest
- **DB**: PostgreSQL + DynamoDB
- **리소스 제한**: CPU 500m, Memory 1Gi (요청: CPU 250m, Memory 512Mi)
- **Service Account**: modernbank-product-sa

### 7. 사용자 서비스 (modernbank-user)
- **포트**: 8091
- **기능**: 사용자 인증 및 관리 (JWT 기반)
- **ECR 이미지**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-user:latest
- **전용 DB**: modernbank-user Aurora PostgreSQL 클러스터
- **리소스 제한**: CPU 500m, Memory 1Gi (요청: CPU 250m, Memory 512Mi)
- **Service Account**: modernbank-user-sa

## 인프라 리소스

### MSK (Kafka) 클러스터
- **클러스터 이름**: composable-bank-kafka-cluster
- **클러스터 ARN**: arn:aws:kafka:ap-northeast-2:216989108269:cluster/composable-bank-kafka-cluster/403f8160-7766-413b-b1ba-f0c1c647003d-2
- **브로커 엔드포인트**:
  - b-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
  - b-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
  - b-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
- **Zookeeper 엔드포인트**:
  - z-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181
  - z-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181
  - z-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181

### RDS Aurora PostgreSQL 클러스터

#### 1. modernbank-account 클러스터
- **클러스터 ID**: modernbank-account
- **엔드포인트**: modernbank-account.cluster-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com
- **읽기 전용 엔드포인트**: modernbank-account.cluster-ro-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com
- **인스턴스**: modernbank-account-instance-1 (Writer), modernbank-account-instance-1-ap-northeast-2a (Reader)

#### 2. modernbank-cqrs 클러스터
- **클러스터 ID**: modernbank-cqrs
- **엔드포인트**: modernbank-cqrs.cluster-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com
- **읽기 전용 엔드포인트**: modernbank-cqrs.cluster-ro-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com

#### 3. modernbank-customer 클러스터
- **클러스터 ID**: modernbank-customer
- **엔드포인트**: modernbank-customer.cluster-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com
- **읽기 전용 엔드포인트**: modernbank-customer.cluster-ro-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com

#### 4. modernbank-transfer 클러스터
- **클러스터 ID**: modernbank-transfer
- **엔드포인트**: modernbank-transfer.cluster-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com
- **읽기 전용 엔드포인트**: modernbank-transfer.cluster-ro-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com

#### 5. modernbank-user 클러스터
- **클러스터 ID**: modernbank-user
- **엔드포인트**: modernbank-user.cluster-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com
- **읽기 전용 엔드포인트**: modernbank-user.cluster-ro-cre4cy420rgv.ap-northeast-2.rds.amazonaws.com

#### 6. 공용 클러스터 (composable-db-1)
- **엔드포인트**: composable-db-1-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432

### DynamoDB
- **서비스 URL**: https://dynamodb.ap-northeast-2.amazonaws.com
- **사용 서비스**: modernbank-product

### Application Load Balancer
- **Ingress 이름**: modernbank-ingress
- **ALB 엔드포인트**: internal-k8s-modernba-modernba-0837b1f6e6-1217569516.ap-northeast-2.elb.amazonaws.com
- **스키마**: internal (내부 전용)

## 운영 명령어

### 서비스 상태 확인
```bash
# 전체 리소스 상태 확인
kubectl get all -n modernbank

# 특정 서비스 상태 확인
kubectl get pods -n modernbank -l app=modernbank-account

# 서비스 로그 확인
kubectl logs -n modernbank deployment/modernbank-account -f

# ConfigMap 확인
kubectl get configmap modernbank-services-cm -n modernbank -o yaml
```

### 서비스 배포
```bash
# 전체 서비스 배포
cd /home/ec2-user/workspace/modern-bank/k8s
./apply.sh

# 특정 서비스 재배포
kubectl rollout restart deployment/modernbank-account -n modernbank

# 배포 상태 확인
kubectl rollout status deployment/modernbank-account -n modernbank
```

### 서비스 스케일링
```bash
# 특정 서비스 스케일 아웃
kubectl scale deployment modernbank-account --replicas=3 -n modernbank

# HPA 설정 (필요시)
kubectl autoscale deployment modernbank-account --cpu-percent=70 --min=1 --max=5 -n modernbank
```

### 네트워크 및 연결 확인
```bash
# 서비스 엔드포인트 확인
kubectl get svc -n modernbank

# Ingress 상태 확인
kubectl get ingress -n modernbank

# 서비스 간 연결 테스트
kubectl exec -it deployment/modernbank-account -n modernbank -- curl http://modernbank-customer:8083/health
```

## 모니터링 및 트러블슈팅

### 주요 확인 포인트
1. **Pod 상태**: 모든 Pod가 Running 상태인지 확인
2. **리소스 사용량**: CPU/Memory 사용률 모니터링
3. **DB 연결**: 각 서비스별 DB 연결 상태 확인
4. **Kafka 연결**: MSK 클러스터 연결 상태 확인
5. **ALB 헬스체크**: 각 서비스의 헬스체크 엔드포인트 응답 확인

### 일반적인 문제 해결
```bash
# Pod 재시작
kubectl delete pod -n modernbank -l app=modernbank-account

# 이미지 업데이트 후 재배포
kubectl set image deployment/modernbank-account modernbank-account=216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-account:new-tag -n modernbank

# ConfigMap 업데이트 후 Pod 재시작
kubectl rollout restart deployment/modernbank-account -n modernbank
```

## 보안 정보
- **JWT Secret**: ConfigMap에 저장 (운영 환경에서는 AWS Secrets Manager 사용 권장)
- **DB 패스워드**: ConfigMap에 저장 (운영 환경에서는 AWS Secrets Manager 사용 권장)
- **Service Account**: 각 서비스별로 전용 SA 사용

## 백업 및 복구
- **RDS**: 자동 백업 7일 보관 설정
- **Point-in-time Recovery**: 모든 RDS 클러스터에서 지원
- **MSK**: 토픽별 retention 정책 적용

## 연락처 및 에스컬레이션
- **운영팀**: [운영팀 연락처]
- **개발팀**: [개발팀 연락처]
- **AWS 지원**: [AWS 지원 케이스 링크]

---
**마지막 업데이트**: 2025-08-07
**문서 버전**: 1.1
