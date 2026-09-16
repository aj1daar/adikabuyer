package com.adikabuyer.catalog.repository;

import com.adikabuyer.catalog.domain.OrderStockDeduction;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface OrderStockDeductionRepository extends JpaRepository<OrderStockDeduction, Long> {

    List<OrderStockDeduction> findAllByOrderIdAndRestoredAtIsNull(String orderId);
}
