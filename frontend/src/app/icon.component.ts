import { Component, Input } from "@angular/core";

@Component({
  selector: "app-icon",
  standalone: true,
  template: `<svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.65"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <path [attr.d]="paths[name] || paths['heart']" />
  </svg>`,
  styles: [
    ":host{display:inline-flex;width:20px;height:20px;flex-shrink:0}svg{width:100%;height:100%}",
  ],
})
export class IconComponent {
  @Input() name = "heart";
  readonly paths: Record<string, string> = {
    heart:
      "M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z",
    grid: "M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z",
    search: "M21 21l-5-5 M18 10a8 8 0 1 1-16 0 8 8 0 0 1 16 0",
    bookmark: "M6 3h12v18l-6-4-6 4V3Z",
    hands:
      "M3 12l4-5 5 2 5-2 4 5-6 8h-4l-5-5 M3 12l3 3 M21 12l-3 3 M7 7l3-3 4 1 3 2 M9 12l3 3 4-4",
    info: "M12 11v6 M12 7h.01 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0",
    arrow: "M5 12h14 M13 6l6 6-6 6",
    chevron: "M9 5l7 7-7 7",
    down: "M6 9l6 6 6-6",
    plus: "M12 5v14 M5 12h14",
    pin: "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z M15 10a3 3 0 1 1-6 0 3 3 0 0 1 6 0",
    people:
      "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M22 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
    leaf: "M20 3C6 1 1 10 6 16c6 6 15-1 14-13Z M4 21L16 9 M8 17v-5 M13 12h5",
    book: "M12 5v16 M3 3c4-1 7 0 9 2 2-2 5-3 9-2v16c-4-1-7 0-9 2-2-2-5-3-9-2V3Z",
    basket: "M3 9h18l-2 12H5L3 9Z M7 9l5-7 5 7 M9 13v4 M15 13v4",
    paw: "M8 14c-6 7 0 9 4 6 4 3 10 1 4-6-2-3-6-3-8 0Z M4 6c-3 0-3 5 0 5s3-5 0-5 M9 2c-3 0-3 6 0 6s3-6 0-6 M15 2c-3 0-3 6 0 6s3-6 0-6 M20 6c-3 0-3 5 0 5s3-5 0-5",
    calendar: "M3 5h18v16H3z M16 3v4 M8 3v4 M3 11h18 M8 15h2 M14 15h2",
    check: "M5 12l4 4L19 6",
    close: "M6 6l12 12 M6 18L18 6",
    spark: "M12 2l3 7 7 3-7 3-3 7-3-7-7-3 7-3 3-7Z",
    menu: "M4 6h16 M4 12h16 M4 18h16",
    globe:
      "M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0 M2 12h20 M12 2c-6 6-6 14 0 20 6-6 6-14 0-20",
    bolt: "M13 2L3 14h8l-1 8 11-13h-8l1-7Z",
  };
}
