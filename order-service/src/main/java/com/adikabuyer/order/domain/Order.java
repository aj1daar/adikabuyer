package com.adikabuyer.order.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "customer_order")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Order {

    @Id
    private String id;

    /** Short, sequential number customers and admins actually say out loud ("№1042"). */
    @Column(nullable = false, unique = true, updatable = false)
    private Long number;

    @Column(name = "customer_name", nullable = false)
    private String customerName;

    @Column(name = "customer_phone", nullable = false)
    private String customerPhone;

    @Column(nullable = false)
    private String region;

    @Column(name = "items_total", nullable = false)
    private BigDecimal itemsTotal;

    @Column(name = "delivery_fee", nullable = false)
    private BigDecimal deliveryFee;

    @Column(name = "grand_total", nullable = false)
    private BigDecimal grandTotal;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Builder.Default
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private OrderStatus status = OrderStatus.NEW;

    @Column(name = "status_updated_at")
    private Instant statusUpdatedAt;

    /** Parcel-weight surcharge agreed at confirmation; null until known. */
    @Column(name = "weight_fee")
    private BigDecimal weightFee;

    @Column(name = "admin_note", length = 1000)
    private String adminNote;

    /** What the customer actually pays: the checkout total plus the weight fee once agreed. */
    public BigDecimal getFinalTotal() {
        return weightFee == null ? null : grandTotal.add(weightFee);
    }

    @Builder.Default
    @OneToMany(mappedBy = "order", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @OrderBy("id ASC")
    private List<OrderItem> items = new ArrayList<>();
}
