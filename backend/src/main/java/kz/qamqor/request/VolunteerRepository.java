package kz.qamqor.request;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface VolunteerRepository extends JpaRepository<VolunteerRegistration, UUID> {
    boolean existsByRequestIdAndNormalizedName(UUID requestId, String normalizedName);
}
