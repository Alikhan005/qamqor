package kz.qamqor;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.Executors;
import java.util.concurrent.TimeUnit;
import kz.qamqor.request.Category;
import kz.qamqor.request.HelpRequest;
import kz.qamqor.request.HelpRequestRepository;
import kz.qamqor.request.RequestStatus;
import kz.qamqor.request.Urgency;
import kz.qamqor.request.VolunteerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
class RequestApiIntegrationTest {
    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired HelpRequestRepository requests;
    @Autowired VolunteerRepository volunteers;

    @BeforeEach
    void clearDatabase() {
        volunteers.deleteAll();
        requests.deleteAll();
    }

    @Test
    void createsAndRetrievesPersistedRequestWithPublicDto() throws Exception {
        String response = mvc.perform(post("/api/requests").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsBytes(validRequest(3))))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.volunteers").value(0))
                .andExpect(jsonPath("$.status").value("OPEN"))
                .andExpect(jsonPath("$.date").value(LocalDate.now().plusDays(3).toString()))
                .andExpect(jsonPath("$.createdAt").exists())
                .andExpect(jsonPath("$.version").doesNotExist())
                .andReturn().getResponse().getContentAsString();
        String id = json.readTree(response).get("id").asText();
        assertThat(UUID.fromString(id)).isNotNull();
        mvc.perform(get("/api/requests/{id}", id))
                .andExpect(status().isOk()).andExpect(jsonPath("$.title").value("Поможем нашему району"));
    }

    @Test
    void combinesCityCategoryStatusAndCaseInsensitiveTextFilters() throws Exception {
        save("Чистый берег реки", "Алматы", Category.ECOLOGY, RequestStatus.OPEN, 2, 5);
        save("Чистый берег озера", "Астана", Category.ECOLOGY, RequestStatus.OPEN, 1, 5);
        save("Чистый берег раньше", "Алматы", Category.ECOLOGY, RequestStatus.COMPLETED, 4, 5);
        save("Помощь с продуктами", "Алматы", Category.FOOD, RequestStatus.OPEN, 1, 5);
        mvc.perform(get("/api/requests").param("city", "алматы").param("category", "ECOLOGY")
                        .param("status", "OPEN").param("q", "БЕРЕГ"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].title").value("Чистый берег реки"));
        mvc.perform(get("/api/requests").param("q", "%"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void rejectsInvalidFieldsPastDateAndMalformedEnums() throws Exception {
        Map<String, Object> invalid = validRequest(0);
        invalid.put("title", "   ");
        invalid.put("description", "мало");
        invalid.put("date", LocalDate.now().minusDays(1).toString());
        mvc.perform(post("/api/requests").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsBytes(invalid)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists())
                .andExpect(jsonPath("$.fieldErrors.description").exists())
                .andExpect(jsonPath("$.fieldErrors.targetVolunteers").exists())
                .andExpect(jsonPath("$.fieldErrors.date").exists());
        Map<String, Object> malformed = validRequest(3);
        malformed.put("category", "UNKNOWN");
        mvc.perform(post("/api/requests").contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsBytes(malformed)))
                .andExpect(status().isBadRequest());
        assertThat(requests.count()).isZero();
    }

    @Test
    void rejectsDuplicateNamesWithoutIncrementingAndHidesNames() throws Exception {
        UUID id = save("Поможем нашему району", "Алматы", Category.CARE, RequestStatus.OPEN, 0, 3).getId();
        join(id, "  Айдана   Серик  ", 200);
        join(id, "айдана серик", 409);
        mvc.perform(get("/api/requests/{id}", id))
                .andExpect(jsonPath("$.volunteers").value(1))
                .andExpect(jsonPath("$.participants").doesNotExist())
                .andExpect(jsonPath("$.names").doesNotExist());
        assertThat(volunteers.count()).isEqualTo(1);
    }

    @Test
    void rejectsFullCompletedMissingRequestsAndBlankNames() throws Exception {
        UUID full = save("Все участники уже собрались", "Астана", Category.FOOD, RequestStatus.OPEN, 2, 2).getId();
        UUID completed = save("Эта инициатива завершена", "Астана", Category.CARE, RequestStatus.COMPLETED, 1, 2).getId();
        join(full, "Тестовый участник", 409);
        join(completed, "Тестовый участник", 409);
        join(UUID.randomUUID(), "Тестовый участник", 404);
        join(full, "   ", 400);
        mvc.perform(get("/api/requests/not-a-uuid")).andExpect(status().isBadRequest());
        assertThat(volunteers.count()).isZero();
    }

    @Test
    void concurrentSignupsCannotExceedCapacity() throws Exception {
        UUID id = save("Последнее свободное место", "Шымкент", Category.ECOLOGY, RequestStatus.OPEN, 0, 1).getId();
        CountDownLatch ready = new CountDownLatch(2);
        CountDownLatch start = new CountDownLatch(1);
        try (var executor = Executors.newFixedThreadPool(2)) {
            List<Callable<Integer>> attempts = new ArrayList<>();
            for (String name : List.of("Участник Один", "Участник Два")) {
                attempts.add(() -> {
                    ready.countDown();
                    assertThat(start.await(10, TimeUnit.SECONDS)).isTrue();
                    return mvc.perform(post("/api/requests/{id}/volunteer", id)
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(json.writeValueAsBytes(Map.of("name", name))))
                            .andReturn().getResponse().getStatus();
                });
            }
            var first = executor.submit(attempts.get(0));
            var second = executor.submit(attempts.get(1));
            assertThat(ready.await(10, TimeUnit.SECONDS)).isTrue();
            start.countDown();
            assertThat(List.of(first.get(15, TimeUnit.SECONDS), second.get(15, TimeUnit.SECONDS)))
                    .containsExactlyInAnyOrder(200, 409);
        }
        assertThat(requests.findById(id).orElseThrow().getVolunteers()).isEqualTo(1);
        assertThat(volunteers.count()).isEqualTo(1);
    }

    @Test
    void computesRealDatabaseStatsAndAllowsConfiguredCors() throws Exception {
        save("Поможем нашему району", "Алматы", Category.CARE, RequestStatus.OPEN, 2, 5);
        save("Поможем другому району", "Алматы", Category.FOOD, RequestStatus.OPEN, 3, 5);
        save("Уже помогли этому району", "Астана", Category.ECOLOGY, RequestStatus.COMPLETED, 5, 5);
        mvc.perform(get("/api/stats").header("Origin", "http://localhost:4200"))
                .andExpect(status().isOk())
                .andExpect(header().string("Access-Control-Allow-Origin", "http://localhost:4200"))
                .andExpect(jsonPath("$.activeRequests").value(2))
                .andExpect(jsonPath("$.volunteers").value(10))
                .andExpect(jsonPath("$.cities").value(2))
                .andExpect(jsonPath("$.completedRequests").value(1));
        mvc.perform(get("/actuator/health")).andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("UP"));
    }

    private void join(UUID id, String name, int expectedStatus) throws Exception {
        mvc.perform(post("/api/requests/{id}/volunteer", id).contentType(MediaType.APPLICATION_JSON)
                        .content(json.writeValueAsBytes(Map.of("name", name))))
                .andExpect(status().is(expectedStatus));
    }

    private HelpRequest save(String title, String city, Category category, RequestStatus status,
                              int count, int target) {
        return requests.save(new HelpRequest(title, "Демонстрационная инициатива для соседей нашего района.",
                city, category, Urgency.NORMAL, "Тестовая команда", count, target,
                LocalDate.now().plusDays(3), "Общественный центр района", status));
    }

    private Map<String, Object> validRequest(int target) {
        return new java.util.HashMap<>(Map.of("title", "Поможем нашему району",
                "description", "Демонстрационная инициатива для соседей нашего района.",
                "city", "Алматы", "category", "CARE", "urgency", "NORMAL",
                "organizer", "Тестовая команда", "targetVolunteers", target,
                "date", LocalDate.now().plusDays(3).toString(), "location", "Общественный центр района"));
    }
}
