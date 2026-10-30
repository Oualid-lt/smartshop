package smartshop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductUpdateRequest(
        @NotBlank @Size(max = 50) String reference,
        @NotBlank @Size(max = 150) String name,
        @Size(max = 64) String barcode,
        UUID categoryId,
        @NotNull @DecimalMin("0.00") BigDecimal salePrice,
        @NotNull @Min(0) Integer alertThreshold
) {
}