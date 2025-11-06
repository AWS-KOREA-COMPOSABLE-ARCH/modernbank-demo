package com.modernbank.product.config;

import com.amazonaws.auth.WebIdentityTokenCredentialsProvider;
import com.amazonaws.auth.DefaultAWSCredentialsProviderChain;
import com.amazonaws.client.builder.AwsClientBuilder;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapper;
import com.amazonaws.services.dynamodbv2.datamodeling.DynamoDBMapperConfig;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class DynamoDBConfig {

    @Value("${aws.dynamodb.endpoint:}") // Get endpoint from environment variable or property (empty if not present)
    private String endPoint;

    @Value("${aws.region:ap-northeast-2}") // Default region setting
    private String region;

    private static final Logger logger = LoggerFactory.getLogger(DynamoDBConfig.class);

    @Bean
    public DynamoDBMapper dynamoDBMapper() {
        DynamoDBMapperConfig mapperConfig = DynamoDBMapperConfig.builder()
                .withSaveBehavior(DynamoDBMapperConfig.SaveBehavior.CLOBBER)
                .withConsistentReads(DynamoDBMapperConfig.ConsistentReads.CONSISTENT)
                .withTableNameOverride(null)
                .withPaginationLoadingStrategy(DynamoDBMapperConfig.PaginationLoadingStrategy.EAGER_LOADING)
                .build();

        return new DynamoDBMapper(amazonDynamoDB(), mapperConfig);
    }

    @Bean
    public AmazonDynamoDB amazonDynamoDB() {
        AmazonDynamoDBClientBuilder builder = AmazonDynamoDBClientBuilder.standard();

        if (endPoint != null && !endPoint.isEmpty() && endPoint.equals("http://localhost:8000")) {
            // Use local DynamoDB (no IAM authentication)
            logger.info("Using Local DynamoDB at {}", endPoint);
            builder.withEndpointConfiguration(new AwsClientBuilder.EndpointConfiguration(endPoint, region));
        } else {
            // Use AWS Public Endpoint (with IRSA)
            logger.info("Using AWS DynamoDB in region: {}", region);
            builder.withRegion(region);
            builder.withCredentials(WebIdentityTokenCredentialsProvider.create()); // Apply IRSA
        }

        return builder.build();
    }
}
