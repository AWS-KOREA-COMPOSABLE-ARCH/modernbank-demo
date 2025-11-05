#!/bin/sh

# Configuration
AWS_ACCOUNT_ID="216989108269"
AWS_REGION="ap-northeast-2"
IMAGE_NAME="modernbank-b2bt"
IMAGE_TAG="latest"

# ECR repository URL
ECR_REPO="${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com"

# Build application
./gradlew clean build

# Build and push docker image
docker build -t ${IMAGE_NAME}:${IMAGE_TAG} .
docker tag ${IMAGE_NAME}:${IMAGE_TAG} ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}
docker push ${ECR_REPO}/${IMAGE_NAME}:${IMAGE_TAG}