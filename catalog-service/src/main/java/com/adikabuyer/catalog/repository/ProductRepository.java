package com.adikabuyer.catalog.repository;

import com.adikabuyer.catalog.domain.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.math.BigDecimal;
import java.util.List;

public interface ProductRepository extends JpaRepository<Product, Long> {

    @Query(value = """
            SELECT DISTINCT p.* FROM product p
            WHERE (CAST(:search AS varchar) IS NULL OR p.name ILIKE CONCAT('%', CAST(:search AS varchar), '%'))
              AND (CAST(:category AS varchar) IS NULL OR LOWER(p.category) = LOWER(CAST(:category AS varchar)))
              AND (CAST(:color AS varchar) IS NULL OR EXISTS (
                  SELECT 1 FROM variant v WHERE v.product_id = p.id
                  AND LOWER(v.attributes ->> 'color') = LOWER(CAST(:color AS varchar))
              ))
              AND (CAST(:size AS varchar) IS NULL OR EXISTS (
                  SELECT 1 FROM variant v WHERE v.product_id = p.id
                  AND LOWER(v.attributes ->> 'size') = LOWER(CAST(:size AS varchar))
              ))
              AND (
                  (CAST(:volumeMin AS numeric) IS NULL AND CAST(:volumeMax AS numeric) IS NULL)
                  OR EXISTS (
                      SELECT 1 FROM variant v WHERE v.product_id = p.id
                      AND v.attributes ->> 'volume' ~ '^[0-9]+(\\.[0-9]+)?$'
                      AND (CAST(:volumeMin AS numeric) IS NULL OR (v.attributes ->> 'volume')::numeric >= CAST(:volumeMin AS numeric))
                      AND (CAST(:volumeMax AS numeric) IS NULL OR (v.attributes ->> 'volume')::numeric <= CAST(:volumeMax AS numeric))
                  )
              )
            ORDER BY p.id
            """, nativeQuery = true)
    List<Product> search(
            @Param("search") String search,
            @Param("category") String category,
            @Param("color") String color,
            @Param("size") String size,
            @Param("volumeMin") BigDecimal volumeMin,
            @Param("volumeMax") BigDecimal volumeMax
    );
}
