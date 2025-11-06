package com.modernbank.customer.service;

import java.util.List;

import com.modernbank.customer.domain.entity.Customer;
import com.modernbank.customer.domain.repository.CustomerRepository;
import com.modernbank.customer.exception.BusinessException;
import com.modernbank.customer.publisher.CustomerProducer;
import com.modernbank.customer.rest.account.entity.Account;
import com.modernbank.customer.rest.transfer.entity.TransferLimit;
import com.modernbank.customer.security.CookieBaker;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;

@Service("customerService")
public class CustomerService {
    private static final Logger logger = LoggerFactory.getLogger(CustomerService.class);

    @Autowired
    CustomerRepository customerRepository;

    @Autowired
    CustomerProducer customerProducer;

    @Autowired
    RestTemplate restTemplate;

    @Value("${transfer.api.url}")
    private String transferServiceUrl;

    @Value("${account.api.url}")
    private String accountServiceUrl;

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Transactional(rollbackFor = Exception.class)
    public int createCustomer(Customer customer) throws Exception {
        // TODO
    }

    @CircuitBreaker(name = "transferService", fallbackMethod = "fallbackSetTransferLimits")
    @Retry(name = "transferService", fallbackMethod = "fallbackSetTransferLimits")
    private void setTransferLimits(Customer customer) {
        HttpHeaders headers = CookieBaker.buildCookieHeader();
        HttpEntity<TransferLimit> requestEntity = new HttpEntity<>(
            TransferLimit.builder()
                .cstmId(customer.getCstmId())
                .oneDyTrnfLmt(500000000L)
                .oneTmTrnfLmt(500000000L)
                .build(),
            headers
        );

        restTemplate.exchange(
            transferServiceUrl + "/limits",
            HttpMethod.POST,
            requestEntity,
            Integer.class
        );
    }

    private void fallbackSetTransferLimits(Customer customer, Exception e) {
        logger.error("Circuit breaker fallback: Failed to set transfer limits for customer: " + customer.getCstmId(), e);
        // Implement fallback logic here, e.g., set default limits or queue for later retry
    }

    public Customer retrieveCustomer(String cstmId) throws Exception {
        Customer customer = new Customer();
        customer.setCstmId(cstmId);
  
        if (!existsCustomerId(cstmId)) 
            throw new BusinessException("ID does not exist.");

        customer = customerRepository.selectCustomer(customer);

        if (customer == null) 
            throw new BusinessException("Failed to retrieve customer data.");
        
        return customer;
    }

    public Customer retrieveCustomerDetail(String cstmId) throws Exception {
        Customer customer = new Customer();
        customer.setCstmId(cstmId);
        
        if (!existsCustomerId(cstmId)) 
            throw new BusinessException("ID does not exist.");

        customer = customerRepository.selectCustomer(customer);
        if (customer == null) 
            throw new BusinessException("Failed to retrieve customer data.");

        try {
            TransferLimit transferLimit = getTransferLimits(cstmId);
            customer.setOneDyTrnfLmt(transferLimit.getOneDyTrnfLmt());
            customer.setOneTmTrnfLmt(transferLimit.getOneTmTrnfLmt());
        } catch (Exception e) {
            logger.error("Failed to retrieve transfer limits: " + e.getMessage());
            // Continue execution without throwing an exception
        }

        try {
            List<Account> accountList = getAccountList(cstmId);
            customer.addAllAccounts(accountList);
        } catch (Exception e) {
            logger.error("Failed to retrieve account list: " + e.getMessage());
            // Continue execution without throwing an exception
        }
        
        return customer;
    }

    @CircuitBreaker(name = "transferService", fallbackMethod = "fallbackGetTransferLimits")
    @Retry(name = "transferService", fallbackMethod = "fallbackGetTransferLimits")
    private TransferLimit getTransferLimits(String cstmId) {
        HttpHeaders headers = CookieBaker.buildCookieHeader();
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        ResponseEntity<TransferLimit> response = restTemplate.exchange(
            transferServiceUrl + "/limits/{cstmId}",
            HttpMethod.GET,
            requestEntity,
            TransferLimit.class,
            cstmId
        );

        TransferLimit transferLimit = response.getBody();
        if (transferLimit == null) 
            throw new BusinessException("A failure occurred when Customer Service attempted to retrieve transfer limits from Transfer Service using RESTful communication.");

        return transferLimit;
    }

    private TransferLimit fallbackGetTransferLimits(String cstmId, Exception e) {
        logger.error("Circuit breaker fallback: Failed to get transfer limits for customer: " + cstmId, e);
        // Return default transfer limits
        return TransferLimit.builder()
            .cstmId(cstmId)
            .oneDyTrnfLmt(100000000L)
            .oneTmTrnfLmt(100000000L)
            .build();
    }

    @CircuitBreaker(name = "accountService", fallbackMethod = "fallbackGetAccountList")
    @Retry(name = "accountService", fallbackMethod = "fallbackGetAccountList")
    private List<Account> getAccountList(String cstmId) {
        HttpHeaders headers = CookieBaker.buildCookieHeader();
        HttpEntity<Void> requestEntity = new HttpEntity<>(headers);

        ResponseEntity<List<Account>> response = restTemplate.exchange(
            accountServiceUrl + "/customer/{cstmId}/accounts",
            HttpMethod.GET,
            requestEntity,
            new ParameterizedTypeReference<List<Account>>() {},
            cstmId
        );

        List<Account> accountList = response.getBody();
        if (accountList == null) 
            throw new BusinessException("A failure occurred when Customer Service attempted to retrieve account id by customer id(" + cstmId + ")  from Account Service Service using RESTful communication.");

        return accountList;
    }

    private List<Account> fallbackGetAccountList(String cstmId, Exception e) {
        logger.error("Circuit breaker fallback: Failed to get account list for customer: " + cstmId, e);
        // Return an empty list or a default account
        return List.of();
    }

    public boolean existsCustomerId(String cstmId) throws Exception {
        boolean ret = false;
        Customer customer = new Customer();
        customer.setCstmId(cstmId);
        if (customerRepository.existsCustomer(customer) > 0)
            ret = true;
        return ret;
    }
}