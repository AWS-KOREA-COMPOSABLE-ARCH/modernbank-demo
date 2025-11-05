#!/bin/sh
cd ./modernbank_account
./containerize.sh
cd ..
cd ./modernbank_b2bt
./containerize.sh
cd ..
cd ./modernbank_cqrs
./containerize.sh
cd ..
cd ./modernbank_customer
./containerize.sh
cd ..
cd ./modernbank_transfer
./containerize.sh
cd ..
cd ./modernbank_ui
./containerize.sh
cd ..
