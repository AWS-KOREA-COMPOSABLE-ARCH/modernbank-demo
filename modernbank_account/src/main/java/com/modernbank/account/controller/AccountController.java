package com.modernbank.account.controller;

import java.util.List;

import com.modernbank.account.domain.entity.Account;
import com.modernbank.account.domain.entity.TransactionHistory;
import com.modernbank.account.domain.entity.TransactionResult;
import com.modernbank.account.service.AccountService;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.annotation.Resource;

@RestController
public class AccountController {

    @Autowired
    @Resource(name = "accountService")
    private AccountService accountService;
    
    @Operation(summary = "Account Inquiry", method = "GET", description = "Retrieve account information")
    @GetMapping("/{acntNo}")
    public Account retrieveAccount(@PathVariable(name = "acntNo") String acntNo) throws Exception {
        return accountService.retrieveAccount(acntNo);
    }

    @Operation(summary = "Account Registration", method = "POST", description = "Register a new account")
    @PostMapping("/")
    public Integer createAccount(@RequestBody Account account) throws Exception {
        return accountService.createAccount(account);
    }

    @Operation(summary = "Account List Inquiry", method = "GET", description = "Retrieve list of accounts for a customer")
    @GetMapping("/customer/{cstmId}/accounts")
    public List<Account> retrieveAccountList(@PathVariable(name = "cstmId") String cstmId) throws Exception {
        return accountService.retrieveAccountList(cstmId);
    }

    @Operation(summary = "Account Balance Inquiry", method = "GET", description = "Retrieve account balance")
    @GetMapping("/{acntNo}/balance")
    public Long retrieveAccountBalance(@PathVariable(name = "acntNo") String acntNo) throws Exception {
        return accountService.retrieveAccountBalance(acntNo);
    }

    @Operation(summary = "Deposit", method = "POST", description = "Make a deposit")
    @PostMapping("/deposits/")
    public TransactionResult deposit(@RequestBody TransactionHistory input) throws Exception {
        return accountService.deposit(input);
    }

    @Operation(
        summary = "Process withdrawal or transfer",
        description = """
            Process withdrawal or transfer transaction.
            
            Required status codes (stsCd):
            - For own bank withdrawal/transfer: must send "1" (success)
            - For other bank transfer: must send "0" (pending)
            
            The status code is mandatory and must follow these rules for proper transaction processing.
        """,
        method = "POST"
    )
    @PostMapping("/withdrawals/")
    public TransactionResult withdrawal(@RequestBody TransactionHistory input) throws Exception {
        System.out.println("==> AccountController.withdrawal()");
        System.out.println("DivCD: " + input.getDivCd() + ", StatusCD: " + input.getStsCd()); 
        //DivCd 정의할 것
        return accountService.withdrawOwnBankOrTransferOtherBank(input);
    }

    @Operation(
        summary = "Confirm other bank transfer result",
        description = """
            Process final confirmation for other bank transfer result.
            
            Required status codes (stsCd):
            - "1": Confirm withdrawal - Finalizes the transfer as successful
            - "2": Cancel withdrawal - Transfer failed, triggers compensation transaction to rollback the withdrawal
            
            Status code must be either "1" or "2". No other values are accepted.
            This API is called after receiving the final transfer result from other bank.
        """,
        method = "POST"
    )
    @PostMapping("/withdrawals/confirm/")
    public Integer processExternalTransferConfirmation(@RequestBody TransactionHistory input) throws Exception {
        return accountService.processExternalTransferConfirmation(input);
    }
    
    @Operation(summary = "Transaction History Inquiry", method = "GET", description = "Retrieve transaction history")
    @GetMapping("/{acntNo}/transactions")
    public List<TransactionHistory> retrieveTransactionHistory(@PathVariable(name = "acntNo") String acntNo) throws Exception {
        return accountService.retrieveTransactionHistoryList(acntNo);
    }
}
