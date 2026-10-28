import { Injectable, computed, inject, signal } from "@angular/core";
import { HttpClient, HttpErrorResponse } from "@angular/common/http";
import { firstValueFrom, timeout } from "rxjs";
import { environment } from "../environments/environment";
import {
  CATEGORY_META,
  CreateRequest,
  HelpRequest,
  seedRequests,
} from "./models";

@Injectable({ providedIn: "root" })
export class DataService {
  private readonly http = inject(HttpClient);
  readonly requests = signal<HelpRequest[]>(this.loadRequests());
  readonly favorites = signal<string[]>(this.loadIds("favorites"));
  readonly responses = signal<string[]>(this.loadIds("responses"));
  readonly name = signal(this.loadName());
  readonly mode = signal<"demo" | "api">("demo");
  readonly connecting = signal(false);
  readonly connectionError = signal("");
  readonly storageWarning = signal(false);
  readonly stats = computed(() => ({
    activeRequests: this.requests().filter((r) => r.status === "OPEN").length,
    volunteers: this.requests().reduce((sum, r) => sum + r.volunteers, 0),
    cities: new Set(this.requests().map((r) => r.city)).size,
    completedRequests: this.requests().filter((r) => r.status === "COMPLETED")
      .length,
  }));

  constructor() {
    if (environment.apiEnabled) void this.connect();
  }

  async connect(): Promise<void> {
    this.connecting.set(true);
    this.connectionError.set("");
    try {
      const requests = await firstValueFrom(
        this.http.get<HelpRequest[]>("/api/requests").pipe(timeout(6000)),
      );
      if (!Array.isArray(requests)) throw new Error("Invalid API response");
      this.requests.set(requests);
      this.mode.set("api");
    } catch {
      this.connectionError.set(
        this.mode() === "api"
          ? "Java API временно недоступен. Показаны последние загруженные данные; повторите подключение."
          : "Не удалось подключиться к Java API. Сейчас доступны демоданные в браузере.",
      );
    } finally {
      this.connecting.set(false);
    }
  }

  async create(payload: CreateRequest): Promise<HelpRequest> {
    const request =
      this.mode() === "api"
        ? await firstValueFrom(
            this.http
              .post<HelpRequest>("/api/requests", payload)
              .pipe(timeout(10000)),
          )
        : {
            ...payload,
            id: `local-${crypto.randomUUID()}`,
            volunteers: 0,
            status: "OPEN" as const,
            createdAt: new Date().toISOString(),
          };
    this.requests.update((rows) => [request, ...rows]);
    this.persistRequests();
    return request;
  }

  async volunteer(request: HelpRequest, name: string): Promise<void> {
    if (
      request.status !== "OPEN" ||
      request.volunteers >= request.targetVolunteers
    )
      throw new Error("Все места уже заняты. Выберите другое доброе дело.");
    if (this.responses().includes(request.id))
      throw new Error("Вы уже откликнулись на эту заявку.");
    const updated =
      this.mode() === "api"
        ? await firstValueFrom(
            this.http
              .post<HelpRequest>(`/api/requests/${request.id}/volunteer`, {
                name,
              })
              .pipe(timeout(10000)),
          )
        : { ...request, volunteers: request.volunteers + 1 };
    this.requests.update((rows) =>
      rows.map((r) => (r.id === updated.id ? updated : r)),
    );
    this.responses.update((ids) => [...ids, updated.id]);
    this.write("responses", this.responses());
    this.saveName(name);
    this.persistRequests();
  }

  toggleFavorite(id: string): void {
    this.favorites.update((ids) =>
      ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id],
    );
    this.write("favorites", this.favorites());
  }

  saveName(name: string): void {
    this.name.set(name.trim());
    this.write("name", name.trim());
  }

  private persistRequests(): void {
    if (this.mode() === "demo") this.write("requests", this.requests());
  }
  private read<T>(key: string, fallback: T): T {
    try {
      return (
        (JSON.parse(localStorage.getItem(`qamqor-v1-${key}`) ?? "null") as T) ??
        fallback
      );
    } catch {
      return fallback;
    }
  }
  private loadIds(key: "favorites" | "responses"): string[] {
    const value = this.read<unknown>(key, []);
    return Array.isArray(value)
      ? [...new Set(value.filter((id): id is string => typeof id === "string"))]
      : [];
  }
  private loadName(): string {
    const value = this.read<unknown>("name", "");
    return typeof value === "string" ? value.trim() : "";
  }
  private write(key: string, value: unknown): void {
    try {
      localStorage.setItem(`qamqor-v1-${key}`, JSON.stringify(value));
    } catch {
      this.storageWarning.set(true);
    }
  }
  private loadRequests(): HelpRequest[] {
    const rows = this.read<HelpRequest[]>("requests", []);
    return Array.isArray(rows) &&
      rows.length > 0 &&
      rows.every(
        (row) =>
          row &&
          typeof row.id === "string" &&
          typeof row.title === "string" &&
          row.category in CATEGORY_META &&
          Number.isFinite(row.volunteers) &&
          Number.isFinite(row.targetVolunteers),
      )
      ? rows
      : seedRequests();
  }
}

export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse)
    return typeof error.error?.detail === "string"
      ? error.error.detail
      : "Сервер недоступен. Проверьте подключение и повторите попытку.";
  return error instanceof Error
    ? error.message
    : "Не удалось сохранить. Попробуйте ещё раз.";
}
