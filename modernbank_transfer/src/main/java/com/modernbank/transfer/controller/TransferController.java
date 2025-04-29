package com.modernbank.transfer.controller;

import java.util.List;

import com.modernbank.transfer.domain.entity.TransferHistory;
import com.modernbank.transfer.domain.entity.TransferLimit;
import com.modernbank.transfer.service.TransferService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestMethod;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import jakarta.annotation.Resource;

@RestController
public class TransferController {
    private final Logger LOGGER = LoggerFactory.getLogger(TransferController.class);

    @Autowired
    @Resource(name = "transferService")
    private TransferService transferService;
    
    @Operation(summary = "Internal Bank Transfer", method = "POST", description = "Internal Bank Transfer")
    @RequestMapping(method = RequestMethod.POST, path = "/internal")
    public TransferHistory transfer(@RequestBody TransferHistory input) throws Exception{
        LOGGER.info("--> call internal transfer ");
        return transferService.transfer(input);
    }
    
    // Inter-bank transfer
    @Operation(summary = "Inter-Bank Transfer", method = "POST", description = "Inter-Bank Transfer")
    @RequestMapping(method = RequestMethod.POST, path = "/external")
    public Boolean btobTransfer(@RequestBody TransferHistory input) throws Exception{
        LOGGER.info("=====>DivCd: " + input.getDivCd() + ", StsCd:" + input.getStsCd());

        return transferService.interBankTransfer(input);
    }

    @Operation(summary = "Retrieve Transfer History", method = "GET", description = "Retrieve Transfer History")
    @RequestMapping(method = RequestMethod.GET, path = "/history/{cstmId}")
    public List<TransferHistory> retrieveTransferHistoryList(@PathVariable(name = "cstmId") String cstmId) throws Exception{
        List<TransferHistory> transferHistory = transferService.retrieveTransferHistoryList(cstmId);
        return transferHistory;
    }

    @Operation(summary = "Register Transfer Limit", method = "POST", description = "Register Transfer Limit")
    @RequestMapping(method = RequestMethod.POST, path = "/limits")
    public Integer createTransferLimit(@RequestBody TransferLimit input) throws Exception{
        return  transferService.createTransferLimit(input);
    }

    @Operation(summary = "Retrieve Transfer Limit", method = "GET", description = "Retrieve Transfer Limit")
    @RequestMapping(method = RequestMethod.GET, path = "/limits/{cstmId}")
    public TransferLimit retrieveTransferLimit(@PathVariable(name = "cstmId") String cstmId) throws Exception{
        return transferService.retrieveTransferLimit(cstmId);
    }

    @Operation(summary = "Retrieve Available Transfer Limit", method = "GET", description = "Retrieve Available Transfer Limit")
    @RequestMapping(method = RequestMethod.GET, path = "/limits/{cstmId}/available")
    public TransferLimit retrieveEnableTransferLimit(@PathVariable(name = "cstmId") String cstmId) throws Exception{
        return  transferService.retrieveEnableTransferLimit(cstmId);
    }
}