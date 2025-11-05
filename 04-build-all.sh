## 소스코드 다운로드 후 빌드를 실행해야 한다. 워크샵에서 가이드 순서는 
## 소스코드 다운로드 먼저.

#!/bin/sh
cd modernbank_account
./containerize.sh
cd ..
cd modernbank_b2bt
./containerize.sh
cd ..
cd modernbank_cqrs
./containerize.sh
cd ..
cd modernbank_customer
./containerize.sh
cd ..
cd modernbank_product
./containerize.sh
cd ..
cd modernbank_transfer
./containerize.sh
cd ..
# cd modernbank_ui
# ./containerize.sh
# cd ..
cd modernbank_user
./containerize.sh
cd ..