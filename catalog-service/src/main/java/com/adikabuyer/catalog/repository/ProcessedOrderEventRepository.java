package com.adikabuyer.catalog.repository;

import com.adikabuyer.catalog.domain.ProcessedOrderEvent;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ProcessedOrderEventRepository extends JpaRepository<ProcessedOrderEvent, String> {
}
