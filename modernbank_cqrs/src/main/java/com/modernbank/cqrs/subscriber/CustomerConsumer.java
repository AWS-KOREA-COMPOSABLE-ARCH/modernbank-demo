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
public class CustomerConsumer {
    
    @Resource(name = "cqrsService")
    private CQRSService cqrsService;
    private final Logger LOGGER = LoggerFactory.getLogger(CustomerConsumer.class);
    
    /**
     * Create customer data and customer history data
     * @param customer
     * @throws SystemException
     */
    @KafkaListener(topics = "${creating.customer.topic.name}", containerFactory = "customerKafkaListenerContainerFactory")
    public void creatingCustomerListener(Customer customer, Acknowledgment ack) {
        // TODO
    }
    
}