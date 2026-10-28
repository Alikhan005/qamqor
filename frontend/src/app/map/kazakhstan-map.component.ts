import { CommonModule } from "@angular/common";
import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  Output,
  QueryList,
  ViewChild,
  ViewChildren,
} from "@angular/core";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

type Language = "ru" | "kk";
type Coordinate = readonly [number, number];
interface MapCity {
  name: string;
  kk: string;
  coordinates: Coordinate;
  primary?: boolean;
  align?: "left" | "bottom";
}

// A simplified geographic silhouette, drawn locally; this is not an administrative boundary dataset.
const OUTLINE: Coordinate[] = [
  [46.5, 48.5],
  [47.3, 49.2],
  [46.8, 50.4],
  [47.6, 50.8],
  [47.6, 51.7],
  [48.5, 52.3],
  [50.7, 51.8],
  [51.6, 51.5],
  [53.4, 51.5],
  [54.3, 51.0],
  [55.0, 51.7],
  [55.5, 53.0],
  [56.5, 54.0],
  [58.0, 54.1],
  [59.6, 54.6],
  [61.0, 54.0],
  [61.6, 54.4],
  [61.1, 54.9],
  [62.6, 55.5],
  [64.5, 54.7],
  [65.2, 54.7],
  [66.4, 55.0],
  [68.2, 55.4],
  [68.9, 55.4],
  [69.1, 55.0],
  [70.8, 55.2],
  [71.2, 54.3],
  [72.5, 54.1],
  [73.4, 53.5],
  [73.8, 54.0],
  [74.7, 53.8],
  [75.3, 54.0],
  [76.6, 53.6],
  [77.1, 54.1],
  [77.9, 53.5],
  [79.0, 52.9],
  [79.0, 51.8],
  [80.2, 50.9],
  [81.0, 51.0],
  [82.0, 50.7],
  [83.4, 51.0],
  [84.1, 50.4],
  [85.6, 50.2],
  [86.7, 49.8],
  [87.3, 49.1],
  [86.4, 48.4],
  [85.6, 48.2],
  [85.8, 47.1],
  [84.8, 46.8],
  [83.6, 47.0],
  [82.3, 46.5],
  [82.5, 45.8],
  [82.1, 45.2],
  [80.7, 45.0],
  [80.3, 44.7],
  [80.1, 44.1],
  [79.9, 43.5],
  [80.1, 42.9],
  [79.0, 42.8],
  [77.5, 42.9],
  [76.8, 42.9],
  [76.2, 42.5],
  [75.5, 42.6],
  [74.2, 42.5],
  [73.5, 42.4],
  [73.5, 42.9],
  [72.7, 42.8],
  [72.2, 42.2],
  [71.1, 42.2],
  [70.9, 41.5],
  [69.1, 41.4],
  [69.0, 41.0],
  [68.5, 40.7],
  [68.0, 41.2],
  [67.0, 41.2],
  [66.8, 41.9],
  [66.3, 42.0],
  [66.1, 42.9],
  [64.9, 43.7],
  [63.6, 43.6],
  [62.0, 43.6],
  [61.0, 44.2],
  [59.9, 44.8],
  [58.6, 45.6],
  [57.5, 45.6],
  [56.0, 45.0],
  [55.9, 41.3],
  [54.7, 41.0],
  [54.2, 42.4],
  [53.1, 42.2],
  [52.4, 42.8],
  [51.0, 43.1],
  [50.2, 44.5],
  [50.3, 44.9],
  [51.2, 45.2],
  [51.4, 45.8],
  [52.7, 46.6],
  [53.1, 46.7],
  [53.3, 47.3],
  [52.7, 47.8],
  [51.7, 47.4],
  [50.2, 46.8],
  [49.6, 46.4],
  [48.6, 46.5],
  [48.2, 47.1],
  [47.3, 47.1],
  [47.3, 47.7],
];

// Illustrative cartographic divisions, deliberately not presented as official region borders.
const DIVISIONS: Coordinate[][] = [
  [
    [55.9, 51.5],
    [56.3, 49.5],
    [56.8, 48],
    [55.8, 46.7],
    [55.9, 45],
  ],
  [
    [56.3, 49.5],
    [60, 49.8],
    [61.3, 51.3],
    [62, 53],
    [61.5, 54.5],
  ],
  [
    [61.3, 51.3],
    [64, 50.6],
    [64.5, 48.6],
    [62.3, 47],
    [61, 44.2],
  ],
  [
    [64.5, 48.6],
    [68, 48.6],
    [69.3, 47.2],
    [68.6, 44.4],
    [66.1, 42.9],
  ],
  [
    [64, 50.6],
    [66, 52],
    [65.2, 54.7],
  ],
  [
    [66, 52],
    [69, 52],
    [70, 53.5],
    [70.5, 55],
  ],
  [
    [69, 52],
    [70.8, 50.6],
    [73.4, 50.4],
    [74.4, 52.3],
    [73.8, 54],
  ],
  [
    [70.8, 50.6],
    [69.3, 47.2],
  ],
  [
    [73.4, 50.4],
    [75.6, 48.9],
    [78.3, 49.4],
    [79.2, 51.8],
  ],
  [
    [75.6, 48.9],
    [75.7, 46.7],
    [78.1, 45.4],
    [79.9, 44.5],
  ],
  [
    [75.7, 46.7],
    [72.3, 45.8],
    [71, 43.6],
    [69, 43.5],
  ],
  [
    [78.3, 49.4],
    [81.5, 48.2],
    [84.8, 48],
  ],
];

@Component({
  selector: "app-kazakhstan-map",
  standalone: true,
  imports: [CommonModule],
  templateUrl: "./kazakhstan-map.component.html",
  styleUrl: "./kazakhstan-map.component.css",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KazakhstanMapComponent
  implements AfterViewInit, OnChanges, OnDestroy
{
  @Input() city = "";
  @Input() language: Language = "ru";
  @Output() citySelect = new EventEmitter<string>();
  @ViewChild("canvas", { static: true })
  private canvas!: ElementRef<HTMLCanvasElement>;
  @ViewChild("viewport", { static: true })
  private viewport!: ElementRef<HTMLDivElement>;
  @ViewChildren("cityButton") private cityButtons!: QueryList<
    ElementRef<HTMLButtonElement>
  >;

  readonly cities: MapCity[] = [
    {
      name: "Алматы",
      kk: "Алматы",
      coordinates: [76.89, 43.24],
      primary: true,
    },
    {
      name: "Астана",
      kk: "Астана",
      coordinates: [71.43, 51.13],
      primary: true,
    },
    {
      name: "Шымкент",
      kk: "Шымкент",
      coordinates: [69.59, 42.32],
      align: "bottom",
    },
    { name: "Караганда", kk: "Қарағанды", coordinates: [73.1, 49.8] },
    { name: "Актобе", kk: "Ақтөбе", coordinates: [57.17, 50.28] },
    {
      name: "Атырау",
      kk: "Атырау",
      coordinates: [51.92, 47.11],
      align: "left",
    },
    { name: "Павлодар", kk: "Павлодар", coordinates: [76.97, 52.29] },
    { name: "Тараз", kk: "Тараз", coordinates: [71.37, 42.9] },
    { name: "Семей", kk: "Семей", coordinates: [80.26, 50.41] },
    { name: "Актау", kk: "Ақтау", coordinates: [51.17, 43.65], align: "left" },
  ];
  readonly fallbackPath =
    OUTLINE.map(
      ([x, y], i) => `${i ? "L" : "M"}${this.svgX(x)},${this.svgY(y)}`,
    ).join(" ") + "Z";
  readonly fallbackDivisions = DIVISIONS.map((points) =>
    points
      .map(([x, y], i) => `${i ? "L" : "M"}${this.svgX(x)},${this.svgY(y)}`)
      .join(" "),
  );
  fallback = false;
  zoomLevel = 1;

  private scene?: THREE.Scene;
  private renderer?: THREE.WebGLRenderer;
  private camera?: THREE.OrthographicCamera;
  private controls?: OrbitControls;
  private resizeObserver?: ResizeObserver;
  private frame = 0;
  private destroyed = false;
  private reducedMotion = false;
  private motionPreference?: MediaQueryList;
  private lastRender = 0;
  private readonly projected = new THREE.Vector3();
  private readonly markers: {
    group: THREE.Group;
    ring: THREE.Mesh;
    point: THREE.Vector3;
  }[] = [];
  private readonly onMotionChange = (event: MediaQueryListEvent) => {
    this.reducedMotion = event.matches;
    if (this.controls) this.controls.enableDamping = !event.matches;
    if (event.matches)
      this.markers.forEach((marker) => marker.ring.scale.setScalar(1));
  };
  private readonly onContextLost = (event: Event) => {
    event.preventDefault();
    this.zone.run(() => {
      this.fallback = true;
      cancelAnimationFrame(this.frame);
      this.changeDetector.markForCheck();
    });
  };

  constructor(
    private zone: NgZone,
    private changeDetector: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.motionPreference = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    );
    this.reducedMotion = this.motionPreference.matches;
    this.zone.runOutsideAngular(() => {
      this.motionPreference?.addEventListener("change", this.onMotionChange);
      try {
        this.createScene();
        this.resizeObserver = new ResizeObserver(() => this.resize());
        this.resizeObserver.observe(this.viewport.nativeElement);
        this.resize();
        this.animate(0);
      } catch {
        this.releaseScene();
        queueMicrotask(() => {
          if (this.destroyed) return;
          this.zone.run(() => {
            this.fallback = true;
            this.changeDetector.markForCheck();
          });
        });
      }
    });
  }

  ngOnChanges(): void {
    this.updateSelection();
  }

  selectCity(city: MapCity): void {
    this.citySelect.emit(city.name);
  }
  cityLabel(city: MapCity): string {
    return this.language === "kk" ? city.kk : city.name;
  }

  zoom(direction: number): void {
    this.zoomLevel = Math.min(
      1.65,
      Math.max(0.85, this.zoomLevel + direction * 0.15),
    );
    if (this.camera) {
      this.camera.zoom = this.zoomLevel;
      this.camera.updateProjectionMatrix();
    }
  }

  resetView(): void {
    this.zoomLevel = 1;
    if (!this.camera || !this.controls) return;
    this.camera.position.set(1.1, 14, 11);
    this.camera.zoom = 1;
    this.camera.updateProjectionMatrix();
    this.controls.target.set(0, 0, 0);
    this.controls.update();
  }

  svgX(longitude: number): number {
    return Math.round((longitude - 46) * 22 + 50);
  }
  svgY(latitude: number): number {
    return Math.round((56 - latitude) * 25 + 50);
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    cancelAnimationFrame(this.frame);
    this.resizeObserver?.disconnect();
    this.motionPreference?.removeEventListener("change", this.onMotionChange);
    this.releaseScene();
  }

  private position(
    [longitude, latitude]: Coordinate,
    height = 0.36,
  ): THREE.Vector3 {
    return new THREE.Vector3(
      (longitude - 67) * 0.44,
      height,
      -(latitude - 48) * 0.61,
    );
  }

  private createScene(): void {
    const canvas = this.canvas.nativeElement;
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      powerPreference: "low-power",
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1;
    canvas.addEventListener("webglcontextlost", this.onContextLost);

    this.scene = new THREE.Scene();
    this.camera = new THREE.OrthographicCamera(-11, 11, 6, -6, 0.1, 100);
    this.camera.position.set(1.1, 14, 11);
    this.camera.lookAt(0, 0, 0);
    this.controls = new OrbitControls(this.camera, canvas);
    this.controls.enableDamping = !this.reducedMotion;
    this.controls.dampingFactor = 0.07;
    this.controls.enablePan = false;
    this.controls.enableZoom = false;
    this.controls.minPolarAngle = 0.45;
    this.controls.maxPolarAngle = 1.05;
    this.controls.minAzimuthAngle = -0.3;
    this.controls.maxAzimuthAngle = 0.3;

    this.scene.add(new THREE.AmbientLight(0xffffff, 1.2));
    this.scene.add(new THREE.HemisphereLight(0xf7fbef, 0x99a99d, 1.4));
    const sun = new THREE.DirectionalLight(0xfff9e9, 2);
    sun.position.set(-5, 12, 6);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.left = -13;
    sun.shadow.camera.right = 13;
    sun.shadow.camera.top = 10;
    sun.shadow.camera.bottom = -10;
    sun.shadow.normalBias = 0.04;
    sun.shadow.bias = -0.0002;
    this.scene.add(sun);

    const shadow = new THREE.Mesh(
      new THREE.PlaneGeometry(70, 70),
      new THREE.ShadowMaterial({ opacity: 0.12 }),
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = -0.12;
    shadow.receiveShadow = true;
    this.scene.add(shadow);
    const grid = new THREE.GridHelper(50, 65, 0xc7d5cb, 0xc7d5cb);
    grid.position.y = -0.1;
    const gridMaterial = grid.material as THREE.Material;
    gridMaterial.transparent = true;
    gridMaterial.opacity = 0.24;
    gridMaterial.depthWrite = false;
    this.scene.add(grid);

    const shape = new THREE.Shape(
      OUTLINE.map(
        ([x, y]) => new THREE.Vector2((x - 67) * 0.44, (y - 48) * 0.61),
      ),
    );
    const terrain = new THREE.Mesh(
      new THREE.ExtrudeGeometry(shape, {
        depth: 0.32,
        bevelEnabled: true,
        bevelSegments: 2,
        steps: 1,
        bevelSize: 0.04,
        bevelThickness: 0.035,
      }),
      [
        new THREE.MeshStandardMaterial({ color: 0xb5c9a6, roughness: 0.96 }),
        new THREE.MeshStandardMaterial({ color: 0x88a083, roughness: 1 }),
      ],
    );
    terrain.rotation.x = -Math.PI / 2;
    terrain.castShadow = true;
    terrain.receiveShadow = true;
    this.scene.add(terrain);

    const outlinePoints = [...OUTLINE, OUTLINE[0]].map((point) =>
      this.position(point, 0.36),
    );
    this.scene.add(
      new THREE.Line(
        new THREE.BufferGeometry().setFromPoints(outlinePoints),
        new THREE.LineBasicMaterial({
          color: 0xf4f7e9,
          transparent: true,
          opacity: 0.8,
        }),
      ),
    );
    for (const division of DIVISIONS) {
      this.scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(
            division.map((point) => this.position(point, 0.367)),
          ),
          new THREE.LineBasicMaterial({
            color: 0xf7f8ef,
            transparent: true,
            opacity: 0.65,
          }),
        ),
      );
    }

    // Fine contour strokes give the southeast a gentle topographic texture.
    for (let i = 0; i < 5; i++) {
      const curve = new THREE.CatmullRomCurve3([
        this.position([75 + i * 0.23, 43.7 + i * 0.18], 0.37),
        this.position([77 + i * 0.2, 44.2 + i * 0.2], 0.37),
        this.position([78.4 + i * 0.18, 45.4 + i * 0.21], 0.37),
        this.position([80 + i * 0.17, 45.8 + i * 0.22], 0.37),
      ]);
      this.scene.add(
        new THREE.Line(
          new THREE.BufferGeometry().setFromPoints(curve.getPoints(35)),
          new THREE.LineBasicMaterial({
            color: 0xa8bea3,
            transparent: true,
            opacity: 0.32,
          }),
        ),
      );
    }

    for (const city of this.cities) {
      const group = new THREE.Group();
      const position = this.position(city.coordinates, 0.36);
      group.position.copy(position);
      const ring = new THREE.Mesh(
        new THREE.RingGeometry(0.13, 0.24, 36),
        new THREE.MeshBasicMaterial({
          color: 0x138e78,
          transparent: true,
          opacity: 0.2,
          side: THREE.DoubleSide,
          depthWrite: false,
        }),
      );
      ring.rotation.x = -Math.PI / 2;
      ring.position.y = 0.015;
      group.add(ring);
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(0.105, 0.14, 0.075, 24),
        new THREE.MeshStandardMaterial({ color: 0x178e78, roughness: 0.6 }),
      );
      base.position.y = 0.04;
      group.add(base);
      const stem = new THREE.Mesh(
        new THREE.CylinderGeometry(0.028, 0.028, 0.32, 12),
        new THREE.MeshStandardMaterial({ color: 0x2d9d85, roughness: 0.4 }),
      );
      stem.position.y = 0.23;
      group.add(stem);
      const sphere = new THREE.Mesh(
        new THREE.SphereGeometry(0.095, 20, 14),
        new THREE.MeshStandardMaterial({
          color: 0x087d68,
          emissive: 0x0c6755,
          emissiveIntensity: 0.25,
          roughness: 0.3,
        }),
      );
      sphere.position.y = 0.43;
      sphere.castShadow = true;
      group.add(sphere);
      this.scene.add(group);
      this.markers.push({
        group,
        ring,
        point: position.clone().add(new THREE.Vector3(0, 0.43, 0)),
      });
    }
    this.updateSelection();
  }

  private updateSelection(): void {
    this.markers.forEach((marker, i) => {
      const selected = this.cities[i].name === this.city;
      marker.group.scale.setScalar(selected ? 1.25 : 1);
      (marker.ring.material as THREE.MeshBasicMaterial).opacity = selected
        ? 0.4
        : 0.18;
      marker.point.y = 0.36 + 0.43 * (selected ? 1.25 : 1);
    });
  }

  private resize(): void {
    if (!this.camera || !this.renderer || this.destroyed) return;
    const { width, height } =
      this.viewport.nativeElement.getBoundingClientRect();
    if (!width || !height) return;
    const aspect = width / height;
    const horizontal = Math.max(21.5, 11.6 * aspect);
    this.camera.left = -horizontal / 2;
    this.camera.right = horizontal / 2;
    this.camera.top = horizontal / aspect / 2;
    this.camera.bottom = -horizontal / aspect / 2;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height, false);
  }

  private animate = (time: number): void => {
    if (this.destroyed || this.fallback) return;
    this.frame = requestAnimationFrame(this.animate);
    if (
      time - this.lastRender < 32 ||
      !this.scene ||
      !this.camera ||
      !this.renderer
    )
      return;
    this.lastRender = time;
    this.controls?.update();
    if (!this.reducedMotion) {
      this.markers.forEach((marker, i) => {
        marker.ring.scale.setScalar(
          1 + Math.sin(time * 0.0014 + i * 0.5) * 0.16,
        );
      });
    }
    this.renderer.render(this.scene, this.camera);
    const { clientWidth: width, clientHeight: height } =
      this.viewport.nativeElement;
    this.cityButtons.forEach((button, i) => {
      this.projected.copy(this.markers[i].point).project(this.camera!);
      const element = button.nativeElement;
      element.style.left = `${(this.projected.x * 0.5 + 0.5) * width}px`;
      element.style.top = `${(-this.projected.y * 0.5 + 0.5) * height}px`;
      element.style.visibility =
        Math.abs(this.projected.x) > 1.04 || Math.abs(this.projected.y) > 1.04
          ? "hidden"
          : "visible";
    });
  };

  private releaseScene(): void {
    this.controls?.dispose();
    this.canvas?.nativeElement.removeEventListener(
      "webglcontextlost",
      this.onContextLost,
    );
    this.scene?.traverse((object) => {
      const renderable = object as THREE.Mesh;
      renderable.geometry?.dispose();
      if (Array.isArray(renderable.material))
        renderable.material.forEach((material) => material.dispose());
      else renderable.material?.dispose();
      if (object instanceof THREE.Light)
        (object as THREE.DirectionalLight).shadow?.dispose();
    });
    this.scene?.clear();
    this.renderer?.dispose();
    this.renderer = undefined;
    this.markers.length = 0;
  }
}
