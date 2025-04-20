package com.modernbank.cqrs.domain.dynamo;

import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBSaveExpression;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.ExpectedAttributeValue;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;

@Repository
public class CustomerRepository {

    @Autowired
    private DynamoDBMapper dynamoDBMapper;
    
    // 생성
    public Customer saveCustomer(Customer customer) {
        dynamoDBMapper.save(customer);
        return customer;
    }
    
    // 조회
    public Customer getCustomerById(String customerId) {
        return dynamoDBMapper.load(Customer.class, customerId);
    }

    // 삭제
    public String deleteCustomerById(String customerId) {
        dynamoDBMapper.delete(dynamoDBMapper.load(Customer.class, customerId));
        return "Customer Id : "+ customerId +" Deleted!";
    }

    // 수정
    public String updateCustomer(Customer customer) {
        dynamoDBMapper.save(customer,
                new DynamoDBSaveExpression()
                        .withExpectedEntry("customerId",
                                new ExpectedAttributeValue(
                                        new AttributeValue().withS(customer.getCustomerId())
                                )));
        return customer.getCustomerId();
    }
}
