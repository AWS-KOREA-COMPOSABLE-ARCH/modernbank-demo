package com.modernbank.product.service;

import java.util.List;

import com.modernbank.product.model.Product;
import com.modernbank.product.repository.ProductRepository;

import org.springframework.stereotype.Service;

@Service
public class ProductService {

    private final ProductRepository repository;

    public ProductService(ProductRepository repository) {
        this.repository = repository;
    }

    /**
     * Save account product
     */
    public void saveProduct(Product product) {
        repository.save(product);
    }

    /**
     * Find account product by specific ID
     */
    public Product findProductById(String id) {
        return repository.findProductById(id);
    }

    /**
     * Find all account products
     */
    public List<Product> getAllProducts() {
        return repository.findAll();
    }

    /**
     * Delete account product
     */
    public String deleteProductById(String id) {
        return repository.deleteProductById(id);
    }

    /**
     * Update account product
     * @param product
     * @return
     */
    public String updateProductById(Product product) {
        return repository.updateProudctById(product);
    }
}
