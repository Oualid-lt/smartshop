package smartshop.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.UUID;

public record ProductCreateRequest(
        @NotBlank @Size(max = 50) String reference,
        @Size(max = 64) String barcode,
        @NotBlank @Size(max = 150) String name,
        UUID categoryId,
        @NotNull @DecimalMin("0.00") BigDecimal salePrice,
        @DecimalMin("0.00") BigDecimal purchasePrice,   // prix d'achat de départ (facultatif)
        Integer initialStock,                            // stock de départ (facultatif)
        @Min(0) Integer alertThreshold                   // facultatif, 5 par défaut
) {
}
