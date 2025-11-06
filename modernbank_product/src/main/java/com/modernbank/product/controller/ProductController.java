package com.modernbank.product.controller;

import java.util.List;

import com.modernbank.product.model.Product;
import com.modernbank.product.service.ProductService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@Tag(name = "Product API", description = "은행 계좌 상품 관리 API")
public class ProductController {

    private static final Logger logger = LoggerFactory.getLogger(ProductController.class);
    private final ProductService service;

    public ProductController(ProductService service) {
        this.service = service;
    }

    /**
     * Register new account product
     */
    @PostMapping("/")
    @Operation(summary = "신규 계좌 상품 등록", description = "새로운 계좌 상품을 추가합니다.")
    public ResponseEntity<String> createProduct(@RequestBody Product product) {
        try {
            service.saveProduct(product);
            return ResponseEntity.ok("Product created successfully!");
        } catch (Exception e) {
            logger.error("Failed to create product: {}", e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to create product: " + e.getMessage());
        }
    }

    @GetMapping("/{id}")
    @Operation(summary = "특정 상품 조회", description = "ID로 계좌 상품을 조회합니다.")
    public ResponseEntity<Product> findProductById(@PathVariable String id) {
        try {
            Product product = service.findProductById(id);
            if (product == null) {
                logger.warn("Product not found with id: {}", id);
                return ResponseEntity.notFound().build();
            }
            return ResponseEntity.ok(product);
        } catch (Exception e) {
            logger.error("Error occurred while fetching product with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    /**
     * Retrieve all account product list
     */
    @GetMapping("/")
    @Operation(summary = "모든 상품 조회", description = "등록된 모든 계좌 상품을 조회합니다.")
    public ResponseEntity<List<Product>> getAllProducts() {
        try {
            List<Product> products = service.getAllProducts();
            if (products.isEmpty()) {
                logger.warn("No products found in the database.");
                return ResponseEntity.status(HttpStatus.NOT_FOUND).build();
            }
            return ResponseEntity.ok(products);
        } catch (Exception e) {
            logger.error("Error occurred while fetching all products: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "특정 상품 삭제", description = "ID로 계좌 상품을 삭제합니다.")
    public ResponseEntity<String> deleteProductById(@PathVariable String id) {
        try {
            // Check if ID exists
            Product product = service.findProductById(id);
            if (product == null) {
                logger.warn("Product not found with id: {}", id);
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Product not found with id: " + id);
            }
    
            service.deleteProductById(id);
            return ResponseEntity.ok("Product deleted successfully!");
        } catch (Exception e) {
            logger.error("Failed to delete product with id {}: {}", id, e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to delete product: " + e.getMessage());
        }
    }

    /**
     * Update specific account product
     */
    @PutMapping("/{id}")
    @Operation(summary = "특정 상품 수정", description = "ID로 계좌 상품 정보를 수정합니다.")
    public ResponseEntity<String> updateProductById(@RequestBody Product product) {
        try {
            // Find existing product
            Product existingProduct = service.findProductById(product.getId());
            if (existingProduct == null) {
                logger.warn("Product not found with id: {}", product.getId());
                return ResponseEntity
                    .status(HttpStatus.NOT_FOUND)
                    .body("Product not found with id: " + product.getId());
            }
            logger.info(">> product :" + product.getId() + " : " + product.getName());
            // Call service layer
            String result = service.updateProductById(product);
            return ResponseEntity.ok(result);
        } catch (Exception e) {
            logger.error("Failed to update product with id {}: {}", product.getId(), e.getMessage(), e);
            return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to update product: " + e.getMessage());
        }
    }
}
