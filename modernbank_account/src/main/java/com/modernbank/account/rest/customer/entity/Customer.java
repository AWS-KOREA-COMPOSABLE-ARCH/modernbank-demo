package com.modernbank.account.rest.customer.entity;

import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@NoArgsConstructor
@Data
public class Customer {
	
    private String cstmId;
    private String cstmNm;
    private String cstmAge;
    private String cstmGnd;
    private String cstmPn;
    private String cstmAdr;
    
    /* Transfer limit information */
    private Long oneTmTrnfLmt;
    private Long oneDyTrnfLmt;

    @Builder
    public Customer(String cstmId, String cstmNm, String cstmAge, String cstmGnd, String cstmPn, String cstmAdr) {
        this.cstmId = cstmId;
        this.cstmNm = cstmNm;
        this.cstmAge = cstmAge;
        this.cstmGnd = cstmGnd;
        this.cstmPn = cstmPn;
        this.cstmAdr = cstmAdr;
    }
}
