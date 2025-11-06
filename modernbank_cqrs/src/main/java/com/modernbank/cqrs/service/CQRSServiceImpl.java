package com.modernbank.cqrs.service;

import java.util.List;

import com.modernbank.cqrs.domain.entity.Account;
import com.modernbank.cqrs.domain.entity.Customer;
import com.modernbank.cqrs.domain.repository.CQRSRepository;
import com.modernbank.cqrs.exception.BusinessException;
import com.modernbank.cqrs.exception.SystemException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service("cqrsService")
public class CQRSServiceImpl implements CQRSService{
 
    @Autowired
    CQRSRepository cqrsRepository;

    @Override
    public Customer retrieveCustomerDetail(String cstmId) throws Exception {
        // TODO
    }

    /**
     * Retrieves the account list for a given user ID.
     * @param cstmId
     * @return
     * @throws BusinessException
     * @throws SystemException
     */
    public List<Account> retrieveAccountList(String cstmId) throws Exception {
        List<Account> accountList = null;
        
        accountList= cqrsRepository.selectAccountList(Account.builder().cstmId(cstmId).build());
        
        if (accountList == null || accountList.size() <= 0)
            throw new BusinessException("Failed to retrieve account list information for " + cstmId);
        
        return accountList;
    }
    
    /**
     * Creates user information.
     */
    @Override
    public int createCustomer(Customer customer) throws Exception {
        return cqrsRepository.insertCustomer(customer);
    }

    /**
     * Creates account information.
     */
    @Override
    public int createAccount(Account account) throws Exception {
        return cqrsRepository.insertAccount(account);
    }

    /**
     * Creates transfer information.
     */
    @Override
    public int updateTransferLimit(Customer customer) throws Exception {
        return cqrsRepository.updateTransferLimit(customer);
    }

    /**
     * Updates account balance.
     */
    @Override
    public int updateAccountBalance(Account account) throws Exception {
        return cqrsRepository.updateAccountBalance(account);
    }
    
}