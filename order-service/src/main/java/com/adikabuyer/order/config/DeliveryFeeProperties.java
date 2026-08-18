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

    private BigDecimal defaultFee;
    private BigDecimal bishkekFee;
}
