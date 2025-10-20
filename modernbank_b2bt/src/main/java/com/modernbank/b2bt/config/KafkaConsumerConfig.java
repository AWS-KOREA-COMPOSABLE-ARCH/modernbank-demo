package com.modernbank.b2bt.config;

import java.util.HashMap;
import java.util.Map;

import com.modernbank.b2bt.domain.TransferHistory;

import org.apache.kafka.clients.consumer.ConsumerConfig;
import org.apache.kafka.common.serialization.StringDeserializer;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.config.ConcurrentKafkaListenerContainerFactory;
import org.springframework.kafka.core.ConsumerFactory;
import org.springframework.kafka.core.DefaultKafkaConsumerFactory;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.ContainerProperties.AckMode;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.support.serializer.JsonDeserializer;
import org.springframework.util.backoff.FixedBackOff;

@EnableKafka
@Configuration
public class KafkaConsumerConfig {

    @Value(value = "${kafka.bootstrapAddress}")
    private String bootstrapAddress;

    public ConsumerFactory<String, TransferHistory> b2bTransferConsumerFactory() {
        Map<String, Object> props = new HashMap<>();
        props.put(ConsumerConfig.BOOTSTRAP_SERVERS_CONFIG, bootstrapAddress);
        props.put(ConsumerConfig.GROUP_ID_CONFIG, "b2bTransfer");
        props.put(ConsumerConfig.KEY_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.VALUE_DESERIALIZER_CLASS_CONFIG, StringDeserializer.class);
        props.put(ConsumerConfig.ENABLE_AUTO_COMMIT_CONFIG,"false");

        return new DefaultKafkaConsumerFactory<>(props, new StringDeserializer(), new JsonDeserializer<>(TransferHistory.class, false));
    }

    @Bean
    public ConcurrentKafkaListenerContainerFactory<String, TransferHistory> b2bTransferKafkaListenerContainerFactory() {
        ConcurrentKafkaListenerContainerFactory<String, TransferHistory> factory = new ConcurrentKafkaListenerContainerFactory<>();
        factory.setConsumerFactory(b2bTransferConsumerFactory());
        factory.getContainerProperties().setAckMode(AckMode.MANUAL_IMMEDIATE);
        /**
        factory.setRecordFilterStrategy(consumerRecord -> {
            long currentTimestamp = System.currentTimeMillis();
            long messageTimestamp = consumerRecord.timestamp();
            // 발행된지 3초가 지난 토픽은 리스너가 무시하도록 설정한다.(for 데모용)
            // Fault Injection Service로 B2BT Service down 시키는 것 대응
            boolean isOld = (currentTimestamp - messageTimestamp > 3000);
            if (isOld) {
                System.out.println("@@@@@@@@@@ Filtering out old message: " + consumerRecord.value());
            }
            return isOld;
        });
        */
        
        // Set up new error handler
        CommonErrorHandler errorHandler = new DefaultErrorHandler(new FixedBackOff(1000L, 2));
        factory.setCommonErrorHandler(errorHandler);
        
        return factory;
    }


}