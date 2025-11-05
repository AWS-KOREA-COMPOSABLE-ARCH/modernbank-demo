# Modern Bank Service Operations Guide

## Overview
Modern Bank is a digital banking platform built with microservices architecture. Each service is deployed independently and operates in a Kubernetes environment.

## EKS Cluster Information

### Cluster Metadata
- **Cluster Name**: `CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c`
- **Cluster ARN**: `arn:aws:eks:ap-northeast-2:940928349059:cluster/CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c`
- **Region**: `ap-northeast-2`
- **Kubernetes Version**: `1.32`
- **Endpoint**: `https://F1BB6125081C56AB84AE28A6893227A5.gr7.ap-northeast-2.eks.amazonaws.com`
- **Status**: `ACTIVE`

### Network Configuration
- **VPC ID**: `vpc-0ba156d998a0d2aa9`
- **VPC CIDR**: `10.0.0.0/16`
- **Subnets**: 
  - `subnet-0403d069361abb8d8`
  - `subnet-05e8439549016d6a7`
- **Security Group**: `sg-0a23e002a8592b16f`
- **Service IPv4 CIDR**: `172.20.0.0/16`

### Access Information
```bash
# Set kubectl context
kubectl config current-context
# arn:aws:eks:ap-northeast-2:940928349059:cluster/CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c

# Configure EKS cluster access
aws eks update-kubeconfig --region ap-northeast-2 --name CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c
```

## Modern Bank Service Architecture

### 1. Account Service (modernbank-account)
- **Features**: Account inquiry, account creation, balance inquiry, transaction history management
- **Port**: 8081
- **Namespace**: modernbank
- **ECR Image**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-account:latest`
- **Endpoint**: `/modernbank/account`
- **Key APIs**:
  - `GET /{acntNo}` - Account inquiry
  - `POST /` - Account creation
  - `GET /customer/{cstmId}/accounts` - Customer account list
  - `GET /{acntNo}/balance` - Balance inquiry

### 2. Bank-to-Bank Transfer Service (modernbank-b2bt)
- **Features**: Inter-bank transfer processing
- **Port**: 8082
- **Namespace**: modernbank
- **ECR Image**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-b2bt:latest`
- **Endpoint**: `/modernbank/b2bt`

### 3. Customer Management Service (modernbank-customer)
- **Features**: Customer information management, customer registration, customer inquiry
- **Port**: 8083
- **Namespace**: modernbank
- **ECR Image**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-customer:latest`
- **Endpoint**: `/modernbank/customer`
- **Key APIs**:
  - `POST /` - Customer registration
  - `GET /{cstmId}` - Basic customer information inquiry
  - `GET /{cstmId}/details` - Detailed customer information inquiry
  - `GET /{cstmId}/exists` - Customer existence check

### 4. CQRS Service (modernbank-cqrs)
- **Features**: Command Query Responsibility Segregation pattern implementation, customer information query optimization
- **Port**: 8084
- **Namespace**: modernbank
- **ECR Image**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-cqrs:latest`
- **Endpoint**: `/modernbank/cqrs`
- **Key APIs**:
  - `GET /customers/{cstmId}/details` - Customer detailed information inquiry
  - `POST /customer` - Customer information storage (DynamoDB)
  - `GET /customer/{id}` - Customer information inquiry (DynamoDB)

### 5. Internal Transfer Service (modernbank-transfer)
- **Features**: Intra-bank account transfers, transfer limit management, transfer history management
- **Port**: 8085
- **Namespace**: modernbank
- **ECR Image**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-transfer:latest`
- **Endpoint**: `/modernbank/transfer`
- **Key APIs**:
  - `POST /internal` - Internal bank transfer
  - `POST /external` - External bank transfer

### 6. Product Service (modernbank-product)
- **Features**: Financial product management
- **Port**: 8086
- **Namespace**: modernbank
- **ECR Image**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-product:latest`
- **Endpoint**: `/modernbank/product`

### 7. User Service (modernbank-user)
- **Features**: User authentication, user management (implemented in Go)
- **Port**: 8091
- **Namespace**: modernbank
- **ECR Image**: `216989108269.dkr.ecr.ap-northeast-2.amazonaws.com/modernbank-user:latest`
- **Endpoint**: `/modernbank/user`
- **Key Features**:
  - User creation
  - Password change
  - User authentication

## Database Information

### RDS Aurora PostgreSQL Clusters
Each service uses independent database clusters.

#### 1. Account Service DB
- **Cluster Identifier**: `modernbank-account`
- **Endpoint**: `modernbank-account.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **Instance Endpoint**: `modernbank-account-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **Engine**: Aurora PostgreSQL 14.13
- **Username**: postgres
- **Password**: admin1234

#### 2. CQRS Service DB
- **Cluster Identifier**: `modernbank-cqrs`
- **Endpoint**: `modernbank-cqrs.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **Instance Endpoint**: `modernbank-cqrs-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **Engine**: Aurora PostgreSQL 14.13
- **Username**: postgres
- **Password**: admin1234

#### 3. Customer Service DB
- **Cluster Identifier**: `modernbank-customer`
- **Endpoint**: `modernbank-customer.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **Instance Endpoint**: `modernbank-customer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **Engine**: Aurora PostgreSQL 14.13
- **Username**: postgres
- **Password**: admin1234

#### 4. Transfer Service DB
- **Cluster Identifier**: `modernbank-transfer`
- **Endpoint**: `modernbank-transfer.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **Instance Endpoint**: `modernbank-transfer-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **Engine**: Aurora PostgreSQL 14.17
- **Username**: postgres
- **Password**: admin1234

#### 5. User Service DB
- **Cluster Identifier**: `modernbank-user`
- **Endpoint**: `modernbank-user.cluster-c7swosasgem4.ap-northeast-2.rds.amazonaws.com`
- **Instance Endpoint**: `modernbank-user-instance-1.cre4cy420rgv.ap-northeast-2.rds.amazonaws.com`
- **Engine**: Aurora PostgreSQL 14.17
- **Username**: postgres
- **Password**: admin1234

## Message Queue (MSK) Information

### Amazon MSK Cluster
- **Cluster Name**: `composable-bank-kafka-cluster`
- **Cluster ARN**: `arn:aws:kafka:ap-northeast-2:940928349059:cluster/composable-bank-kafka-cluster/717af7a2-743b-4a9d-94eb-f37dad2b17f3-3`
- **Kafka Version**: 3.6.0
- **Broker Count**: 4
- **Instance Type**: kafka.m5.large
- **Status**: ACTIVE

#### Broker Endpoints
```
b-1.composablebankkaf.x78vwx.c3.kafka.ap-northeast-2.amazonaws.com:9092
b-2.composablebankkaf.x78vwx.c3.kafka.ap-northeast-2.amazonaws.com:9092
b-4.composablebankkaf.x78vwx.c3.kafka.ap-northeast-2.amazonaws.com:9092
```

#### Endpoints Used in ConfigMap
```
b-1.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
b-2.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
b-3.composablebankkaf.8wl1f1.c2.kafka.ap-northeast-2.amazonaws.com:9092
```

## Load Balancer Information

### Application Load Balancer (ALB)
- **DNS Name**: `internal-k8s-modernbank-05673ec9de-1781820563.ap-northeast-2.elb.amazonaws.com`
- **Scheme**: Internal (VPC internal access only)
- **Target Type**: IP
- **Group Name**: modernbank

### Service Paths
- Account: `/modernbank/account`
- B2BT: `/modernbank/b2bt`
- Customer: `/modernbank/customer`
- CQRS: `/modernbank/cqrs`
- Transfer: `/modernbank/transfer`
- Product: `/modernbank/product`
- User: `/modernbank/user`

## Deployment and Operations

### Deployment Script
```bash
# Deploy all services
cd /home/ec2-user/environment/modernbank-demo/k8s
./apply.sh
```

### Key Operational Commands

#### Service Status Check
```bash
# Check all resources
kubectl get all -n modernbank

# Check specific service status
kubectl get pods -n modernbank -l app=modernbank-account

# Check service logs
kubectl logs -n modernbank deployment/modernbank-account -f
```

#### Service Scaling
```bash
# Adjust replica count
kubectl scale deployment modernbank-account -n modernbank --replicas=3
```

#### ConfigMap Check
```bash
# Check service configuration
kubectl get configmap modernbank-services-cm -n modernbank -o yaml
```

## Monitoring and Health Checks

### Health Check Endpoints
Each service provides health checks at the following path:
- `/modernbank/{service-name}/actuator`

### Log Locations
- **Application Logs**: Kubernetes pod logs
- **Access Logs**: ALB access logs

## Security Information

### Service Accounts
Each service uses independent ServiceAccounts:
- `modernbank-account-sa`
- `modernbank-b2bt-sa`
- `modernbank-customer-sa`
- `modernbank-cqrs-sa`
- `modernbank-transfer-sa`
- `modernbank-user-sa`

### JWT Secret
- JWT secret stored in ConfigMap: `67EL7cJ0U4OJ1wdqt+2w3Nqvy5HB9wwhx+DMsXMz9aY=`

## Troubleshooting

### Common Problem Resolution

#### 1. Service Access Issues
```bash
# Check service status
kubectl get svc -n modernbank

# Check endpoints
kubectl get endpoints -n modernbank

# Check Ingress status
kubectl get ingress -n modernbank
```

#### 2. Database Connection Issues
```bash
# Check ConfigMap
kubectl describe configmap modernbank-services-cm -n modernbank

# Check pod environment variables
kubectl exec -n modernbank deployment/modernbank-account -- env | grep POSTGRES
```

#### 3. Pod Restart Issues
```bash
# Check pod events
kubectl describe pod -n modernbank <pod-name>

# Check pod logs
kubectl logs -n modernbank <pod-name> --previous
```

## Contact and Support

### Operations Team Information
- **AWS Account ID**: 940928349059
- **Region**: ap-northeast-2 (Seoul)
- **Environment**: Production

### Important Resource ID Summary
- **EKS Cluster**: CoreBankEKSCluster9100A293-46482c78511b4d72af5005dd64af1e8c
- **VPC**: vpc-0ba156d998a0d2aa9
- **MSK Cluster**: composable-bank-kafka-cluster
- **ALB**: internal-k8s-modernbank-05673ec9de-1781820563.ap-northeast-2.elb.amazonaws.com

---
*Last Updated: 2025-10-30*
