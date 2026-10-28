package kz.qamqor.request;

import jakarta.validation.Valid;
import java.net.URI;
import java.util.List;
import java.util.UUID;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class RequestController {
    private final RequestService service;

    public RequestController(RequestService service) {
        this.service = service;
    }

    @GetMapping("/requests")
    public List<RequestResponse> list(@RequestParam(required = false) String city,
                                      @RequestParam(required = false) Category category,
                                      @RequestParam(required = false, name = "q") String query,
                                      @RequestParam(required = false) RequestStatus status) {
        return service.find(city, category, query, status);
    }

    @GetMapping("/requests/{id}")
    public RequestResponse get(@PathVariable UUID id) {
        return service.get(id);
    }

    @PostMapping("/requests")
    public ResponseEntity<RequestResponse> create(@Valid @RequestBody CreateRequest request) {
        RequestResponse created = service.create(request);
        return ResponseEntity.created(URI.create("/api/requests/" + created.id())).body(created);
    }

    @PostMapping("/requests/{id}/volunteer")
    public RequestResponse volunteer(@PathVariable UUID id, @Valid @RequestBody JoinRequest input) {
        return service.volunteer(id, input);
    }

    @GetMapping("/stats")
    public StatsResponse stats() {
        return service.stats();
    }
}
