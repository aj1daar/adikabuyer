package com.adikabuyer.order.controller;

import com.adikabuyer.order.dto.CartDto;
import com.adikabuyer.order.dto.CheckoutResponseDto;
import com.adikabuyer.order.dto.OrderDto;
import com.adikabuyer.order.dto.TelegramAdminDto;
import com.adikabuyer.order.security.CheckoutRateLimiter;
import com.adikabuyer.order.service.OrderService;
import com.adikabuyer.order.telegram.TelegramAdminService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Slf4j
@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;
    private final TelegramAdminService telegramAdminService;
    private final CheckoutRateLimiter checkoutRateLimiter;

    @PostMapping("/checkout")
    public CheckoutResponseDto checkout(@Valid @RequestBody CartDto cart, HttpServletRequest httpRequest) {
        String clientKey = clientIp(httpRequest);
        if (!checkoutRateLimiter.isAllowed(clientKey)) {
            log.warn("Checkout rate limit exceeded for client {}", clientKey);
            throw new ResponseStatusException(HttpStatus.TOO_MANY_REQUESTS, "Too many orders. Please try again later.");
        }
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

    /** Caddy stamps X-Real-Ip with the real TCP peer; fall back to the socket when it's absent. */
    private static String clientIp(HttpServletRequest request) {
        String realIp = request.getHeader("X-Real-Ip");
        return realIp != null && !realIp.isBlank() ? realIp.trim() : request.getRemoteAddr();
    }
}
