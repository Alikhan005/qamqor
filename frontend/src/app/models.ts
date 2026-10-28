export type Category = "FOOD" | "EDUCATION" | "ECOLOGY" | "CARE" | "ANIMALS";
export type Language = "ru" | "kk";
export interface HelpRequest {
  id: string;
  title: string;
  description: string;
  city: string;
  category: Category;
  urgency: "NORMAL" | "URGENT";
  organizer: string;
  volunteers: number;
  targetVolunteers: number;
  date: string;
  location: string;
  status: "OPEN" | "COMPLETED";
  createdAt: string;
}
export type CreateRequest = Omit<
  HelpRequest,
  "id" | "volunteers" | "status" | "createdAt"
>;
export const CITIES = [
  "Алматы",
  "Астана",
  "Шымкент",
  "Караганда",
  "Актобе",
  "Атырау",
  "Павлодар",
  "Тараз",
  "Семей",
  "Актау",
];
export const CATEGORY_META: Record<
  Category,
  { ru: string; kk: string; icon: string; color: string }
> = {
  FOOD: { ru: "Продукты", kk: "Азық-түлік", icon: "basket", color: "peach" },
  EDUCATION: {
    ru: "Образование",
    kk: "Білім",
    icon: "book",
    color: "lavender",
  },
  ECOLOGY: { ru: "Экология", kk: "Экология", icon: "leaf", color: "sage" },
  CARE: { ru: "Забота", kk: "Қамқорлық", icon: "heart", color: "pink" },
  ANIMALS: { ru: "Животные", kk: "Жануарлар", icon: "paw", color: "sand" },
};
export function localDate(offset = 0): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function seedRequests(): HelpRequest[] {
  const rows: Array<
    [string, string, string, Category, string, number, number, string, boolean]
  > = [
    [
      "Продуктовая корзина для пожилых",
      "Собираем и доставляем продуктовые наборы пожилым соседям. Нужны люди для упаковки и доставки. Все адреса согласовываются координатором после знакомства.",
      "Алматы",
      "FOOD",
      "Команда «Жылы жүрек»",
      6,
      10,
      "Бостандыкский район",
      true,
    ],
    [
      "Чистый берег — общее дело",
      "Встречаемся, чтобы убрать мусор на берегу и отсортировать вторсырьё. Перчатки и мешки предоставляем. Можно прийти с друзьями, опыт не нужен.",
      "Астана",
      "ECOLOGY",
      "Сообщество «Таза орта»",
      12,
      20,
      "Набережная Есиля",
      false,
    ],
    [
      "Знания, которые меняют будущее",
      "Помогите школьникам разобраться с математикой и основами программирования. Ищем наставников на одно групповое занятие продолжительностью два часа.",
      "Шымкент",
      "EDUCATION",
      "Клуб «Бірге оқимыз»",
      3,
      6,
      "Район Аль-Фараби",
      false,
    ],
    [
      "Тёплый день в приюте",
      "Помогаем ухаживать за животными: прогулки, уборка и подготовка кормов. Координатор проведёт инструктаж. Участие доступно с 18 лет.",
      "Караганда",
      "ANIMALS",
      "Команда «Дос»",
      4,
      8,
      "Район Казыбек би",
      false,
    ],
    [
      "Компания для доброго разговора",
      "Проведите время со старшим поколением за настольными играми и чаепитием. Ищем внимательных собеседников и помощников для организации встречи.",
      "Алматы",
      "CARE",
      "Соседи рядом",
      5,
      8,
      "Медеуский район",
      false,
    ],
    [
      "Новая жизнь старых вещей",
      "Сортируем чистую одежду и собираем наборы для семей. Нужна помощь с маркировкой размеров и упаковкой. Удобное дело для первого волонтёрского опыта.",
      "Актобе",
      "CARE",
      "Команда «Мейірім»",
      2,
      7,
      "Район Астана",
      true,
    ],
    [
      "Посадим маленький городской сад",
      "Высаживаем саженцы вместе с соседями. Инструменты и вода будут на месте. Наденьте удобную одежду и возьмите многоразовую бутылку.",
      "Алматы",
      "ECOLOGY",
      "Зелёный квартал",
      9,
      15,
      "Ауэзовский район",
      false,
    ],
    [
      "Цифровая грамотность без сложностей",
      "Покажем пожилым людям, как пользоваться смартфоном и распознавать подозрительные сообщения. Нужны терпеливые помощники на практический мастер-класс.",
      "Астана",
      "EDUCATION",
      "Клуб «Цифрлық дос»",
      2,
      5,
      "Район Сарыарка",
      false,
    ],
    [
      "Обед с заботой",
      "Готовим и упаковываем горячие обеды вместе с командой. Нужны помощники на кухне и для выдачи наборов. До участия координатор расскажет о правилах работы.",
      "Шымкент",
      "FOOD",
      "Команда «Асар»",
      4,
      9,
      "Енбекшинский район",
      false,
    ],
  ];
  return rows.map(
    (
      [
        title,
        description,
        city,
        category,
        organizer,
        volunteers,
        targetVolunteers,
        location,
        urgent,
      ],
      i,
    ) => ({
      id: `demo-${i + 1}`,
      title,
      description,
      city,
      category,
      organizer,
      volunteers: i === 3 || i === 8 ? targetVolunteers : volunteers,
      targetVolunteers,
      date: localDate(i + 2),
      location,
      urgency: urgent ? "URGENT" : "NORMAL",
      status: i === 3 || i === 8 ? "COMPLETED" : "OPEN",
      createdAt: new Date().toISOString(),
    }),
  );
}
