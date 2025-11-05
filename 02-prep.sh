## Copyright 2025 Amazon.com, Inc. or its affiliates. All Rights Reserved.
##
## Permission is hereby granted, free of charge, to any person obtaining a copy of this
## software and associated documentation files (the "Software"), to deal in the Software
## without restriction, including without limitation the rights to use, copy, modify,
## merge, publish, distribute, sublicense, and/or sell copies of the Software, and to
## permit persons to whom the Software is furnished to do so.
##
## THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED,
## INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
## PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
## HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
## OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
## SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
##
#
##title           01-prep.sh
##summary         This script sets up environment variables and tools required for the workshop. 
##description     This script populate environment variables, create necesary container image registry, kubernetes namespaces
##author          Sanghoon Han
##contributors    @hanshoon
##date            2025-03-20
##version         1.0
##usage           sh 01-prep.sh
##==============================================================================

#!/bin/bash
aws eks update-kubeconfig --name $(aws eks list-clusters --output json | jq -r '.clusters[0]')
kubectl create namespace modernbank

aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${AWS_ACCOUNT_ID}.dkr.ecr.ap-northeast-2.amazonaws.com

# git clone https://github.com/AWS-KOREA-COMPOSABLE-ARCH/modernbank-demo
find . -name "containerize.sh" -type f -exec sed -i '/AWS_ACCOUNT_ID=/d; /AWS_REGION=/d; /ECR_REPO=/d' {} +