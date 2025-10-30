# Modern Bank 서비스 운영 가이드

## 개요
Modern Bank는 마이크로서비스 아키텍처로 구성된 디지털 뱅킹 플랫폼입니다. 각 서비스는 독립적으로 배포되며 Kubernetes 환경에서 운영됩니다.

## EKS 클러스터 정보

### 클러스터 메타데이터
- **클러스터 이름**: `CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c`
- **클러스터 ARN**: `arn:aws:eks:ap-northeast-2:940928349059:cluster/CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c`
- **리전**: `ap-northeast-2`
- **Kubernetes 버전**: `1.32`
- **엔드포인트**: `https://F1BB6125081C56AB84AE28A6893227A5.gr7.ap-northeast-2.eks.amazonaws.com`
- **상태**: `ACTIVE`

### 네트워크 구성
- **VPC ID**: `vpc-0ba156d998a0d2aa9`
- **VPC CIDR**: `10.0.0.0/16`
- **서브넷**: 
  - `subnet-0403d069361abb8d8`
  - `subnet-05e8439549016d6a7`
- **보안 그룹**: `sg-0a23e002a8592b16f`
- **서비스 IPv4 CIDR**: `172.20.0.0/16`

### 접근 정보
```bash
# kubectl context 설정
kubectl config current-context
# arn:aws:eks:ap-northeast-2:940928349059:cluster/CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c

# EKS 클러스터 접근 설정
aws eks update-kubeconfig --region ap-northeast-2 --name CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c
```

## Modern Bank 서비스 구성

### 1. 계좌 서비스 (modernbank-account)
- **기능**: 계좌 조회, 계좌 생성, 잔액 조회, 거래 내역 관리
- **포트**: 8081
- **네임스페이스**: modernbank
- **ECR 이미지**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-account:latest`
- **엔드포인트**: `/modernbank/account`
- **주요 API**:
  - `GET /{acntNo}` - 계좌 조회
  - `POST /` - 계좌 생성
  - `GET /customer/{cstmId}/accounts` - 고객별 계좌 목록
  - `GET /{acntNo}/balance` - 잔액 조회

### 2. 타행이체 서비스 (modernbank-b2bt)
- **기능**: 타행 간 이체 처리
- **포트**: 8082
- **네임스페이스**: modernbank
- **ECR 이미지**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-b2bt:latest`
- **엔드포인트**: `/modernbank/b2bt`

### 3. 고객관리 서비스 (modernbank-customer)
- **기능**: 고객 정보 관리, 고객 등록, 고객 조회
- **포트**: 8083
- **네임스페이스**: modernbank
- **ECR 이미지**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-customer:latest`
- **엔드포인트**: `/modernbank/customer`
- **주요 API**:
  - `POST /` - 고객 등록
  - `GET /{cstmId}` - 기본 고객 정보 조회
  - `GET /{cstmId}/details` - 상세 고객 정보 조회
  - `GET /{cstmId}/exists` - 고객 존재 여부 확인

### 4. CQRS 서비스 (modernbank-cqrs)
- **기능**: Command Query Responsibility Segregation 패턴 구현, 고객 정보 조회 최적화
- **포트**: 8084
- **네임스페이스**: modernbank
- **ECR 이미지**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-cqrs:latest`
- **엔드포인트**: `/modernbank/cqrs`
- **주요 API**:
  - `GET /customers/{cstmId}/details` - 고객 상세 정보 조회
  - `POST /customer` - 고객 정보 저장 (DynamoDB)
  - `GET /customer/{id}` - 고객 정보 조회 (DynamoDB)

### 5. 당행이체 서비스 (modernbank-transfer)
- **기능**: 당행 내 계좌 간 이체, 이체 한도 관리, 이체 내역 관리
- **포트**: 8085
- **네임스페이스**: modernbank
- **ECR 이미지**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-transfer:latest`
- **엔드포인트**: `/modernbank/transfer`
- **주요 API**:
  - `POST /internal` - 당행 내 이체
  - `POST /external` - 타행 이체

### 6. 상품 서비스 (modernbank-product)
- **기능**: 금융 상품 관리
- **포트**: 8086
- **네임스페이스**: modernbank
- **ECR 이미지**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-product:latest`
- **엔드포인트**: `/modernbank/product`

### 7. 사용자 서비스 (modernbank-user)
- **기능**: 사용자 인증, 사용자 관리 (Go 언어로 구현)
- **포트**: 8091
- **네임스페이스**: modernbank
- **ECR 이미지**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-user:latest`
- **엔드포인트**: `/modernbank/user`
- **주요 기능**:
  - 사용자 생성
  - 비밀번호 변경
  - 사용자 인증

## 데이터베이스 정보

### RDS Aurora PostgreSQL 클러스터
각 서비스별로 독립적인 데이터베이스 클러스터를 사용합니다.

#### 1. Account 서비스 DB
- **클러스터 식별자**: `modernbank-account`
- **엔드포인트**: `modernbank-account.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **인스턴스 엔드포인트**: `modernbank-account-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **엔진**: Aurora PostgreSQL 14.13
- **사용자**: postgres
- **비밀번호**: admin1234

#### 2. CQRS 서비스 DB
- **클러스터 식별자**: `modernbank-cqrs`
- **엔드포인트**: `modernbank-cqrs.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **인스턴스 엔드포인트**: `modernbank-cqrs-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **엔진**: Aurora PostgreSQL 14.13
- **사용자**: postgres
- **비밀번호**: admin1234

#### 3. Customer 서비스 DB
- **클러스터 식별자**: `modernbank-customer`
- **엔드포인트**: `modernbank-customer.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **인스턴스 엔드포인트**: `modernbank-customer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **엔진**: Aurora PostgreSQL 14.13
- **사용자**: postgres
- **비밀번호**: admin1234

#### 4. Transfer 서비스 DB
- **클러스터 식별자**: `modernbank-transfer`
- **엔드포인트**: `modernbank-transfer.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **인스턴스 엔드포인트**: `modernbank-transfer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **엔진**: Aurora PostgreSQL 14.17
- **사용자**: postgres
- **비밀번호**: admin1234

#### 5. User 서비스 DB
- **클러스터 식별자**: `modernbank-user`
- **엔드포인트**: `modernbank-user.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **인스턴스 엔드포인트**: `modernbank-user-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **엔진**: Aurora PostgreSQL 14.17
- **사용자**: postgres
- **비밀번호**: admin1234

## 메시지 큐 (MSK) 정보

### Amazon MSK 클러스터
- **클러스터 이름**: `composable-bank-kafka-cluster`
- **클러스터 ARN**: `arn:aws:kafka:ap-northeast-2:940928349059:cluster/composable-bank-kafka-cluster/717af7a2-743b-4a9d-94eb-f37dad2b17f3-3`
- **Kafka 버전**: 3.6.0
- **브로커 수**: 4개
- **인스턴스 타입**: kafka.m5.large
- **상태**: ACTIVE

#### 브로커 엔드포인트
```
b-1.composablebankkaf.x78vwx.c3.kafka.ap-northeast-2.amazonaws.com:9092
b-2.composablebankkaf.x78vwx.c3.kafka.ap-northeast-2.amazonaws.com:9092
b-4.composablebankkaf.x78vwx.c3.kafka.ap-northeast-2.amazonaws.com:9092
```

#### ConfigMap에서 사용되는 엔드포인트
```
b-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
b-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
b-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
```

## 로드 밸런서 정보

### Application Load Balancer (ALB)
- **DNS 이름**: `internal-k8s-modernbank-05673ec9de-1781820563.ap-northeast-2.elb.amazonaws.com`
- **스키마**: Internal (VPC 내부 접근만 가능)
- **타겟 타입**: IP
- **그룹 이름**: modernbank

### 서비스별 경로
- Account: `/modernbank/account`
- B2BT: `/modernbank/b2bt`
- Customer: `/modernbank/customer`
- CQRS: `/modernbank/cqrs`
- Transfer: `/modernbank/transfer`
- Product: `/modernbank/product`
- User: `/modernbank/user`

## 배포 및 운영

### 배포 스크립트
```bash
# 전체 서비스 배포
cd /home/ec2-user/environment/modernbank-demo/k8s
./apply.sh
```

### 주요 운영 명령어

#### 서비스 상태 확인
```bash
# 전체 리소스 확인
kubectl get all -n modernbank

# 특정 서비스 상태 확인
kubectl get pods -n modernbank -l app=modernbank-account

# 서비스 로그 확인
kubectl logs -n modernbank deployment/modernbank-account -f
```

#### 서비스 스케일링
```bash
# 레플리카 수 조정
kubectl scale deployment modernbank-account -n modernbank --replicas=3
```

#### ConfigMap 확인
```bash
# 서비스 설정 확인
kubectl get configmap modernbank-services-cm -n modernbank -o yaml
```

## 모니터링 및 헬스체크

### 헬스체크 엔드포인트
각 서비스는 다음 경로에서 헬스체크를 제공합니다:
- `/modernbank/{service-name}/actuator`

### 로그 위치
- **애플리케이션 로그**: Kubernetes 파드 로그
- **접근 로그**: ALB 액세스 로그

## 보안 정보

### 서비스 계정
각 서비스는 독립적인 ServiceAccount를 사용합니다:
- `modernbank-account-sa`
- `modernbank-b2bt-sa`
- `modernbank-customer-sa`
- `modernbank-cqrs-sa`
- `modernbank-transfer-sa`
- `modernbank-user-sa`

### JWT 시크릿
- ConfigMap에 저장된 JWT 시크릿: `67EL7cJ0U4OJ1wdqt+2w3Nqvy5HB9wwhx+DMsXMz9aY=`

## 트러블슈팅

### 일반적인 문제 해결

#### 1. 서비스 접근 불가
```bash
# 서비스 상태 확인
kubectl get svc -n modernbank

# 엔드포인트 확인
kubectl get endpoints -n modernbank

# Ingress 상태 확인
kubectl get ingress -n modernbank
```

#### 2. 데이터베이스 연결 문제
```bash
# ConfigMap 확인
kubectl describe configmap modernbank-services-cm -n modernbank

# 파드 환경변수 확인
kubectl exec -n modernbank deployment/modernbank-account -- env | grep POSTGRES
```

#### 3. 파드 재시작 문제
```bash
# 파드 이벤트 확인
kubectl describe pod -n modernbank <pod-name>

# 파드 로그 확인
kubectl logs -n modernbank <pod-name> --previous
```

## 연락처 및 지원

### 운영팀 정보
- **AWS 계정 ID**: 940928349059
- **리전**: ap-northeast-2 (Seoul)
- **환경**: Production

### 중요 리소스 ID 요약
- **EKS 클러스터**: CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c
- **VPC**: vpc-0ba156d998a0d2aa9
- **MSK 클러스터**: composable-bank-kafka-cluster
- **ALB**: internal-k8s-modernbank-05673ec9de-1781820563.ap-northeast-2.elb.amazonaws.com

---
*최종 업데이트: 2025-10-30*
