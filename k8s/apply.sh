#!/bin/sh
kubectl apply -n modernbank -f .
kubectl apply -n modernbank -f account/
kubectl apply -n modernbank -f b2bt/
kubectl apply -n modernbank -f customer/
kubectl apply -n modernbank -f cqrs/
#kubectl apply -n modernbank -f product/
kubectl apply -n modernbank -f transfer/
kubectl apply -n modernbank -f user/