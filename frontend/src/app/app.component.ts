import { Component, computed, inject, signal } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";
import { DataService, errorMessage } from "./data.service";
import {
  CATEGORY_META,
  CITIES,
  Category,
  CreateRequest,
  HelpRequest,
  Language,
  localDate,
} from "./models";
import { IconComponent } from "./icon.component";
import { KazakhstanMapComponent } from "./map/kazakhstan-map.component";
import { PROJECT_LINKS } from "./project-links";

type View = "overview" | "discover" | "responses" | "favorites" | "about";
type Modal = "create" | "detail" | "join" | "profile" | null;

@Component({
  selector: "app-root",
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, KazakhstanMapComponent],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.css",
})
export class AppComponent {
  readonly data = inject(DataService);
  readonly projectLinks = PROJECT_LINKS;
  readonly isLocalDevelopment = ["localhost", "127.0.0.1", "[::1]"].includes(
    window.location.hostname,
  );
  readonly meta = CATEGORY_META;
  readonly cities = CITIES;
  readonly categories = Object.keys(CATEGORY_META) as Category[];
  readonly language = signal<Language>("ru");
  readonly view = signal<View>("overview");
  readonly category = signal<Category | "">("");
  readonly city = signal("");
  readonly query = signal("");
  readonly sort = signal("recommended");
  readonly status = signal("OPEN");
  readonly mobileMenu = signal(false);
  readonly modal = signal<Modal>(null);
  readonly selectedId = signal("");
  readonly selectedRequest = computed(
    () => this.data.requests().find((r) => r.id === this.selectedId()) ?? null,
  );
  readonly visibleRequests = computed(() => {
    const q = this.query().toLocaleLowerCase().trim();
    const rows = this.data
      .requests()
      .filter(
        (r) =>
          (this.view() !== "favorites" ||
            this.data.favorites().includes(r.id)) &&
          (this.view() !== "responses" ||
            this.data.responses().includes(r.id)) &&
          (!this.city() || r.city === this.city()) &&
          (!this.category() || r.category === this.category()) &&
          (!this.status() || r.status === this.status()) &&
          (!q ||
            `${r.title} ${r.description} ${r.city} ${r.organizer}`
              .toLocaleLowerCase()
              .includes(q)),
      );
    return [...rows].sort((a, b) =>
      this.sort() === "date"
        ? a.date.localeCompare(b.date)
        : this.sort() === "newest"
          ? b.createdAt.localeCompare(a.createdAt)
          : Number(b.urgency === "URGENT") - Number(a.urgency === "URGENT"),
    );
  });
  readonly toast = signal("");
  readonly submitting = signal(false);
  readonly formError = signal("");
  readonly today = localDate();
  form: CreateRequest = this.newForm();
  volunteerName = "";
  profileName = "";
  private previousFocus: HTMLElement | null = null;
  private toastTimer: ReturnType<typeof setTimeout> | undefined;

  readonly words: Record<string, [string, string]> = {
    tagline: ["Добро рядом", "Жақсылық жақын"],
    overview: ["Обзор", "Шолу"],
    discover: ["Найти доброе дело", "Игі іс табу"],
    responses: ["Мои отклики", "Менің өтінімдерім"],
    favorites: ["Избранное", "Таңдаулылар"],
    about: ["О проекте", "Жоба туралы"],
    platform: [
      "ПЛАТФОРМА ВЗАИМОПОМОЩИ В КАЗАХСТАНЕ",
      "ҚАЗАҚСТАНДАҒЫ ӨЗАРА КӨМЕК ПЛАТФОРМАСЫ",
    ],
    hero1: ["Помогать — значит", "Көмектесу —"],
    hero2: ["быть рядом.", "жанынан табылу."],
    subtitle: [
      "Находите волонтёрские дела в Казахстане: помощь людям, природе и животным. Выберите город и присоединитесь к команде.",
      "Қазақстанда адамдарға, табиғатқа және жануарларға көмектесетін игі істерді табыңыз. Қалаңызды таңдап, топқа қосылыңыз.",
    ],
    create: ["Нужна помощь", "Көмек керек"],
    volunteer: ["Хочу помочь", "Көмектескім келеді"],
    active: ["Добрых дел ждут вас", "Игі іс сізді күтеді"],
    people: ["Участий волонтёров", "Еріктілердің қатысуы"],
    cities: ["Городов объединяем", "Қаланы біріктіреміз"],
    completed: ["Дел завершено", "Іс аяқталды"],
    mapTitle: ["Добро на карте страны", "Ел картасындағы жақсылық"],
    mapSub: [
      "Выберите город и найдите, где вы нужны",
      "Қаланы таңдап, көмек қажет жерді табыңыз",
    ],
    allCities: ["Весь Казахстан", "Бүкіл Қазақстан"],
    together1: ["Вместе мы", "Бірге біз"],
    together2: ["можем больше.", "көбірек жасаймыз."],
    togetherSub: [
      "Ваше время и участие могут стать для кого-то целым миром.",
      "Сіздің уақытыңыз бен қолдауыңыз біреудің өмірін өзгерте алады.",
    ],
    firstStep: ["Сделать первый шаг", "Алғашқы қадам жасау"],
    list: ["Кому поможем сегодня?", "Бүгін кімге көмектесеміз?"],
    listSub: [
      "Найдите дело, которое отзывается в сердце",
      "Жүрегіңізге жақын істі табыңыз",
    ],
    all: ["Все дела", "Барлық іс"],
    search: ["Поиск доброго дела...", "Игі істі іздеу..."],
    recommended: ["Сначала срочные", "Алдымен шұғыл"],
    byDate: ["По дате события", "Өтетін күні бойынша"],
    newest: ["Сначала новые", "Алдымен жаңалары"],
    urgent: ["Нужна помощь", "Көмек қажет"],
    details: ["Подробнее", "Толығырақ"],
    join: ["Откликнуться", "Қатысу"],
    joined: ["Вы участвуете", "Сіз қатысасыз"],
    full: ["Команда собрана", "Топ жиналды"],
    empty: ["Здесь пока тихо", "Әзірге бос"],
    emptySub: [
      "Попробуйте другой город или категорию. А может, именно вы начнёте новое доброе дело?",
      "Басқа қала не санатты таңдаңыз. Немесе жаңа игі істі өзіңіз бастаңыз.",
    ],
    reset: ["Сбросить фильтры", "Сүзгілерді тазалау"],
    demo: ["Интерактивная демоверсия", "Интерактивті демо нұсқа"],
    api: ["Java API подключён", "Java API қосылды"],
    fictional: [
      "Учебный проект. Все заявки и команды вымышлены.",
      "Оқу жобасы. Барлық өтінімдер мен топтар ойдан шығарылған.",
    ],
    close: ["Закрыть", "Жабу"],
    name: ["Ваше имя", "Атыңыз"],
    cancel: ["Отмена", "Бас тарту"],
    save: ["Сохранить", "Сақтау"],
    sending: ["Сохраняем...", "Сақталуда..."],
    createTitle: ["Начнём доброе дело", "Игі істі бастайық"],
    createSub: [
      "Расскажите, кому и какая помощь нужна. Так вас быстрее найдут.",
      "Кімге қандай көмек керек екенін айтыңыз.",
    ],
    title: ["Название дела", "Істің атауы"],
    description: ["Что нужно сделать?", "Не істеу керек?"],
    city: ["Город", "Қала"],
    cat: ["Категория", "Санат"],
    organizer: ["Команда или организатор", "Топ немесе ұйымдастырушы"],
    date: ["Дата события", "Өтетін күні"],
    location: ["Место встречи / район", "Кездесу орны / аудан"],
    capacity: ["Сколько нужно волонтёров?", "Қанша ерікті қажет?"],
    urgentCheck: ["Помощь нужна срочно", "Шұғыл көмек керек"],
    publish: ["Создать заявку", "Өтінім жасау"],
    joinTitle: ["Ваше участие важно", "Сіздің қатысуыңыз маңызды"],
    joinSub: [
      "Представьтесь, чтобы присоединиться к команде.",
      "Топқа қосылу үшін атыңызды жазыңыз.",
    ],
    joinNote: [
      "В демопроекте отклик сохраняется без отправки организатору. Реальные контакты здесь не собираются.",
      "Деможобада өтінім ұйымдастырушыға жіберілмей сақталады. Нақты байланыс деректері жиналмайды.",
    ],
    profile: ["Давайте познакомимся", "Танысайық"],
    profileSub: [
      "Имя будет подставляться в ваши отклики.",
      "Атыңыз өтінімдеріңізге автоматты түрде қойылады.",
    ],
    guest: ["Гость", "Қонақ"],
    organizerLabel: ["Организатор", "Ұйымдастырушы"],
    team: ["Команда волонтёров", "Еріктілер тобы"],
    aboutTitle: [
      "Помочь проще, когда знаешь где.",
      "Қайда көмектесу керегін білсеңіз, бәрі оңай.",
    ],
    aboutSub: [
      "Qamqor объединяет локальные инициативы Казахстана в одном месте. Здесь волонтёр может найти дело рядом, а организатор — собрать команду для помощи людям, природе и животным.",
      "Qamqor Қазақстандағы жергілікті бастамаларды бір жерге жинайды. Еріктілер жақын жердегі игі істі табады, ал ұйымдастырушылар адамдарға, табиғатқа және жануарларға көмектесетін топ құрады.",
    ],
    localNote: [
      "Избранное, имя и отклики сохраняются в этом браузере.",
      "Таңдаулылар, атыңыз және өтінімдер осы браузерде сақталады.",
    ],
    sideTitle: ["У добра нет", "Жақсылықтың"],
    sideTitle2: ["маленьких дел.", "кішісі жоқ."],
    sideSub: [
      "Даже один час может многое изменить.",
      "Бір сағат та көп нәрсені өзгерте алады.",
    ],
    connecting: ["Подключение...", "Қосылуда..."],
    connect: ["Подключить Java API", "Java API қосу"],
    results: ["Найдено дел", "Табылған істер"],
    clearCity: ["Все города", "Барлық қала"],
    favoriteAdd: ["Сохранить в избранное", "Таңдаулыларға қосу"],
    favoriteRemove: ["Убрать из избранного", "Таңдаулылардан жою"],
    statusOpen: ["Нужны волонтёры", "Еріктілер қажет"],
    statusCompleted: ["Завершённые", "Аяқталған"],
    statusAll: ["Все статусы", "Барлық мәртебе"],
    sourceCode: ["Исходный код на GitHub", "GitHub-тағы бастапқы код"],
    aboutLink: [
      "Идея и возможности проекта",
      "Жобаның идеясы мен мүмкіндіктері",
    ],
    howItWorks: ["Три шага к доброму делу", "Игі іске үш қадам"],
    stepCity: ["Выберите город", "Қаланы таңдаңыз"],
    stepCitySub: [
      "Нажмите на город на 3D-карте или выберите его в фильтре.",
      "3D картадан қаланы басыңыз немесе оны сүзгіден таңдаңыз.",
    ],
    stepFind: ["Найдите своё дело", "Өзіңізге жақын істі табыңыз"],
    stepFindSub: [
      "Посмотрите задачу, дату и нужное количество волонтёров. Сохраните интересное в избранное.",
      "Тапсырманы, күнін және қажетті еріктілер санын қараңыз. Ұнаған істі таңдаулыларға сақтаңыз.",
    ],
    stepJoin: ["Присоединитесь", "Топқа қосылыңыз"],
    stepJoinSub: [
      "Откликнитесь на инициативу или создайте свою. Участие появится в разделе «Мои отклики».",
      "Бастамаға қатысыңыз немесе өз ісіңізді жасаңыз. Қатысу «Менің өтінімдерім» бөлімінде көрінеді.",
    ],
    portfolioTitle: [
      "Социальная идея. Полный цикл разработки.",
      "Әлеуметтік идея. Толық әзірлеу циклі.",
    ],
    portfolioSub: [
      "Открытый проект для портфолио: от интерфейса и 3D-визуализации до Java API и базы данных. Демо работает сразу в браузере — можно попробовать поиск, создание заявки и отклик.",
      "Портфолиоға арналған ашық жоба: интерфейс пен 3D көріністен Java API мен дерекқорға дейін. Демо браузерде бірден жұмыс істейді: іздеуді, өтінім жасауды және қатысуды қолданып көріңіз.",
    ],
  };

  t(key: string): string {
    return this.words[key]?.[this.language() === "ru" ? 0 : 1] ?? key;
  }
  categoryName(category: Category): string {
    return this.meta[category][this.language()];
  }
  setLanguage(language: Language): void {
    this.language.set(language);
    document.documentElement.lang = language;
  }

  navigate(view: View): void {
    this.view.set(view);
    this.mobileMenu.set(false);
    this.resetFilters();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
  resetFilters(): void {
    this.city.set("");
    this.query.set("");
    this.category.set("");
    this.status.set(
      this.view() === "favorites" || this.view() === "responses" ? "" : "OPEN",
    );
  }
  findHelp(): void {
    this.navigate("discover");
  }
  chooseCity(city: string): void {
    this.city.set(this.city() === city ? "" : city);
  }
  progress(request: HelpRequest): number {
    return Math.min(100, (request.volunteers / request.targetVolunteers) * 100);
  }
  isJoined(request: HelpRequest): boolean {
    return this.data.responses().includes(request.id);
  }
  isFull(request: HelpRequest): boolean {
    return (
      request.status !== "OPEN" ||
      request.volunteers >= request.targetVolunteers
    );
  }
  formatDate(value: string): string {
    return new Date(`${value}T12:00:00`).toLocaleDateString(
      this.language() === "ru" ? "ru-RU" : "kk-KZ",
      { day: "numeric", month: "short" },
    );
  }

  openModal(modal: Modal, request?: HelpRequest): void {
    if (!this.modal())
      this.previousFocus = document.activeElement as HTMLElement;
    this.formError.set("");
    if (request) this.selectedId.set(request.id);
    if (modal === "create") this.form = this.newForm();
    if (modal === "join") this.volunteerName = this.data.name();
    if (modal === "profile") this.profileName = this.data.name();
    this.modal.set(modal);
    document.body.style.overflow = "hidden";
    setTimeout(
      () =>
        (
          document.querySelector<HTMLElement>(".modal [data-initial-focus]") ??
          document.querySelector<HTMLElement>(".modal input") ??
          document.querySelector<HTMLElement>(".modal .modal-close")
        )?.focus(),
      40,
    );
  }

  closeModal(): void {
    if (this.submitting()) return;
    this.modal.set(null);
    document.body.style.overflow = "";
    this.previousFocus?.focus();
  }
  onDialogKey(event: KeyboardEvent): void {
    if (event.key === "Escape") {
      event.preventDefault();
      this.closeModal();
    }
    if (event.key !== "Tab") return;
    const elements = Array.from(
      document.querySelectorAll<HTMLElement>(
        ".modal button:not(:disabled), .modal input, .modal textarea, .modal select",
      ),
    ).filter((el) => el.getClientRects().length);
    const first = elements[0];
    const last = elements[elements.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  async create(valid: boolean): Promise<void> {
    if (!valid || this.submitting()) return;
    if (
      this.form.title.trim().length < 8 ||
      this.form.description.trim().length < 20 ||
      this.form.organizer.trim().length < 3 ||
      this.form.location.trim().length < 5 ||
      this.form.date < this.today
    ) {
      this.formError.set(
        this.language() === "ru"
          ? "Проверьте поля: название — от 8 символов, описание — от 20, организатор — от 3, место — от 5. Дата не должна быть в прошлом."
          : "Өрістерді тексеріңіз: атау — 8, сипаттама — 20, ұйымдастырушы — 3, орын — 5 таңбадан кем болмауы керек. Күні өткен болмауы тиіс.",
      );
      return;
    }
    this.submitting.set(true);
    this.formError.set("");
    try {
      const request = await this.data.create({
        ...this.form,
        title: this.form.title.trim(),
        description: this.form.description.trim(),
        organizer: this.form.organizer.trim(),
        location: this.form.location.trim(),
      });
      this.submitting.set(false);
      this.closeModal();
      this.navigate("discover");
      this.selectedId.set(request.id);
      this.sort.set("newest");
      this.notify(
        this.language() === "ru"
          ? "Доброе дело создано. Спасибо за инициативу!"
          : "Игі іс жасалды. Бастамаңызға рақмет!",
      );
    } catch (error) {
      this.formError.set(errorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
  async join(valid: boolean): Promise<void> {
    const request = this.selectedRequest();
    if (!valid || !request || !this.volunteerName.trim() || this.submitting())
      return;
    this.submitting.set(true);
    this.formError.set("");
    try {
      await this.data.volunteer(request, this.volunteerName.trim());
      this.submitting.set(false);
      this.closeModal();
      this.notify(
        this.language() === "ru"
          ? "Вы в команде! Отклик появился в разделе «Мои отклики»."
          : "Сіз топқа қосылдыңыз! Өтініміңіз сақталды.",
      );
    } catch (error) {
      this.formError.set(errorMessage(error));
    } finally {
      this.submitting.set(false);
    }
  }
  saveProfile(valid: boolean): void {
    if (!valid || !this.profileName.trim()) return;
    this.data.saveName(this.profileName);
    this.closeModal();
    this.notify(
      this.language() === "ru"
        ? "Рады знакомству, " + this.data.name() + "!"
        : "Танысқаныма қуаныштымын, " + this.data.name() + "!",
    );
  }
  notify(message: string): void {
    clearTimeout(this.toastTimer);
    this.toast.set(message);
    this.toastTimer = setTimeout(() => this.toast.set(""), 5500);
  }

  private newForm(): CreateRequest {
    return {
      title: "",
      description: "",
      city: "Алматы",
      category: "CARE",
      urgency: "NORMAL",
      organizer: "",
      targetVolunteers: 5,
      date: localDate(1),
      location: "",
    };
  }
}
