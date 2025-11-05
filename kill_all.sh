#!/bin/bash

# 종료할 포트 목록
ports=(8081 8082 8083 8084 8085 8086 8091 8090)

for port in "${ports[@]}"
do
    # 각 포트에서 실행 중인 프로세스의 PID를 찾습니다
    pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]
    then
        echo "포트 $port에서 실행 중인 프로세스(PID: $pid)를 종료합니다."
        kill -9 $pid
        echo "프로세스가 종료되었습니다."
    else
        echo "포트 $port에서 실행 중인 프로세스가 없습니다."
    fi
done

echo "모든 지정된 포트의 프로세스 검사 및 종료가 완료되었습니다."
