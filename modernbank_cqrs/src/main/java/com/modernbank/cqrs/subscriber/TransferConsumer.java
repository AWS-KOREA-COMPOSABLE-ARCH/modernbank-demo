package com.modernbank.cqrs.subscriber;

import com.modernbank.cqrs.domain.entity.Customer;
import com.modernbank.cqrs.exception.SystemException;
import com.modernbank.cqrs.service.CQRSService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

import jakarta.annotation.Resource;

@Component
public class TransferConsumer {
    
    @Resource(name = "cqrsService")
    private CQRSService cqrsService;
    private final Logger LOGGER = LoggerFactory.getLogger(TransferConsumer.class);
    
    /**
     * Updates the transfer information.
     * @param customer
     * @throws SystemException
     */
    @KafkaListener(topics = "${updating.transfer.limit.topic.name}", containerFactory = "transferLimitKafkaListenerContainerFactory")
    public void updatingTransferLimitListener(Customer customer, Acknowledgment ack) {
        // TODO
    }
}