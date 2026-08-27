package com.adikabuyer.order.repository;

import com.adikabuyer.order.domain.TelegramAdmin;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface TelegramAdminRepository extends JpaRepository<TelegramAdmin, Long> {

    List<TelegramAdmin> findAllByOrderByRegisteredAtDesc();
}
