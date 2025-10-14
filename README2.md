# Modern Bank 서비스 운영 가이드

## 개요
Modern Bank는 마이크로서비스 아키텍처 기반의 디지털 뱅킹 플랫폼으로, 계좌 관리, 이체, 고객 관리, CQRS 패턴 등을 구현한 클라우드 네이티브 애플리케이션입니다.

## 서비스 아키텍처

### 마이크로서비스 구성
Modern Bank는 다음 7개의 마이크로서비스로 구성되어 있습니다:

| 서비스명 | 포트 | 기능 | 언어/프레임워크 |
|---------|------|------|----------------|
| modernbank-account | 8081 | 계좌 관리 (조회, 잔액 확인, 거래 내역) | Java/Spring Boot |
| modernbank-b2bt | 8082 | 타행 이체 (Bank-to-Bank Transfer) | Java/Spring Boot |
| modernbank-customer | 8083 | 고객 관리 (등록, 조회, 정보 수정) | Java/Spring Boot |
| modernbank-cqrs | 8084 | CQRS 패턴 구현 (Command/Query 분리) | Java/Spring Boot |
| modernbank-transfer | 8085 | 당행 이체 (Internal Transfer) | Java/Spring Boot |
| modernbank-product | 8086 | 금융 상품 관리 | Java/Spring Boot |
| modernbank-user | 8091 | 사용자 인증 및 관리 | Go/Gin |

## AWS 인프라 정보

### EKS 클러스터
- **클러스터명**: Composable-Banking-Cluster
- **클러스터 ARN**: arn:aws:eks:ap-northeast-2:216989108269:cluster/Composable-Banking-Cluster
- **엔드포인트**: https://AB7CD7236630FFA4F1FFEA2ED5F011F4.gr7.ap-northeast-2.eks.amazonaws.com
- **Kubernetes 버전**: 1.32
- **리전**: ap-northeast-2
- **VPC ID**: vpc-0737d0e788d6ad0ad
- **네임스페이스**: modernbank

### ECR 리포지토리
- **계정 ID**: 216989108269
- **리전**: ap-northeast-2
- **ECR 베이스 URL**: 216989108269.dkr.ecr.ap-northeast-2.amazonaws.com
- **이미지 태그**: latest

### MSK (Managed Streaming for Apache Kafka)
- **클러스터명**: composable-bank-kafka-cluster
- **클러스터 ARN**: arn:aws:kafka:ap-northeast-2:216989108269:cluster/composable-bank-kafka-cluster/403f8160-7766-413b-b1ba-f0c1c647003d-2
- **Kafka 버전**: 2.8.1
- **브로커 엔드포인트**:
  - b-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
  - b-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
  - b-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
- **Zookeeper 연결 문자열**:
  - z-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181
  - z-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181
  - z-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181

### RDS Aurora PostgreSQL 인스턴스

#### Account 서비스 DB
- **클러스터**: modernbank-account
- **Primary 인스턴스**: modernbank-account-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **Read Replica**: modernbank-account-instance-1-ap-northeast-2a.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **사용자명**: postgres
- **비밀번호**: admin1234

#### Customer 서비스 DB
- **클러스터**: modernbank-customer
- **Primary 인스턴스**: modernbank-customer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **Read Replica**: modernbank-customer-instance-1-ap-northeast-2a.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **사용자명**: postgres
- **비밀번호**: admin1234

#### CQRS 서비스 DB
- **클러스터**: modernbank-cqrs
- **Primary 인스턴스**: modernbank-cqrs-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **Read Replica**: modernbank-cqrs-instance-1-ap-northeast-2a.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **사용자명**: postgres
- **비밀번호**: admin1234

#### Transfer 서비스 DB
- **클러스터**: modernbank-transfer
- **Primary 인스턴스**: modernbank-transfer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **Read Replica**: modernbank-transfer-instance-1-ap-northeast-2a.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **사용자명**: postgres
- **비밀번호**: admin1234

#### User 서비스 DB
- **클러스터**: modernbank-user
- **Primary 인스턴스**: modernbank-user-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **Read Replica**: modernbank-user-instance-1-ap-northeast-2a.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **사용자명**: postgres
- **비밀번호**: admin1234

#### 공통 DB (B2BT, Product 서비스)
- **Primary 인스턴스**: composable-db-1-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432
- **사용자명**: postgres
- **비밀번호**: orI5(tBu94|Uu1-AIyNLVB9l95X?

### DynamoDB
- **서비스 URL**: https://dynamodb.ap-northeast-2.amazonaws.com
- **액세스 키**: accesskey (ConfigMap에서 관리)
- **시크릿 키**: secretKey (ConfigMap에서 관리)

## 배포 및 운영

### Kubernetes 배포
```bash
# 전체 서비스 배포
cd /home/ec2-user/workspace/modern-bank/k8s
./apply.sh

# 개별 서비스 배포
kubectl apply -n modernbank -f account/
kubectl apply -n modernbank -f b2bt/
kubectl apply -n modernbank -f customer/
kubectl apply -n modernbank -f cqrs/
kubectl apply -n modernbank -f product/
kubectl apply -n modernbank -f transfer/
kubectl apply -n modernbank -f user/
```

### 서비스 상태 확인
```bash
# Pod 상태 확인
kubectl get pods -n modernbank

# 서비스 상태 확인
kubectl get svc -n modernbank

# ConfigMap 확인
kubectl get configmap -n modernbank

# 로그 확인
kubectl logs -f deployment/modernbank-account -n modernbank
```

### 주요 명령어

#### EKS 클러스터 접근
```bash
# 현재 컨텍스트 확인
kubectl config current-context

# 클러스터 정보 확인
aws eks describe-cluster --name Composable-Banking-Cluster --region ap-northeast-2
```

#### MSK 클러스터 관리
```bash
# MSK 클러스터 목록 조회
aws kafka list-clusters --region ap-northeast-2

# MSK 클러스터 상세 정보
aws kafka describe-cluster --cluster-arn arn:aws:kafka:ap-northeast-2:216989108269:cluster/composable-bank-kafka-cluster/403f8160-7766-413b-b1ba-f0c1c647003d-2 --region ap-northeast-2
```

#### RDS 인스턴스 관리
```bash
# RDS 인스턴스 목록 조회
aws rds describe-db-instances --region ap-northeast-2

# 특정 인스턴스 상태 확인
aws rds describe-db-instances --db-instance-identifier modernbank-account-instance-1 --region ap-northeast-2
```

## 서비스별 기능 상세

### Account 서비스 (8081)
- **주요 기능**: 계좌 조회, 잔액 확인, 거래 내역 관리
- **API 엔드포인트**: 
  - GET /{acntNo} - 계좌 정보 조회
  - POST /transaction - 거래 처리
- **데이터베이스**: modernbank-account Aurora PostgreSQL 클러스터

### B2BT 서비스 (8082)
- **주요 기능**: 타행 간 이체 처리
- **API 엔드포인트**: 타행 이체 관련 API
- **데이터베이스**: 공통 PostgreSQL 인스턴스

### Customer 서비스 (8083)
- **주요 기능**: 고객 등록, 조회, 정보 수정
- **API 엔드포인트**:
  - POST / - 고객 등록
  - GET /{cstmId} - 고객 정보 조회
- **데이터베이스**: modernbank-customer Aurora PostgreSQL 클러스터

### CQRS 서비스 (8084)
- **주요 기능**: Command와 Query 분리 패턴 구현
- **데이터베이스**: modernbank-cqrs Aurora PostgreSQL 클러스터

### Transfer 서비스 (8085)
- **주요 기능**: 당행 내 계좌 간 이체
- **API 엔드포인트**:
  - POST /internal - 당행 내 이체
- **데이터베이스**: modernbank-transfer Aurora PostgreSQL 클러스터

### Product 서비스 (8086)
- **주요 기능**: 금융 상품 관리
- **데이터베이스**: 공통 PostgreSQL 인스턴스 + DynamoDB

### User 서비스 (8091)
- **주요 기능**: 사용자 인증, 로그인, 사용자 관리
- **API 엔드포인트**:
  - POST /login - 사용자 로그인
  - POST /users - 사용자 생성
  - PUT /users/{id}/password - 비밀번호 변경
- **데이터베이스**: modernbank-user Aurora PostgreSQL 클러스터
- **언어**: Go (Gin 프레임워크)

## 모니터링 및 로깅

### 리소스 사용량
각 서비스는 다음과 같은 리소스 제한이 설정되어 있습니다:
- **Requests**: Memory 512Mi, CPU 250m
- **Limits**: Memory 1Gi, CPU 500m

### 로그 확인
```bash
# 특정 서비스 로그 확인
kubectl logs -f deployment/modernbank-[service-name] -n modernbank

# 모든 서비스 로그 확인
kubectl logs -f -l project=modernbank -n modernbank
```

## 보안 설정

### JWT 토큰
- **JWT Secret**: 67EL7cJ0U4OJ1wdqt+2w3Nqvy5HB9wwhx+DMsXMz9aY= (ConfigMap에서 관리)

### 네트워크 보안
- 모든 RDS 인스턴스는 VPC 내부에서만 접근 가능
- MSK 클러스터는 VPC 내부 통신만 허용
- EKS 클러스터는 보안 그룹으로 네트워크 접근 제어

## 트러블슈팅

### 일반적인 문제 해결

1. **Pod가 시작되지 않는 경우**
   ```bash
   kubectl describe pod [pod-name] -n modernbank
   kubectl logs [pod-name] -n modernbank
   ```

2. **데이터베이스 연결 문제**
   - ConfigMap의 데이터베이스 엔드포인트 확인
   - 보안 그룹 설정 확인
   - RDS 인스턴스 상태 확인

3. **서비스 간 통신 문제**
   - Kubernetes 서비스 상태 확인
   - ConfigMap의 서비스 엔드포인트 확인

### 긴급 연락처 및 에스컬레이션
- **운영팀**: [운영팀 연락처]
- **개발팀**: [개발팀 연락처]
- **AWS 지원**: [AWS 지원 케이스 링크]

## 백업 및 복구

### RDS 백업
- 모든 RDS 인스턴스는 7일 백업 보존 정책 적용
- 자동 백업 시간: 각 인스턴스별로 다른 시간대 설정

### 재해 복구
- Multi-AZ 배포로 고가용성 확보
- 각 서비스별 독립적인 데이터베이스로 장애 격리

---

**마지막 업데이트**: 2025-08-07
**문서 버전**: 1.0
**작성자**: AWS 전문가
