package com.modernbank.transfer.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

import java.util.Arrays;
import java.util.List;

import com.modernbank.transfer.domain.entity.TransferHistory;
import com.modernbank.transfer.domain.entity.TransferLimit;
import com.modernbank.transfer.service.TransferService;

import org.hamcrest.Matchers;
import org.junit.jupiter.api.Test;
import org.mockito.BDDMockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.result.MockMvcResultMatchers;
@WebMvcTest(controllers = TransferController.class)
public class TransferControllerTest {

	@Autowired
    private MockMvc mockMvc;
    
	@MockBean(name = "transferService")
	private TransferService transferService;
	
	@Test
    void transfer_withTransferHistory_ReturnTransferHistory() throws Exception {
    	// given (test setup)
    	TransferHistory transferHistory = TransferHistory.builder()
    			.cstmId("1111")
    			.seq(1)
    		    .divCd("1")
    		    .stsCd("3")
    		    .dpstAcntNo("222201")
    		    .wthdAcntNo("111101")
    		    .wthdAcntSeq(1)
    		    .sndMm("11")
    		    .rcvMm("홍길동")
    		    .rcvCstmNm("홍길순")
    		    .trnfAmt(100L)
    		    .trnfDtm("2020-03-09 16:59:58").build();
    		
    	// BDD -> define transfer service as stub
    	BDDMockito.given(transferService.transfer(transferHistory)).willReturn(transferHistory);
    	
    	// when (test execution)
		mockMvc.perform(post("/")
    			.contentType(MediaType.APPLICATION_JSON)
    			.content("{\"cstmId\":\"1111\","
    					+ "\"seq\":\"1\","
    					+ "\"divCd\":\"1\","
    					+ "\"stsCd\":\"3\","
    					+ "\"dpstAcntNo\":\"222201\","
    					+ "\"wthdAcntNo\":\"111101\","
    					+ "\"wthdAcntSeq\":\"1\","
    					+ "\"sndMm\":\"11\","
    					+ "\"rcvMm\":\"홍길동\","
    					+ "\"rcvCstmNm\":\"홍길순\","
    					+ "\"trnfAmt\":\"100\","
    					+ "\"trnfDtm\":\"2020-03-09 16:59:58\"}"))
    			.andExpect(MockMvcResultMatchers.status().isOk())
    			// Since Transfer Service is mocked, current return value is null. Therefore cstmId value is null, causing error when compared to 1111
    			.andExpect(MockMvcResultMatchers.jsonPath("$.cstmId", Matchers.equalTo("1111")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.seq", Matchers.equalTo(1)))
				.andExpect(MockMvcResultMatchers.jsonPath("$.divCd", Matchers.equalTo("1")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.stsCd", Matchers.equalTo("3")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.dpstAcntNo", Matchers.equalTo("222201")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.wthdAcntNo", Matchers.equalTo("111101")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.wthdAcntSeq", Matchers.equalTo(1)))
				.andExpect(MockMvcResultMatchers.jsonPath("$.sndMm", Matchers.equalTo("11")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.rcvMm", Matchers.equalTo("홍길동")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.rcvCstmNm", Matchers.equalTo("홍길순")))
				.andExpect(MockMvcResultMatchers.jsonPath("$.trnfAmt", Matchers.equalTo(100)))
				.andExpect(MockMvcResultMatchers.jsonPath("$.trnfDtm", Matchers.equalTo("2020-03-09 16:59:58")));
				
		// then (test verification)
		BDDMockito.verify(transferService).transfer(transferHistory);
		
    }
	
	@Test
    void btobTransfer_withTransferHistory_ReturnBoolean() throws Exception {
    	// given (test setup)
    	TransferHistory transferHistory = TransferHistory.builder()
    			.cstmId("1111")
    			.seq(1)
    		    .divCd("2")
    		    .stsCd("3")
    		    .dpstAcntNo("222201")
    		    .wthdAcntNo("111101")
    		    .wthdAcntSeq(1)
    		    .sndMm("11")
    		    .rcvMm("홍길동")
    		    .rcvCstmNm("홍길순")
    		    .trnfAmt(100L)
    		    .trnfDtm("2020-03-09 16:59:58").build();
    		
    	// BDD -> define transfer service as stub
    	BDDMockito.given(transferService.interBankTransfer(transferHistory)).willReturn(true);
    	
    	// when (test execution)
		mockMvc.perform(post("/external/")
    			.contentType(MediaType.APPLICATION_JSON)
    			.content("{\"cstmId\":\"1111\","
    					+ "\"seq\":\"1\","
    					+ "\"divCd\":\"2\","
    					+ "\"stsCd\":\"3\","
    					+ "\"dpstAcntNo\":\"222201\","
    					+ "\"wthdAcntNo\":\"111101\","
    					+ "\"wthdAcntSeq\":\"1\","
    					+ "\"sndMm\":\"11\","
    					+ "\"rcvMm\":\"홍길동\","
    					+ "\"rcvCstmNm\":\"홍길순\","
    					+ "\"trnfAmt\":\"100\","
    					+ "\"trnfDtm\":\"2020-03-09 16:59:58\"}"))
    			.andExpect(MockMvcResultMatchers.status().isOk());
				
		// then (test verification)
		BDDMockito.verify(transferService).interBankTransfer(transferHistory);
		
    }
	
    @Test
    void retrieveTransferHistoryList_withCstmId_RetrurnListTransferHistory() throws Exception {
    	// given (test setup)
    	String cstmId = "1111";
    	
    	TransferHistory transferHistory = TransferHistory.builder()
    			.cstmId(cstmId)
    			.seq(1)
    		    .divCd("1")
    		    .stsCd("3")
    		    .dpstAcntNo("222201")
    		    .wthdAcntNo("111101")
    		    .wthdAcntSeq(1)
    		    .sndMm("11")
    		    .rcvMm("홍길동")
    		    .rcvCstmNm("홍길순")
    		    .trnfAmt(100L)
    		    .trnfDtm("2020-03-09 16:59:58").build();
    		
    	
    	//List<TransferHistory> historys = Collections.singletonList(transferHistory);
    	List<TransferHistory> historyList = Arrays.asList(transferHistory);
    	
    	// BDD -> define transfer service as stub
    	BDDMockito.given(transferService.retrieveTransferHistoryList(cstmId)).willReturn(historyList);
    	
    	// when (test execution)
		mockMvc.perform(get("/history/" + cstmId)
    			.contentType(MediaType.APPLICATION_JSON))
    			.andExpect(MockMvcResultMatchers.status().isOk())
    			// Since Transfer Service is mocked, current return value is null. Therefore cstmId value is null, causing error when compared to 1111
    			.andExpect(MockMvcResultMatchers.jsonPath("$[0].cstmId", Matchers.equalTo(cstmId)))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].seq", Matchers.equalTo(1)))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].divCd", Matchers.equalTo("1")))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].stsCd", Matchers.equalTo("3")))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].dpstAcntNo", Matchers.equalTo("222201")))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].wthdAcntNo", Matchers.equalTo("111101")))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].wthdAcntSeq", Matchers.equalTo(1)))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].sndMm", Matchers.equalTo("11")))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].rcvMm", Matchers.equalTo("홍길동")))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].rcvCstmNm", Matchers.equalTo("홍길순")))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].trnfAmt", Matchers.equalTo(100)))
				.andExpect(MockMvcResultMatchers.jsonPath("$[0].trnfDtm", Matchers.equalTo("2020-03-09 16:59:58")));
				
		
		// then (test verification)
		BDDMockito.verify(transferService).retrieveTransferHistoryList(cstmId);
		
    }
    
    @Test
    void retrieveTransferLimit_withCstmId_RetrurnTransferLimit() throws Exception {
    	// given (test setup)
    	String cstmId = "1111";
    	
    	TransferLimit transferLimit = TransferLimit.builder()
    			.cstmId(cstmId)
    			.oneTmTrnfLmt(50000000L)
    		    .oneDyTrnfLmt(500000000L).build();
    		
    	// BDD -> define transfer service as stub
    	BDDMockito.given(transferService.retrieveTransferLimit(cstmId)).willReturn(transferLimit);
    	
    	// when (test execution)
		mockMvc.perform(get("/limits/" + cstmId)
    			.contentType(MediaType.APPLICATION_JSON))
    			.andExpect(MockMvcResultMatchers.status().isOk())
    			// Since Transfer Service is mocked, current return value is null. Therefore cstmId value is null, causing error when compared to 1111
    			.andExpect(MockMvcResultMatchers.jsonPath("$.cstmId", Matchers.equalTo(cstmId)))
				.andExpect(MockMvcResultMatchers.jsonPath("$.oneTmTrnfLmt", Matchers.equalTo(50000000)))
				.andExpect(MockMvcResultMatchers.jsonPath("$.oneDyTrnfLmt", Matchers.equalTo(500000000)));
		
		// then (test verification)
		BDDMockito.verify(transferService).retrieveTransferLimit(cstmId);
		
    }
    
    @Test
    void retrieveEnableTransferLimit_withCstmId_RetrurnTransferLimit() throws Exception {
    	// given (test setup)
    	String cstmId = "1111";
    	
    	TransferLimit transferLimit = TransferLimit.builder()
    			.cstmId(cstmId)
    			.oneTmTrnfLmt(50000000L)
    		    .oneDyTrnfLmt(500000000L).build();
    		
    	// BDD -> define transfer service as stub
    	BDDMockito.given(transferService.retrieveEnableTransferLimit(cstmId)).willReturn(transferLimit);
    	
    	// when (test execution)
		mockMvc.perform(get("/limits/" + cstmId + "/available")
    			.contentType(MediaType.APPLICATION_JSON))
    			.andExpect(MockMvcResultMatchers.status().isOk())
    			// Since Transfer Service is mocked, current return value is null. Therefore cstmId value is null, causing error when compared to 1111
    			.andExpect(MockMvcResultMatchers.jsonPath("$.cstmId", Matchers.equalTo(cstmId)))
				.andExpect(MockMvcResultMatchers.jsonPath("$.oneTmTrnfLmt", Matchers.equalTo(50000000)))
				.andExpect(MockMvcResultMatchers.jsonPath("$.oneDyTrnfLmt", Matchers.equalTo(500000000)));
		
		// then (test verification)
		BDDMockito.verify(transferService).retrieveEnableTransferLimit(cstmId);
		
    }
    
}