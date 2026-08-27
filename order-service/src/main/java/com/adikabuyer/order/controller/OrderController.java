package com.adikabuyer.order.controller;

import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.TelegramAdminDto;
import com.adikabuyer.order.service.OrderService;
import com.adikabuyer.order.telegram.TelegramAdminService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final TelegramAdminService telegramAdminService;

    @PostMapping("/checkout")
    public CheckoutResponseDto checkout(@Valid @RequestBody CartDto cart) {
        return orderService.checkout(cart);
    }

    @GetMapping
    public List<OrderDto> getAllOrders() {
        return orderService.getAllOrders();
    }

    @GetMapping("/telegram-admins")
    public List<TelegramAdminDto> getTelegramAdmins() {
        return telegramAdminService.listAdmins();
    }

    @DeleteMapping("/{id}")
    public void deleteOrder(@PathVariable String id) {
        orderService.deleteOrder(id);
    }
}
