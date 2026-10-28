package kz.qamqor.config;

import java.time.LocalDate;
import java.time.ZoneId;
import java.util.List;
import kz.qamqor.request.Category;
import kz.qamqor.request.HelpRequest;
import kz.qamqor.request.HelpRequestRepository;
import kz.qamqor.request.RequestStatus;
import kz.qamqor.request.Urgency;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/** Fictional portfolio examples. No real organization, beneficiary, or contact data. */
@Component
@ConditionalOnProperty(name = "app.seed-data", havingValue = "true", matchIfMissing = true)
public class DemoData implements CommandLineRunner {
    private final HelpRequestRepository requests;

    public DemoData(HelpRequestRepository requests) {
        this.requests = requests;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (requests.count() != 0) {
            return;
        }
        LocalDate today = LocalDate.now(ZoneId.of("Asia/Almaty"));
        requests.saveAll(List.of(
                request("Тёплые обеды для соседей", "Соберём продуктовые наборы и приготовим горячие обеды для пожилых жителей района. Нужны помощники на кухне и для упаковки. Опыт не требуется: координатор проведёт инструктаж.",
                        "Алматы", Category.FOOD, Urgency.URGENT, "Команда «Жылы жүрек»", 12, 18,
                        today.plusDays(3), "Общественная кухня, Алмалинский район", RequestStatus.OPEN),
                request("Чистый берег Есиля", "Проведём утро на свежем воздухе и уберём мусор вдоль набережной. Выдадим перчатки, мешки и инвентарь. После уборки отсортируем собранное и обсудим экологические привычки.",
                        "Астана", Category.ECOLOGY, Urgency.NORMAL, "Эко-команда «Таза орта»", 21, 30,
                        today.plusDays(5), "Набережная Есиля, точка у пешеходного моста", RequestStatus.OPEN),
                request("Помоги школьнику поверить в себя", "Ищем наставников по математике и английскому для бесплатного учебного клуба. Поможем детям разобраться со сложными темами через игры и практику. Занятие пройдёт с координатором клуба.",
                        "Шымкент", Category.EDUCATION, Urgency.NORMAL, "Учебный клуб «Бірге»", 6, 10,
                        today.plusDays(6), "Открытая учебная мастерская, Аль-Фарабийский район", RequestStatus.OPEN),
                request("Выходной с хвостиками", "Поможем учебному приюту: подготовим корм, уберём вольеры и погуляем с собаками под присмотром куратора. Нужна удобная закрытая обувь. Все правила расскажем перед началом.",
                        "Караганда", Category.ANIMALS, Urgency.URGENT, "Волонтёрская команда «Табан»", 4, 12,
                        today.plusDays(2), "Волонтёрская площадка, район Казыбек би", RequestStatus.OPEN),
                request("Цифровая забота для старшего поколения", "Покажем пожилым участникам, как пользоваться смартфоном, видеосвязью и защищаться от подозрительных сообщений. Понадобятся терпение и желание объяснять просто. Персональные пароли не запрашиваем.",
                        "Актобе", Category.CARE, Urgency.NORMAL, "Клуб соседей «Қамқор»", 8, 15,
                        today.plusDays(8), "Клуб соседей, район Астана", RequestStatus.OPEN),
                request("Новые деревья для нашего двора", "Посадим саженцы и подготовим лунки для полива вместе с жителями двора. Инструменты и воду предоставит команда. Для детей предусмотрены простые задания рядом с родителями.",
                        "Алматы", Category.ECOLOGY, Urgency.NORMAL, "Инициатива «Жасыл аула»", 16, 24,
                        today.plusDays(10), "Дворовая площадка, Бостандыкский район", RequestStatus.OPEN),
                request("Книги находят новых друзей", "Сортируем детские книги для открытых полок обмена. Нужно проверить состояние, оформить простые закладки и подготовить коробки для доставки. Можно прийти без опыта и познакомиться с командой.",
                        "Астана", Category.EDUCATION, Urgency.NORMAL, "Книжный круг «Оқы»", 7, 12,
                        today.plusDays(12), "Общественная мастерская, район Сарыарка", RequestStatus.OPEN),
                request("Продуктовые наборы собраны", "Команда подготовила учебную благотворительную акцию: распределила продукты, упаковала наборы и помогла с доставкой. Спасибо всем участникам за время и заботу о соседях.",
                        "Шымкент", Category.FOOD, Urgency.NORMAL, "Команда «Жылы жүрек»", 18, 18,
                        today.minusDays(7), "Общественный центр, Енбекшинский район", RequestStatus.COMPLETED),
                request("День доброго соседства", "Волонтёры помогли участникам клуба общения подготовить творческую встречу: расставили столы, провели настольные игры и создали тёплую атмосферу. Инициатива успешно завершена.",
                        "Караганда", Category.CARE, Urgency.NORMAL, "Клуб соседей «Қамқор»", 14, 14,
                        today.minusDays(14), "Клуб соседей, район Алихана Бокейхана", RequestStatus.COMPLETED)
        ));
    }

    private HelpRequest request(String title, String description, String city, Category category,
                                Urgency urgency, String organizer, int volunteers, int target,
                                LocalDate date, String location, RequestStatus status) {
        return new HelpRequest(title, description, city, category, urgency, organizer,
                volunteers, target, date, location, status);
    }
}
