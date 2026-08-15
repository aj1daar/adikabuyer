package com.adikabuyer.order.controller;

import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/checkout")
    public CheckoutResponseDto checkout(@RequestBody CartDto cart) {
        return orderService.checkout(cart);
    }
}
