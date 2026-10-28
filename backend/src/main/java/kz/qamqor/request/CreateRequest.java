package kz.qamqor.request;

import jakarta.validation.constraints.FutureOrPresent;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;

public record CreateRequest(
        @NotBlank @Size(min = 8, max = 140) String title,
        @NotBlank @Size(min = 20, max = 2000) String description,
        @NotBlank @Size(min = 2, max = 80) String city,
        @NotNull Category category,
        @NotNull Urgency urgency,
        @NotBlank @Size(min = 3, max = 100) String organizer,
        @NotNull @Min(1) @Max(200) Integer targetVolunteers,
        @NotNull @FutureOrPresent LocalDate date,
        @NotBlank @Size(min = 5, max = 200) String location
) {
    public CreateRequest {
        title = strip(title);
        description = strip(description);
        city = strip(city);
        organizer = strip(organizer);
        location = strip(location);
    }

    private static String strip(String text) {
        return text == null ? null : text.strip();
    }
}
