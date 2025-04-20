package com.modernbank.transfer.subscriber;

import com.modernbank.transfer.domain.entity.TransferHistory;
import com.modernbank.transfer.exception.SystemException;
import com.modernbank.transfer.publisher.TransferProducer;
import com.modernbank.transfer.rest.account.entity.TransactionHistory;
import com.modernbank.transfer.service.TransferService;
import com.modernbank.transfer.utils.ObjectToJsonConverter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import jakarta.annotation.Resource;

@Component
public class B2BTransferResultConsumer {
    
    private final Logger LOGGER = LoggerFactory.getLogger(B2BTransferResultConsumer.class);
    
    @Resource(name = "transferService")
    private TransferService transferService;
    
    @Autowired
    TransferProducer transferProducer;
    
    @Autowired
    RestTemplate restTemplate;
    
    @Value("${account.api.url}")
    private String accountServiceUrl;
    
    @KafkaListener(topics = "${b2b.transfer.result.topic.name}", containerFactory = "b2bTransferResultKafkaListenerContainerFactory")
    public void b2bTransferResultListener(TransferHistory transferResult, Acknowledgment ack) throws Exception {
        LOGGER.info("====> Start b2bTransferResultListener at Transfer Service: \n" +ObjectToJsonConverter.convertSettersToJson(transferResult) + "\n");
    
        String statusCode = transferResult.getStsCd();

        LOGGER.info("[===>]statusCode:" + statusCode);
    
        try {
            LOGGER.info("====> Starting compensation transaction call due to inter-bank transfer failure. ");
            String wthdAcntNo = transferResult.getWthdAcntNo();
            int wthdAcntSeq = transferResult.getWthdAcntSeq();

            TransactionHistory transactionHistory = TransactionHistory.builder()
                .acntNo(wthdAcntNo)
                .seq(wthdAcntSeq)
                .divCd("2")
                // 임의의 이체 실패시 화면에서 status 값이 "2" 인 경우 보상트랜잭션, 그렇지 않은 경우 타행이체 확정처리
                .stsCd(statusCode.equals("2") ? "2" : "1")     
                .build();

            restTemplate.postForObject(
                accountServiceUrl + "/withdrawals/confirm/",
                transactionHistory,
                Integer.class
            );
            LOGGER.info("====> Ending compensation transaction call due to inter-bank transfer failure. ");
            
            transferService.createTransferHistory(transferResult);
            
            // CQRS
            transferProducer.sendCQRSTransferMessage(transferResult);

            LOGGER.info("====> End b2bTransferResultListener at Transfer Service: \n" +ObjectToJsonConverter.convertSettersToJson(transferResult) + "\n");

            ack.acknowledge(); // Only change the read offset value of Kafka after all CRUD operations are completed.
        } catch (Exception e) {
            String msg = "An unexpected problem occurred in the system";
            LOGGER.error(msg, e);
            throw new SystemException(msg);
        } 
    }
}