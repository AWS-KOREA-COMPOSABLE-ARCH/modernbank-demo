package com.modernbank.cqrs.subscriber;

import com.modernbank.cqrs.domain.entity.Account;
import com.modernbank.cqrs.exception.SystemException;
import com.modernbank.cqrs.service.CQRSService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;

@Component
public class AccountConsumer {
    @Resource(name = "cqrsService")
    private CQRSService cqrsService;
    private final Logger LOGGER = LoggerFactory.getLogger(AccountConsumer.class);

    
    @KafkaListener(topics = "${creating.account.topic.name}", containerFactory = "accountKafkaListenerContainerFactory")
    public void creatingAccountListener(Account account, Acknowledgment ack) {
        // TODO
    }
    
    /**
     * Update account balance
     * @param account
     * @throws SystemException
     */
    @KafkaListener(topics = "${updating.account.balance.topic.name}", containerFactory = "accountKafkaListenerContainerFactory")
    public void updatingAccountBalanceListener(Account account, Acknowledgment ack) {
        LOGGER.info("Received updating account balance message: " + account.getAcntNo());
        
        try {
            cqrsService.updateAccountBalance(account);
            ack.acknowledge();
        } catch(Exception e) {
            String msg = " A problem occurred while updating the account balance.";
            LOGGER.error(account.getAcntNo() + msg, e);
        } 
    }
    
}