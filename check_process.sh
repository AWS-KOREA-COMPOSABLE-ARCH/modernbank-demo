#!/bin/bash

# 검사할 포트 목록
ports=(8081 8082 8083 8084 8085 8086 8091 8090)

echo "포트    PID     명령어"
echo "-------------------------"

for port in "${ports[@]}"
do
    # 각 포트에서 실행 중인 프로세스의 PID를 찾습니다
    pid=$(lsof -ti:$port)
    
    if [ ! -z "$pid" ]
    then
        # PID에 해당하는 명령어를 가져옵니다
        command=$(ps -p $pid -o comm=)
        printf "%-7s %-7s %s\n" "$port" "$pid" "$command"
    else
        printf "%-7s %-7s %s\n" "$port" "-" "실행 중인 프로세스 없음"
    fi
done

echo "-------------------------"
echo "검사가 완료되었습니다."
