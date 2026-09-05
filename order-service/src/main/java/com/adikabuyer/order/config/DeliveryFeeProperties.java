package com.adikabuyer.order.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;

@Component
@ConfigurationProperties(prefix = "app.delivery")
@Getter
@Setter
public class DeliveryFeeProperties {

    /** Courier inside Bishkek — the only place the shop delivers to. */
    private BigDecimal bishkekFee;

    /** Customer collects the order themselves. */
    private BigDecimal pickupFee;
}
