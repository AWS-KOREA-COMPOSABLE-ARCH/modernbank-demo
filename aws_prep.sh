#!/bin/sh
aws ecr get-login-password --region ap-northeast-2 | \
    docker login --username AWS --password-stdin \
    216989108269.dkr.ecr.ap-northeast-2.amazonaws.com
