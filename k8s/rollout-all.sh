#!/bin/sh
kubectl rollout restart  -n modernbank deployment/modernbank-account
kubectl rollout restart  -n modernbank deployment/modernbank-b2bt
kubectl rollout restart  -n modernbank deployment/modernbank-cqrs
kubectl rollout restart  -n modernbank deployment/modernbank-customer
kubectl rollout restart  -n modernbank deployment/modernbank-product
kubectl rollout restart  -n modernbank deployment/modernbank-transfer
# kubectl rollout restart  -n modernbank deployment/modernbank-ui
kubectl rollout restart  -n modernbank deployment/modernbank-user