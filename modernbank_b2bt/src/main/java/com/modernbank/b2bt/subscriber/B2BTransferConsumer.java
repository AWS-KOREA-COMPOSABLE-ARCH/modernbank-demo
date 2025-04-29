package com.modernbank.b2bt.subscriber;

import com.modernbank.b2bt.domain.TransferHistory;
import com.modernbank.b2bt.publisher.B2BTransferResultProducer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.kafka.support.Acknowledgment;
import org.springframework.stereotype.Component;

@Component
public class B2BTransferConsumer {
    private final Logger LOGGER = LoggerFactory.getLogger(B2BTransferConsumer.class);

    @Autowired
    B2BTransferResultProducer b2btransferResultProducer;
    
    @KafkaListener(topics = "${b2b.transfer.topic.name}", containerFactory = "b2bTransferKafkaListenerContainerFactory")
    public void b2bTransferListener(TransferHistory transfer, Acknowledgment ack) {
        LOGGER.info("Received Bank-To-Bank message: " + transfer.getWthdAcntNo() + ":" +transfer.getWthdAcntSeq());

		try {
            // 만약 타행 연동 인터페이스가 있다면 이 라인에 구현되어 있어야 하지만, 이 워크샵에서는 실제 타행에 대한 인터페이스는 생략되어 있습니다.
            // 타행 이체가 성공 혹은 실패 했다는 가정하에 그 결과를 다시 Amazon MSK에 비동기식으로 전송합니다.
            b2btransferResultProducer.sendB2BTransferResultMessage(transfer);
            ack.acknowledge();
        } catch(Exception e) {
        	String msg = " A problem occurred while saving the transfer information history.";
            LOGGER.error(transfer.getWthdAcntNo() + msg,e);
            // ack.nack(1000 * 5); Specify listener re-execution time
        }
    }
}