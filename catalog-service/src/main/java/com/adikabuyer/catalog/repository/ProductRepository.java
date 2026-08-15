package com.adikabuyer.catalog.repository;

import com.adikabuyer.catalog.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProductRepository extends JpaRepository<Product, Long> {
}
