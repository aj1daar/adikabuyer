package com.adikabuyer.order.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

@Component
@ConfigurationProperties(prefix = "app.delivery")
@Getter
@Setter
public class DeliveryFeeProperties {

    private BigDecimal defaultFee;
    private Map<String, BigDecimal> fees = new HashMap<>();
}
