package com.modernbank.transfer.service;

import java.util.List;

import com.modernbank.transfer.domain.entity.TransferHistory;
import com.modernbank.transfer.domain.entity.TransferLimit;
import com.modernbank.transfer.domain.repository.TransferRepository;
import com.modernbank.transfer.exception.BusinessException;
import com.modernbank.transfer.exception.SystemException;
import com.modernbank.transfer.publisher.TransferProducer;
import com.modernbank.transfer.rest.account.entity.Account;
import com.modernbank.transfer.rest.account.entity.TransactionHistory;
import com.modernbank.transfer.rest.account.entity.TransactionResult;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
// import org.springframework.retry.annotation.CircuitBreaker;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;



@Service("transferService")
public class TransferService {
    
    private static final Logger logger = LoggerFactory.getLogger(TransferService.class);
	
    @Autowired
    TransferRepository transferRepository;
    
    @Autowired
    TransferProducer transferProducer;
    
    @Autowired
    RestTemplate restTemplate;
    
    @Value("${account.api.url}")
    private String accountServiceUrl;
    
    @Value("${customer.api.url}")
    private String customerServiceUrl;

    public int createTransferHistory(TransferHistory transferHistory) throws Exception {
    	return transferRepository.insertTransferHistory(transferHistory);
    }

    @CircuitBreaker(name = "customerService", fallbackMethod = "fallbackRetrieveTransferHistoryList")
    @Retry(name = "customerService")
    public List<TransferHistory> retrieveTransferHistoryList(String cstmId) throws Exception {
        Boolean exists = null;

        exists = restTemplate.getForObject(customerServiceUrl + "/{cstmId}/exists", Boolean.class, cstmId);

        if (exists == null || !exists) {
            throw new BusinessException("ID does not exist.");
        }
        
        TransferHistory transferHistory = new TransferHistory();
        transferHistory.setCstmId(cstmId);
        
        return transferRepository.selectTransferHistoryList(transferHistory);
    }

    public List<TransferHistory> fallbackRetrieveTransferHistoryList(String cstmId, Exception e) {
        logger.error("Failed to retrieve transfer history list for customer: " + cstmId, e);
        throw new SystemException("The following issue occurred while Transfer Service was making a RESTful call to Customer Service to verify customer ID existence.\n" + e.getMessage());
    }

    @Transactional(rollbackFor = Exception.class)
    public int createTransferLimit(TransferLimit transferLimit) throws Exception {
        System.out.println("send transferlimit start...");
    	transferProducer.sendUpdatingTansferLimitMessage(transferLimit);
        System.out.println("send transferlimit done...");
    	return transferRepository.insertTransferLimit(transferLimit);
    }

    public TransferLimit retrieveTransferLimit(String cstmId) throws Exception {
    	TransferLimit transferLimit = new TransferLimit();
    	transferLimit.setCstmId(cstmId);
    	return transferRepository.selectTransferLimit(transferLimit);
    }

    public Long retrieveTotalTransferAmountPerDay(String cstmId) throws Exception {
    	TransferLimit transferLimit = new TransferLimit();
    	transferLimit.setCstmId(cstmId);
        return transferRepository.selectTotalTransferAmountPerDay(transferLimit);
    }
    
	public TransferLimit retrieveEnableTransferLimit(String cstmId) throws Exception {
		TransferLimit transferLimit = retrieveTransferLimit(cstmId);
        if(transferLimit == null)
            throw new BusinessException("Failed to retrieve transfer limit.");
        else {
            Long totalTransferAmountPerDay = retrieveTotalTransferAmountPerDay(cstmId);
            if(totalTransferAmountPerDay < 0)
                throw new BusinessException("Failed to retrieve total transfer amount per day.");
            else {
                Long remaingOneDayTransferLimit = transferLimit.getOneDyTrnfLmt() - totalTransferAmountPerDay;
                transferLimit.setOneDyTrnfLmt(remaingOneDayTransferLimit);
                return transferLimit;
            }
        }
	}

    @Transactional(rollbackFor = Exception.class)
    public TransferHistory transfer(TransferHistory transferHistory) throws Exception {
        String dpstAcntNo = transferHistory.getDpstAcntNo();
        String rcvCstmNm;
        String wthdAcntNo = transferHistory.getWthdAcntNo();
        Long trnfAmt = transferHistory.getTrnfAmt();
        String rcvMm = transferHistory.getRcvMm();
        String sndMm = transferHistory.getSndMm();
        String cstmId = transferHistory.getCstmId();
        int seq = retrieveMaxSeq(cstmId) + 1;
        
        Account depositAccountInfo = retrieveAccountInfo(dpstAcntNo);
        rcvCstmNm = depositAccountInfo.getCstmNm();
        
        transferHistory.setRcvCstmNm(rcvCstmNm);
        transferHistory.setSeq(seq);
        transferHistory.setDivCd("D");
        transferHistory.setStsCd("1");
        createTransferHistory(transferHistory);
        
        // 내부 이체의 경우 '0' 즉, 팬딩 처리 없이 바로 출금 성공 처리(1)를 한다.
        performWithdrawal(wthdAcntNo, trnfAmt, sndMm,transferHistory.getDivCd(), transferHistory.getStsCd());

        performDeposit(dpstAcntNo, trnfAmt, rcvMm);

        transferHistory.setStsCd("3");
        createTransferHistory(transferHistory);
        transferProducer.sendCQRSTransferMessage(transferHistory);
            
        TransferHistory transferResult = new TransferHistory();
        transferResult.setWthdAcntNo(wthdAcntNo);
        transferResult.setDpstAcntNo(dpstAcntNo);
        transferResult.setRcvCstmNm(rcvCstmNm);
        transferResult.setTrnfAmt(trnfAmt);
        transferResult.setRcvMm(rcvMm);
        transferResult.setSndMm(sndMm);
        
        return transferResult;
    }

    @CircuitBreaker(name = "accountService", fallbackMethod = "fallbackRetrieveAccountInfo")
    @Retry(name = "accountService")
    private Account retrieveAccountInfo(String acntNo) {
        return restTemplate.getForObject(accountServiceUrl + "/{acntNo}", Account.class, acntNo);
    }

    private Account fallbackRetrieveAccountInfo(String acntNo, Exception e) {
        logger.error("Failed to retrieve account info for account number: " + acntNo, e);
        throw new SystemException("The following issue occurred while Transfer Service was making a RESTful call to Account Service to retrieve account information.\n" + e.getMessage());
    }

    @CircuitBreaker(name = "accountService", fallbackMethod = "fallbackPerformWithdrawal")
    @Retry(name = "accountService")
    private void performWithdrawal(String acntNo, Long amount, String branch) {
        performWithdrawal(acntNo, amount, branch, null, null);
    }
    
    @CircuitBreaker(name = "accountService", fallbackMethod = "fallbackPerformWithdrawal")
    @Retry(name = "accountService")
    private TransactionResult performWithdrawal(String acntNo, Long amount, String branch, String divCd, String stsCd) {
        TransactionHistory.TransactionHistoryBuilder builder = TransactionHistory.builder()
        .acntNo(acntNo)
        .trnsAmt(amount)
        .trnsBrnch(branch);

        if (divCd != null) {
            builder.divCd(divCd);
        }
        if (stsCd != null) {
            builder.stsCd(stsCd);
        }

        TransactionHistory transaction = builder.build();
        
        return restTemplate.postForObject(accountServiceUrl + "/withdrawals/", transaction, TransactionResult.class);
    }

    private void fallbackPerformWithdrawal(String acntNo, Long amount, String branch, Exception e) {
        logger.error("Failed to perform withdrawal for account: " + acntNo, e);
        throw new SystemException("The following issue occurred while Transfer Service was making a RESTful call to Account Service to perform withdrawal.\n" + e.getMessage());
    }

    @CircuitBreaker(name = "accountService", fallbackMethod = "fallbackPerformDeposit")
    @Retry(name = "accountService")
    private void performDeposit(String acntNo, Long amount, String branch) {
        TransactionHistory transaction = TransactionHistory.builder()
            .acntNo(acntNo)
            .trnsAmt(amount)
            .trnsBrnch(branch)
            .build();
        restTemplate.postForObject(accountServiceUrl + "/deposits/", transaction, TransactionResult.class);
    }

    private void fallbackPerformDeposit(String acntNo, Long amount, String branch, Exception e) {
        logger.error("Failed to perform deposit for account: " + acntNo, e);
        throw new SystemException("The following issue occurred while Transfer Service was making a RESTful call to Account Service to perform deposit.\n" + e.getMessage());
    }

    @Transactional(rollbackFor = Exception.class)
    public Boolean interBankTransfer(TransferHistory transfer) throws Exception {
        String wthdAcntNo = transfer.getWthdAcntNo();
        Long trnfAmt = transfer.getTrnfAmt();
        String sndMm = transfer.getSndMm();
        transfer.setRcvCstmNm("Amazon Web Services");
        String cstmId = transfer.getCstmId();
        int seq = retrieveMaxSeq(cstmId) + 1;
        
        transfer.setSeq(seq);
        transfer.setDivCd("W");        
        // TB_TRNF_HST 테이블에 이체 이력 남기기
        createTransferHistory(transfer);
        
        // Account Service에 고객 계좌에서 타행 이체 금액 인출
        // TransactionResult withdrawResult = performWithdrawalForBtob(wthdAcntNo, trnfAmt, sndMm, transfer.getDivCd(), transfer.getStsCd());
        TransactionResult withdrawResult = performWithdrawal(wthdAcntNo, trnfAmt, sndMm, transfer.getDivCd(), transfer.getStsCd());
        
        if (withdrawResult == null) {
            throw new SystemException("Failed to receive withdrawal result.");
        }
        
        int wthdAcntSeq = withdrawResult.getSeq();
        transfer.setWthdAcntSeq(wthdAcntSeq);
        // Bank to bank Transfer(타행이체 서비스) 서비스에 이체 정보 보내기
        transferProducer.sendB2BTransferMessage(transfer);
        transferProducer.sendCQRSTransferMessage(transfer);
            
        return true;
    }

    private int retrieveMaxSeq(String cstmId) throws Exception {
        TransferHistory transferHistory = new TransferHistory();
        transferHistory.setCstmId(cstmId);
        return transferRepository.selectMaxSeq(transferHistory);
    }
}
