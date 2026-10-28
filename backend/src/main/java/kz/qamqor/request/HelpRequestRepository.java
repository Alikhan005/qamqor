package kz.qamqor.request;

import jakarta.persistence.LockModeType;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface HelpRequestRepository extends JpaRepository<HelpRequest, UUID>, JpaSpecificationExecutor<HelpRequest> {
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select r from HelpRequest r where r.id = :id")
    Optional<HelpRequest> findByIdForUpdate(@Param("id") UUID id);

    long countByStatus(RequestStatus status);

    @Query("select coalesce(sum(r.volunteers), 0) from HelpRequest r")
    long countVolunteers();

    @Query("select count(distinct r.city) from HelpRequest r")
    long countCities();
}
