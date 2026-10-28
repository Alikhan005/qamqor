package kz.qamqor.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record JoinRequest(@NotBlank @Size(min = 2, max = 100) String name) {
    public JoinRequest {
        name = name == null ? null : name.strip().replaceAll("\\s+", " ");
    }
}
