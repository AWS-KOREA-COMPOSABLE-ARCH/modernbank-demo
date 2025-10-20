package com.modernbank.account.service;

import java.util.List;

import com.modernbank.account.domain.entity.Account;
import com.modernbank.account.domain.entity.TransactionHistory;
import com.modernbank.account.domain.entity.TransactionResult;
import com.modernbank.account.domain.repository.AccountRepository;
import com.modernbank.account.exception.BusinessException;
import com.modernbank.account.publisher.AccountProducer;
import com.modernbank.account.rest.customer.CustomerComposite;
import com.modernbank.account.rest.customer.entity.Customer;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Service("accountService")
public class AccountService {

    private static final Logger logger = LoggerFactory.getLogger(AccountService.class);

    @Autowired private AccountRepository accountRepository;
    @Autowired private AccountProducer accountProducer;
    @Autowired private CustomerComposite customerComposite;

    public Account retrieveAccount(String acntNo) throws Exception {
        Account account = accountRepository.selectAccount(Account.ofAcntNo(acntNo));

        if (account == null)
            throw new BusinessException("Account number does not exist.");

        return account;
    }

    public boolean existsAccountNumber(String acntNo) throws Exception {
        boolean ret = false;
        
        if (accountRepository.selectAccount(Account.ofAcntNo(acntNo)) != null)
            ret = true;
            
        return ret;
    }

    @Transactional(rollbackFor = Exception.class)
    public Integer createAccount(Account account) throws Exception {
        int result = 0;

        // 1) Verify account number duplication
        if(existsAccountNumber(account.getAcntNo()))
            throw new BusinessException("Account number already exists.");

        // 2) Retrieve customer information (to store 'customer name' in the account table)
        Customer customer = retrieveCustomerWithResilience(account.getCstmId());
        account.setCstmNm(customer.getCstmNm());
        
        // 3) Create account
        result = accountRepository.insertAccount(account);
        accountRepository.insertTransactionHistoryData(TransactionHistory.builder()
                .acntNo(account.getAcntNo())
                .divCd("D")
                .stsCd("1")
                .trnsBrnch("Yeoksam Main Branch")
                .trnsAmt(account.getAcntBlnc())
                .acntBlnc(account.getAcntBlnc())
                .build());

        // 4) Send account information message
        accountProducer.sendCreatingAccountMessage(account);

        return result;
    }

    @CircuitBreaker(name = "customerService", fallbackMethod = "fallbackRetrieveCustomer")
    @Retry(name = "customerService")
    private Customer retrieveCustomerWithResilience(String cstmId) throws Exception {
        return customerComposite.retrieveCustomer(cstmId);
    }

    private Customer fallbackRetrieveCustomer(String cstmId, Exception e) {
        logger.error("Failed to retrieve customer information. Using fallback for customer ID: " + cstmId, e);
        return Customer.builder()
                .cstmId(cstmId)
                .cstmNm("Unknown Customer")
                .build();
    }

    public List<Account> retrieveAccountList(String cstmId) throws Exception {
        return accountRepository.selectAccountList(Account.ofCstmId(cstmId));
    }

    public Long retrieveAccountBalance(String acntNo) throws Exception {
        TransactionHistory transactionHistory = TransactionHistory.builder()
                .acntNo(acntNo).build();

        Long balance = accountRepository.selectCurrentAccountBalance(transactionHistory);

        if (balance == null)
            return 0L;
        else
            return balance;
    }

    @Transactional(rollbackFor = Exception.class)
    public int createTransactionHistory(TransactionHistory transactionHistory) throws Exception {
        return accountRepository.insertTransactionHistoryData(transactionHistory);
    }

    public List<TransactionHistory> retrieveTransactionHistoryList(String acntNo) throws Exception {
        return accountRepository.selectTransactionHistoryList(TransactionHistory.ofAcntNo(acntNo));
    }

    @Transactional(rollbackFor = Exception.class)
    public TransactionResult deposit(TransactionHistory transactionHistory) throws Exception {
        String acntNo = transactionHistory.getAcntNo();
        Long trnsAmt = transactionHistory.getTrnsAmt();

        // 1) Retrieve account balance
        Long acntBlnc = retrieveAccountBalance(acntNo);

        // 2) Create deposit transaction history
        transactionHistory.setAcntBlnc(acntBlnc + trnsAmt);
        transactionHistory.setDivCd("D");
        transactionHistory.setStsCd("1");
        createTransactionHistory(transactionHistory);

        // 3) Send deposit transaction history message
        accountProducer.sendTransactionMessage(transactionHistory);

        // 4) Send updated balance account information message
        Account account = Account.of(acntNo, transactionHistory.getAcntBlnc());
        accountProducer.sendUpdatingAccountBalanceMessage(account);

        TransactionResult transactionResult = TransactionResult.builder()
                .acntNo(acntNo)
                .seq(transactionHistory.getSeq())  // Store seq assigned when creating transaction history
                .formerBlnc(acntBlnc)
                .trnsAmt(trnsAmt)
                .acntBlnc(transactionHistory.getAcntBlnc())
                .build();

        return transactionResult;
    }

    @Transactional(rollbackFor = Exception.class)
    public TransactionResult withdrawOwnBankOrTransferOtherBank(TransactionHistory transactionHistory) throws Exception {
        String acntNo = transactionHistory.getAcntNo();
        Long trnsAmt = transactionHistory.getTrnsAmt();

        // 1) Retrieve account balance
        Long acntBlnc = retrieveAccountBalance(acntNo);

        // 2) Check if withdrawal is possible
        if (acntBlnc < trnsAmt)
            throw new BusinessException("Insufficient account balance.");
        // 3) Create withdrawal transaction history
        transactionHistory.setAcntBlnc(acntBlnc - trnsAmt);

        createTransactionHistory(transactionHistory);

        // 4) Send withdrawal transaction history message
        accountProducer.sendTransactionMessage(transactionHistory);

        /*********
         * 아래 코드가 CQRS에 데이터를 넘기는 코드인데, 
         * pending시 주석처리해야 할지 그냥 넘길지 확인 요
         */
        // 5) Send updated balance account information message
        Account account = Account.of(acntNo, transactionHistory.getAcntBlnc());
        accountProducer.sendUpdatingAccountBalanceMessage(account);

        TransactionResult transactionResult = TransactionResult.builder()
                .acntNo(acntNo)
                .seq(transactionHistory.getSeq())  // Store seq assigned when creating transaction history
                .formerBlnc(acntBlnc)
                .trnsAmt(trnsAmt)
                .acntBlnc(transactionHistory.getAcntBlnc())
                .build();

        return transactionResult;
    }


    @Transactional(rollbackFor = Exception.class)
    public int processExternalTransferConfirmation(TransactionHistory transactionHistory) throws Exception {
        // 1) Update transaction history to withdrawal success status
        int result = accountRepository.updateTransactionHistory(transactionHistory);

        // 2) Retrieve account balance after withdrawal success
        Long acntBlnc = retrieveAccountBalance(transactionHistory.getAcntNo());

        // 3) Send withdrawal success transaction history message
        accountProducer.sendTransactionMessage(transactionHistory);

        // 4) Send updated balance account information message
        Account account = Account.of(transactionHistory.getAcntNo(), acntBlnc);
        accountProducer.sendUpdatingAccountBalanceMessage(account);

        return result;
    }

    public int retrieveMaxSeq(String acntNo) throws Exception {
        return accountRepository.selectMaxSeq(TransactionHistory.ofAcntNo(acntNo));
    }
}