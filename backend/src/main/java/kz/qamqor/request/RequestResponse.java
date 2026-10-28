package kz.qamqor.request;

import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

public record RequestResponse(UUID id, String title, String description, String city, Category category,
                              Urgency urgency, String organizer, int volunteers, int targetVolunteers,
                              LocalDate date, String location, RequestStatus status, Instant createdAt) {
    public static RequestResponse from(HelpRequest request) {
        return new RequestResponse(request.getId(), request.getTitle(), request.getDescription(),
                request.getCity(), request.getCategory(), request.getUrgency(), request.getOrganizer(),
                request.getVolunteers(), request.getTargetVolunteers(), request.getDate(),
                request.getLocation(), request.getStatus(), request.getCreatedAt());
    }
}
