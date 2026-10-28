package kz.qamqor.request;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import java.util.UUID;

/** Display names stay private: the public API exposes only aggregate volunteer counts. */
@Entity
@Table(name = "volunteer_registrations", uniqueConstraints =
        @UniqueConstraint(name = "uk_request_volunteer", columnNames = {"request_id", "normalized_name"}))
public class VolunteerRegistration {
    @Id
    @GeneratedValue
    private UUID id;
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "request_id", nullable = false)
    private HelpRequest request;
    @Column(name = "normalized_name", nullable = false, length = 100)
    private String normalizedName;

    protected VolunteerRegistration() {}

    public VolunteerRegistration(HelpRequest request, String normalizedName) {
        this.request = request;
        this.normalizedName = normalizedName;
    }
}
