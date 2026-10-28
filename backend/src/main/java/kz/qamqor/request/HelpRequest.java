package kz.qamqor.request;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import java.time.Instant;
import java.time.LocalDate;
import java.util.UUID;

@Entity
@Table(name = "help_requests")
public class HelpRequest {
    @Id
    @GeneratedValue
    private UUID id;
    @Version
    private long version;
    @Column(nullable = false, length = 140)
    private String title;
    @Column(nullable = false, length = 2000)
    private String description;
    @Column(nullable = false, length = 80)
    private String city;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Category category;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private Urgency urgency;
    @Column(nullable = false, length = 100)
    private String organizer;
    @Column(nullable = false)
    private int volunteers;
    @Column(nullable = false)
    private int targetVolunteers;
    @Column(name = "event_date", nullable = false)
    private LocalDate date;
    @Column(nullable = false, length = 200)
    private String location;
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 10)
    private RequestStatus status;
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    protected HelpRequest() {}

    public HelpRequest(String title, String description, String city, Category category, Urgency urgency,
                       String organizer, int volunteers, int targetVolunteers, LocalDate date,
                       String location, RequestStatus status) {
        this.title = title;
        this.description = description;
        this.city = city;
        this.category = category;
        this.urgency = urgency;
        this.organizer = organizer;
        this.volunteers = volunteers;
        this.targetVolunteers = targetVolunteers;
        this.date = date;
        this.location = location;
        this.status = status;
        this.createdAt = Instant.now();
    }

    public void addVolunteer() {
        volunteers++;
    }

    public UUID getId() { return id; }
    public String getTitle() { return title; }
    public String getDescription() { return description; }
    public String getCity() { return city; }
    public Category getCategory() { return category; }
    public Urgency getUrgency() { return urgency; }
    public String getOrganizer() { return organizer; }
    public int getVolunteers() { return volunteers; }
    public int getTargetVolunteers() { return targetVolunteers; }
    public LocalDate getDate() { return date; }
    public String getLocation() { return location; }
    public RequestStatus getStatus() { return status; }
    public Instant getCreatedAt() { return createdAt; }
}
