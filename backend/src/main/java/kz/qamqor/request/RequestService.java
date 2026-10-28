package kz.qamqor.request;

import java.util.List;
import java.util.Locale;
import java.util.UUID;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@Transactional(readOnly = true)
public class RequestService {
    private final HelpRequestRepository requests;
    private final VolunteerRepository volunteers;

    public RequestService(HelpRequestRepository requests, VolunteerRepository volunteers) {
        this.requests = requests;
        this.volunteers = volunteers;
    }

    public List<RequestResponse> find(String city, Category category, String query, RequestStatus status) {
        Specification<HelpRequest> filters = (root, criteria, builder) -> builder.conjunction();
        if (city != null && !city.isBlank()) {
            filters = filters.and((root, criteria, builder) ->
                    builder.equal(builder.lower(root.get("city")), city.strip().toLowerCase(Locale.ROOT)));
        }
        if (category != null) {
            filters = filters.and((root, criteria, builder) -> builder.equal(root.get("category"), category));
        }
        if (status != null) {
            filters = filters.and((root, criteria, builder) -> builder.equal(root.get("status"), status));
        }
        if (query != null && !query.isBlank()) {
            // Escape SQL LIKE metacharacters so searches for '%' and '_' remain literal.
            String escaped = query.strip().toLowerCase(Locale.ROOT)
                    .replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
            String pattern = "%" + escaped + "%";
            filters = filters.and((root, criteria, builder) -> builder.or(
                    builder.like(builder.lower(root.get("title")), pattern, '\\'),
                    builder.like(builder.lower(root.get("description")), pattern, '\\'),
                    builder.like(builder.lower(root.get("organizer")), pattern, '\\')));
        }
        return requests.findAll(filters, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.asc("id")))
                .stream().map(RequestResponse::from).toList();
    }

    public RequestResponse get(UUID id) {
        return RequestResponse.from(requests.findById(id).orElseThrow(RequestService::notFound));
    }

    @Transactional
    public RequestResponse create(CreateRequest input) {
        HelpRequest request = new HelpRequest(input.title(), input.description(), input.city(),
                input.category(), input.urgency(), input.organizer(), 0, input.targetVolunteers(),
                input.date(), input.location(), RequestStatus.OPEN);
        return RequestResponse.from(requests.save(request));
    }

    @Transactional
    public RequestResponse volunteer(UUID id, JoinRequest input) {
        // Lock the request before checking capacity: simultaneous sign-ups cannot overbook it.
        HelpRequest request = requests.findByIdForUpdate(id).orElseThrow(RequestService::notFound);
        if (request.getStatus() != RequestStatus.OPEN) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Эта инициатива уже завершена.");
        }
        String normalizedName = input.name().toLowerCase(Locale.ROOT);
        if (volunteers.existsByRequestIdAndNormalizedName(id, normalizedName)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Вы уже записаны на эту инициативу.");
        }
        if (request.getVolunteers() >= request.getTargetVolunteers()) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Все места уже заняты. Выберите другую инициативу.");
        }
        volunteers.save(new VolunteerRegistration(request, normalizedName));
        request.addVolunteer();
        return RequestResponse.from(request);
    }

    public StatsResponse stats() {
        return new StatsResponse(requests.countByStatus(RequestStatus.OPEN), requests.countVolunteers(),
                requests.countCities(), requests.countByStatus(RequestStatus.COMPLETED));
    }

    private static ResponseStatusException notFound() {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, "Инициатива не найдена.");
    }
}
