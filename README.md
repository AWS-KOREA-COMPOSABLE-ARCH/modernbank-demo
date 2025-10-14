# Modern Bank 서비스 운영 가이드

## 개요
Modern Bank는 마이크로서비스 아키텍처 기반의 은행 서비스로, 계좌 관리, 이체, 고객 관리, CQRS 패턴 등을 구현한 클라우드 네이티브 애플리케이션입니다.

## 시스템 아키텍처

### 서비스 구성
Modern Bank는 다음 7개의 마이크로서비스로 구성되어 있습니다:

1. **modernbank-account** (포트: 8081) - 계좌 관리 서비스
2. **modernbank-b2bt** (포트: 8082) - 타행 이체 서비스 (Bank-to-Bank Transfer)
3. **modernbank-customer** (포트: 8083) - 고객 관리 서비스
4. **modernbank-cqrs** (포트: 8084) - CQRS 패턴 구현 서비스
5. **modernbank-transfer** (포트: 8085) - 당행 이체 서비스
6. **modernbank-product** (포트: 8086) - 상품 관리 서비스
7. **modernbank-user** (포트: 8091) - 사용자 인증 서비스

## EKS 클러스터 정보

### 클러스터 메타데이터
- **클러스터 이름**: `Composable-Banking-Cluster`
- **클러스터 ARN**: `arn:aws:eks:ap-northeast-2:216989108269:cluster/Composable-Banking-Cluster`
- **리전**: `ap-northeast-2` (서울)
- **계정 ID**: `216989108269`
- **Kubernetes 버전**: `1.32`
- **엔드포인트**: `https://AB7CD7236630FFA4F1FFEA2ED5F011F4.gr7.ap-northeast-2.eks.amazonaws.com`
- **네임스페이스**: `modernbank`

### 네트워크 구성
- **VPC ID**: `vpc-0737d0e788d6ad0ad`
- **서브넷 ID들**:
  - `subnet-0d1a6cada0be9f571`
  - `subnet-0d8bd1e3738e86237`
  - `subnet-0b904cdc753bff394`
  - `subnet-00d3107331131f8a3`
  - `subnet-06739ef242ce4867e`
  - `subnet-05c94854cd7b7cd25`
- **보안 그룹**: `sg-06b2f6722160bf086`
- **클러스터 보안 그룹**: `sg-00a2b891efb9641d4`

### 접근 정보
```bash
# 클러스터 컨텍스트 확인
kubectl config current-context
# 출력: arn:aws:eks:ap-northeast-2:216989108269:cluster/Composable-Banking-Cluster

# 네임스페이스 확인
kubectl get pods -n modernbank
```

## 데이터베이스 정보

### Aurora PostgreSQL 클러스터
각 서비스별로 독립적인 Aurora PostgreSQL 인스턴스를 사용합니다:

#### Account 서비스 DB
- **엔드포인트**: `modernbank-account-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432`
- **사용자**: `postgres`
- **비밀번호**: `admin1234`
- **인스턴스 클래스**: `db.r7g.large`

#### Customer 서비스 DB
- **엔드포인트**: `modernbank-customer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432`
- **사용자**: `postgres`
- **비밀번호**: `admin1234`
- **인스턴스 클래스**: `db.r7g.large`

#### CQRS 서비스 DB
- **엔드포인트**: `modernbank-cqrs-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432`
- **사용자**: `postgres`
- **비밀번호**: `admin1234`
- **인스턴스 클래스**: `db.r7g.large`

#### Transfer 서비스 DB
- **엔드포인트**: `modernbank-transfer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432`
- **사용자**: `postgres`
- **비밀번호**: `admin1234`
- **인스턴스 클래스**: `db.r7g.large`

#### User 서비스 DB
- **엔드포인트**: `modernbank-user-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com:5432`
- **사용자**: `postgres`
- **비밀번호**: `admin1234`
- **인스턴스 클래스**: `db.r7g.large`

### 공통 DB 설정
- **엔진**: Aurora PostgreSQL 14.15
- **암호화**: 활성화 (KMS Key: `arn:aws:kms:ap-northeast-2:216989108269:key/db756bcf-0530-47c7-afbc-b40fce417ed3`)
- **백업 보존 기간**: 7일
- **Performance Insights**: 활성화

## MSK (Kafka) 정보

### 클러스터 정보
- **클러스터 이름**: `composable-bank-kafka-cluster`
- **클러스터 ARN**: `arn:aws:kafka:ap-northeast-2:216989108269:cluster/composable-bank-kafka-cluster/403f8160-7766-413b-b1ba-f0c1c647003d-2`
- **Kafka 버전**: `2.8.1`
- **브로커 수**: 3개

### 브로커 엔드포인트
```
b-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
b-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
b-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
```

### Zookeeper 연결 문자열
```
z-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181
z-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181
z-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:2181
```

## ECR 이미지 정보

### 이미지 레지스트리
- **ECR 레지스트리**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com`

### 서비스별 이미지
- `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-account:latest`
- `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-b2bt:latest`
- `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-customer:latest`
- `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-cqrs:latest`
- `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-transfer:latest`
- `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-product:latest`
- `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-user:latest`

## 배포 정보

### 배포 스크립트
```bash
# 전체 서비스 배포
cd /home/ec2-user/workspace/modern-bank/k8s
./apply.sh
```

### 서비스별 리소스 요구사항
각 서비스는 다음과 같은 리소스를 요구합니다:
- **CPU 요청**: 250m
- **메모리 요청**: 512Mi
- **CPU 제한**: 500m
- **메모리 제한**: 1Gi
- **복제본 수**: 1개

### 서비스 엔드포인트 (클러스터 내부)
- Account: `modernbank-account:8081`
- B2BT: `modernbank-b2bt:8082`
- Customer: `modernbank-customer:8083`
- CQRS: `modernbank-cqrs:8084`
- Transfer: `modernbank-transfer:8085`
- Product: `modernbank-product:8086`
- User: `modernbank-user:8091`

## 운영 명령어

### 서비스 상태 확인
```bash
# 모든 Pod 상태 확인
kubectl get pods -n modernbank

# 서비스 상태 확인
kubectl get services -n modernbank

# 특정 Pod 로그 확인
kubectl logs -n modernbank <pod-name>

# Pod 상세 정보 확인
kubectl describe pod -n modernbank <pod-name>
```

### 설정 정보 확인
```bash
# ConfigMap 확인
kubectl get configmap -n modernbank modernbank-services-cm -o yaml

# 환경 변수 확인
kubectl exec -n modernbank <pod-name> -- env
```

### 데이터베이스 연결 테스트
```bash
# PostgreSQL 연결 테스트 (예: Account DB)
psql -h modernbank-account-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com -p 5432 -U postgres -d postgres
```

### Kafka 연결 테스트
```bash
# Kafka 토픽 목록 확인 (클러스터 내부에서)
kafka-topics.sh --bootstrap-server b-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092 --list
```

## 서비스별 기능

### 1. Account Service (계좌 관리)
- 계좌 생성, 조회, 수정, 삭제
- 계좌 잔액 관리
- 계좌 거래 내역 관리

### 2. B2BT Service (타행 이체)
- 타 은행으로의 이체 처리
- 이체 수수료 계산
- 이체 상태 관리

### 3. Customer Service (고객 관리)
- 고객 정보 관리
- 고객 인증 및 권한 관리
- 고객 프로필 관리

### 4. CQRS Service (명령-쿼리 분리)
- 명령과 쿼리 분리 패턴 구현
- 이벤트 소싱
- 읽기 모델 최적화

### 5. Transfer Service (당행 이체)
- 동일 은행 내 계좌 간 이체
- 즉시 이체 처리
- 이체 한도 관리

### 6. Product Service (상품 관리)
- 은행 상품 정보 관리
- 상품 카탈로그
- 상품 가입 관리

### 7. User Service (사용자 인증)
- 사용자 인증 및 권한 부여
- JWT 토큰 관리
- 사용자 세션 관리

## 보안 정보

### JWT 시크릿
- **JWT Secret**: `67EL7cJ0U4OJ1wdqt+2w3Nqvy5HB9wwhx+DMsXMz9aY=`

### 서비스 계정
각 서비스는 독립적인 Kubernetes Service Account를 사용합니다:
- `modernbank-account-sa`
- `modernbank-b2bt-sa`
- `modernbank-customer-sa`
- `modernbank-cqrs-sa`
- `modernbank-transfer-sa`
- `modernbank-product-sa`
- `modernbank-user-sa`

## 모니터링 및 로깅

### CloudWatch 로그 그룹
- RDS 모니터링: `/aws/rds/instance/modernbank-*/slowquery`
- EKS 클러스터 로그: `/aws/eks/Composable-Banking-Cluster/cluster`

### Performance Insights
모든 RDS 인스턴스에서 Performance Insights가 활성화되어 있습니다.

## 트러블슈팅

### 일반적인 문제 해결
1. **Pod가 시작되지 않는 경우**:
   ```bash
   kubectl describe pod -n modernbank <pod-name>
   kubectl logs -n modernbank <pod-name>
   ```

2. **데이터베이스 연결 문제**:
   - 보안 그룹 설정 확인
   - 엔드포인트 및 포트 확인
   - 자격 증명 확인

3. **Kafka 연결 문제**:
   - MSK 클러스터 상태 확인
   - 브로커 엔드포인트 확인
   - 네트워크 연결성 확인

### 로그 수집
```bash
# 모든 서비스 로그 수집
for pod in $(kubectl get pods -n modernbank -o name); do
  echo "=== $pod ===" >> all-logs.txt
  kubectl logs -n modernbank $pod >> all-logs.txt
  echo "" >> all-logs.txt
done
```

## 업데이트 및 배포

### 이미지 업데이트
```bash
# 특정 서비스 이미지 업데이트
kubectl set image deployment/modernbank-account -n modernbank modernbank-account=216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-account:new-tag

# 롤아웃 상태 확인
kubectl rollout status deployment/modernbank-account -n modernbank
```

### 설정 업데이트
```bash
# ConfigMap 업데이트 후 Pod 재시작
kubectl patch deployment modernbank-account -n modernbank -p '{"spec":{"template":{"metadata":{"annotations":{"date":"'$(date +'%s')'"}}}}}'
```

---

**마지막 업데이트**: 2025-08-07
**문서 버전**: 1.0
