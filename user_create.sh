#!/bin/bash

# 시스템 패키지 정보 업데이트
sudo dnf update -y

# PostgreSQL 클라이언트 설치 (버전 선택 가능, 기본은 postgresql15)
sudo dnf install -y postgresql15

# 설치 확인
psql --version

# Get the writer endpoint
WRITER_ENDPOINT=$(aws rds describe-db-clusters \
    --db-cluster-identifier modernbank-user \
    --query 'DBClusters[0].DBClusterMembers[?IsClusterWriter==`true`].DBInstanceIdentifier' \
    --output text | xargs -I {} aws rds describe-db-instances \
    --db-instance-identifier {} \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text)

# Create database
psql "postgresql://postgres:postgres1234!@${WRITER_ENDPOINT}/postgres" \
    -c "CREATE DATABASE users;"

# Create table
psql "postgresql://postgres:postgres1234!@${WRITER_ENDPOINT}/users" \
    -c "CREATE TABLE public.tb_user (
        USER_ID character varying(50) NOT NULL,
        PASSWORD_HASH character varying(255) NOT NULL,
        USERNAME character varying(50),
        SALT character varying(255) NOT NULL,
        CREATED_AT timestamp without time zone DEFAULT now()
    );"

# Add primary key
psql "postgresql://postgres:postgres1234!@${WRITER_ENDPOINT}/users" \
    -c "ALTER TABLE ONLY public.tb_user ADD CONSTRAINT tb_user_pkey PRIMARY KEY (user_id);"

# Insert health check data
PGPASSWORD=postgres1234! psql -h ${WRITER_ENDPOINT} -U postgres -d users \
    -c "INSERT INTO public.tb_user (USER_ID, PASSWORD_HASH, USERNAME, SALT, CREATED_AT) 
        VALUES ('HealthCheck', 'HealthCheck', 'HealthCheck', 'HealthCheck', now());"
