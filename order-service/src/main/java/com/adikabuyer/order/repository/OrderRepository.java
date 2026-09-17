package com.adikabuyer.order.repository;

import com.adikabuyer.order.domain.Order;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface OrderRepository extends JpaRepository<Order, String> {

    List<Order> findAllByOrderByCreatedAtDesc();

    /** Draws the next human-readable order number from the sequence created in V2. */
    @Query(value = "SELECT nextval('customer_order_number_seq')", nativeQuery = true)
    long nextOrderNumber();
}
