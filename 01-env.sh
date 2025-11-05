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
set -e

export AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query "Account" --output text)
export TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600")
export AWS_REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/dynamic/instance-identity/document | jq -r '.region')
export ECR_REPO=${AWS_ACCOUNT_ID}.dkr.ecr.${AWS_REGION}.amazonaws.com

if grep -q "^export AWS_REGION=" ~/.bashrc; then
    echo "export AWS_REGION=${AWS_REGION}" | sed -i.bak '/^export AWS_REGION=/c\' ~/.bashrc
fi
echo "export AWS_REGION=${AWS_REGION}" >> ~/.bashrc

if grep -q "^export AWS_ACCOUNT_ID=" ~/.bashrc; then
    echo "export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}" | sed -i.bak '/^export AWS_ACCOUNT_ID=/c\' ~/.bashrc
fi
echo "export AWS_ACCOUNT_ID=${AWS_ACCOUNT_ID}" >> ~/.bashrc

if grep -q "^export ECR_REPO=" ~/.bashrc; then
    echo "export ECR_REPO=${ECR_REPO}" | sed -i.bak '/^export ECR_REPO=/c\' ~/.bashrc
fi
echo "export ECR_REPO=${ECR_REPO}" >> ~/.bashrc

# if grep -q "^export JAVA_HOME=" ~/.bashrc; then
#     echo "export JAVA_HOME=${JAVA_HOME}" | sed -i.bak '/^export JAVA_HOME=/c\' ~/.bashrc
# fi
# echo "export JAVA_HOME=${JAVA_HOME}" >> ~/.bashrc

echo "account_id=${AWS_ACCOUNT_ID}, region=${AWS_REGION}"

aws configure set default.region ${AWS_REGION}