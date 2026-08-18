package com.adikabuyer.order.repository;

import com.adikabuyer.order.domain.TelegramAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TelegramAdminRepository extends JpaRepository<TelegramAdmin, Long> {
}
