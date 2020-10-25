import {
  AfterViewInit,
  Component,
  ElementRef,
  HostListener,
  ViewChild,
  Output,
  EventEmitter,
} from '@angular/core';
import {
  Camera,
  CubeTexture,
  Engine,
  MeshBuilder,
  Scene,
  StandardMaterial,
  Texture,
  Vector3,
  AssetsManager,
  MeshAssetTask,
  Color3,
  Mesh,
  DirectionalLight,
  FlyCamera,
  HemisphericLight,
  ShadowGenerator,
  Color4,
} from '@babylonjs/core';
import '@babylonjs/loaders/OBJ';
import {
  S2Climate,
  S2Weather,
  S2Class,
  S2State,
} from '@stranded-ii-fanpage/enums';
import { S2PlayerItem, S2Instance } from '@stranded-ii-fanpage/api-interfaces';
import { S2Object, S2Unit, S2Item } from '@stranded-ii-fanpage/classes';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-game',
  templateUrl: './game.component.html',
  styleUrls: ['./game.component.scss'],
})
export class GameComponent implements AfterViewInit {
  @ViewChild('gameCanvas') canvas: ElementRef;
  @Output() quitGame: EventEmitter<void> = new EventEmitter<void>();

  public engine: Engine;
  public scene: Scene;
  public camera: Camera;

  public assetsManager: AssetsManager;

  public ambientLight: HemisphericLight;
  public sun: DirectionalLight;
  public terrainMesh: Mesh;
  public ocean: Mesh;
  public skyBox: Mesh;

  public shadowGenerator: ShadowGenerator;

  public hourFactor: number;
  public lightColors: Array<{ r: number; g: number; b: number }>;

  public activeMenu: string;

  public settings: any;

  // REMOVE AGAIN LATER
  public temp: {};

  public debugModeEnabled: boolean;
  public viewRange: number;
  public goreMode: boolean;

  public game: {
    sounds: any[];
    variables: Array<any>;
    map: {
      units: S2Instance[];
      objects: S2Instance[];
      items: S2Instance[];
      infos: S2Instance[];
      climate: S2Climate;
      weather: S2Weather;
    };
    time: number;
    day: number;
    rainRatio: number;
    snowRatio: number;
    music: HTMLAudioElement;
  };

  public player: {
    enery: number;
    hunger: number;
    thirst: number;
    exhaustion: number;
    jump: {
      time: number;
      factor: number;
    };
    air: {
      available: number;
      maximum: number;
    };
    showCompass: boolean;
    weapon: number;
    ammo: number;
    skills: any;
    items: S2PlayerItem[];
    sleeping: boolean;
    speed: number;
    maxWeight: number;
    damage: number;
  };

  public objects: S2Object[];
  public units: S2Unit[];
  public items: S2Item[];

  @HostListener('window:resize', ['$event'])
  onResize() {
    if (this.engine) {
      this.engine.resize();
    }
  }

  @HostListener('document:keydown', ['$event'])
  public handleKeyboardEvent(event: KeyboardEvent): void {
    // console.log(`[KEY DOWN]`, event);
  }

  constructor(private http: HttpClient) {
    this.temp = {};

    this.activeMenu = 'main';

    this.settings = {
      scaleFactor: 0.2,
    };

    this.debugModeEnabled = false;
    this.viewRange = 2000; // TODO: might be changed for BabylonJS
    this.goreMode = false;

    this.objects = [];
    this.units = [];
    this.items = [];

    this.game = {
      sounds: [],
      variables: [],
      map: {
        units: [],
        objects: [],
        items: [],
        infos: [],
        climate: S2Climate.SUN_AND_RAIN,
        weather: S2Weather.SUN,
      },
      time: 8 * this.hourFactor,
      day: 1,
      rainRatio: 0.3,
      snowRatio: 0.1,
      music: new Audio(),
    };

    this.player = {
      enery: 0,
      hunger: 0,
      thirst: 0,
      exhaustion: 0,
      jump: {
        time: 1.7,
        factor: 1,
      },
      air: {
        available: 30,
        maximum: 30,
      },
      showCompass: true,
      weapon: -1,
      ammo: -1,
      skills: {
        digging: { description: 'Graben', value: 0 },
        fishing: { description: 'Angeln', value: 0 },
        hunting: { description: 'Jagen', value: 0 },
        planting: { description: 'Anpflanzen', value: 0 },
        lumbering: { description: 'Holzfällen', value: 0 },
      },
      items: [],
      sleeping: false,
      speed: 1.7,
      maxWeight: 25000,
      damage: 3,
    };

    this.hourFactor = 60;

    setInterval(() => {
      this.game.time++;
      if (this.game.time >= 24 * this.hourFactor) {
        this.game.time = 0;
        this.game.day++;
      }
      // this.dayNightCycle();
    }, 1000);
  }

  ngAfterViewInit() {
    this.lightColors = [
      { r: 23, g: 23, b: 55 },
      { r: 23, g: 23, b: 55 },
      { r: 23, g: 23, b: 55 },
      { r: 23, g: 23, b: 55 },
      { r: 23, g: 23, b: 55 },
      { r: 40, g: 40, b: 70 },
      { r: 70, g: 70, b: 120 },
      { r: 255, g: 100, b: 50 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 255, b: 255 },
      { r: 255, g: 100, b: 50 },
      { r: 100, g: 100, b: 150 },
      { r: 40, g: 40, b: 70 },
    ];

    this.engine = new Engine(this.canvas.nativeElement, true);
    this.createScene();
    this.createSkyBox();
    this.createTerrain();
    this.createOcean();
  }

  createScene(): void {
    // Create Empty Scene
    this.scene = new Scene(this.engine);
    this.scene.clearColor = Color4.FromInts(23, 23, 55, 255);

    // Create Camera
    this.camera = new FlyCamera('Camera', new Vector3(0, 20, -70), this.scene);
    this.camera.attachControl(this.canvas.nativeElement, true);

    // Create Ambient Light
    this.ambientLight = new HemisphericLight(
      'AmbientLight',
      new Vector3(0, -1, 0),
      this.scene
    );
    this.ambientLight.groundColor = new Color3(0.5, 0.5, 0.5);

    // Create Sun Light and Shadow Generator
    const sunLightDirection: Vector3 = new Vector3(1, -1, 2);
    const sunPosition: Vector3 = new Vector3(0, 50, -30);
    this.sun = new DirectionalLight('Sun', sunLightDirection, this.scene);
    this.sun.specular = new Color3(0.2, 0.2, 0.2);
    this.sun.diffuse = new Color3(0.5, 0.5, 0.5);
    this.sun.position = sunPosition;
    const sunBall = MeshBuilder.CreateSphere('SunBall', {}, this.scene);
    sunBall.position = sunPosition;
    this.shadowGenerator = new ShadowGenerator(1024, this.sun);

    // Register Assets Manager
    this.assetsManager = new AssetsManager(this.scene);
    this.loadObjects();
  }

  loadObjects() {
    this.http
      .get('/assets/objects/objects-all.json')
      .subscribe((groupedObjects: object) => {
        for (const group in groupedObjects) {
          if (groupedObjects.hasOwnProperty(group)) {
            groupedObjects[group].forEach((obj: S2Object) => {
              // console.info('[OBJECT]', obj);

              const gameObject: S2Object = new S2Object();
              gameObject.id = obj.id;
              gameObject.icon = null; // TODO: load image
              gameObject.model = null; // TODO:
              gameObject.scale = obj.scale || {
                x: 1,
                y: 1,
                z: 1,
              };
              gameObject.color = obj.color || null;

              gameObject.health = obj.health;
              gameObject.behaviour = null; // TODO:
              gameObject.collision = null; // TODO:
              gameObject.material = null; // TODO:
              gameObject.maxWeight = obj.maxWeight || 25000;
              if (gameObject.sway) {
                gameObject.sway.speed = obj.sway.speed || 0;
                gameObject.sway.power = obj.sway.power || 0;
              } else {
                gameObject.sway = {
                  speed: 0,
                  power: 0,
                };
              }
              this.objects.push(gameObject);

              const meshTask = this.assetsManager.addMeshTask(
                `Object #${obj.id}`,
                '',
                '/assets/objects/',
                obj.model
              );
              meshTask.onSuccess = (task: MeshAssetTask) => {
                console.info('[LOADED MESH]', task);

                task.loadedMeshes.forEach((mesh: Mesh) => {
                  mesh.scaling = new Vector3(
                    gameObject.scale.x * this.settings.scaleFactor,
                    gameObject.scale.y * this.settings.scaleFactor,
                    gameObject.scale.z * this.settings.scaleFactor
                  );

                  // TODO: only for now
                  mesh.position = new Vector3(0, 5, -30);

                  const material: StandardMaterial = mesh.material as StandardMaterial;
                  material.backFaceCulling = obj.backFaceCulling;
                  material.diffuseTexture.hasAlpha = true;

                  mesh.setEnabled(false);
                  mesh.visibility = 0;

                  // Cast Shadow
                  // TODO: only activate if enabled in settings
                  this.shadowGenerator.addShadowCaster(mesh);
                });
              };
            });
          }
        }

        this.assetsManager.onFinish = () => {
          // Register a render loop to repeatedly render the scene
          this.engine.runRenderLoop(() => this.mainLoop());
        };

        this.assetsManager.load();
      });
  }

  mainLoop() {
    this.scene.render();
  }

  createSkyBox() {
    this.skyBox = MeshBuilder.CreateBox('skyBox', { size: 500.0 }, this.scene);
    const skyboxMaterial = new StandardMaterial('skyBox', this.scene);
    skyboxMaterial.backFaceCulling = false;
    skyboxMaterial.reflectionTexture = new CubeTexture(
      '/assets/textures/TropicalSunnyDay',
      this.scene
    );
    skyboxMaterial.reflectionTexture.coordinatesMode = Texture.SKYBOX_MODE;
    skyboxMaterial.disableLighting = true;
    this.skyBox.material = skyboxMaterial;

    // TODO: move skybox if player moves
  }

  createTerrain() {
    this.terrainMesh = Mesh.CreateGroundFromHeightMap(
      'terrain',
      '/assets/textures/heightmap.png',
      200,
      200,
      250,
      0,
      10,
      this.scene,
      false,
      () => {
        const desertMaterial: StandardMaterial = new StandardMaterial(
          'desert',
          this.scene
        );
        const desertTexture: Texture = new Texture(
          '/assets/textures/desert.jpeg',
          this.scene
        );
        desertTexture.uScale = 15;
        desertTexture.vScale = 15;
        desertMaterial.diffuseTexture = desertTexture;
        this.terrainMesh.material = desertMaterial;

        this.terrainMesh.receiveShadows = true;
      }
    );
  }

  createOcean() {
    this.ocean = MeshBuilder.CreatePlane('plane', {}, this.scene);
    const oceanMaterial: StandardMaterial = new StandardMaterial(
      'ocean',
      this.scene
    );
    const oceanTexture: Texture = new Texture(
      '/assets/textures/ocean.jpg',
      this.scene
    );
    oceanTexture.uScale = 15;
    oceanTexture.vScale = 15;
    oceanMaterial.diffuseTexture = oceanTexture;
    oceanMaterial.alpha = 0.5;
    this.ocean.material = oceanMaterial;
    this.ocean.position = new Vector3(0, 2, 0);
    this.ocean.rotation = new Vector3(Math.PI / 2, 0, 0);
    this.ocean.scaling = new Vector3(200, 200, 200);
  }

  dayNightCycle() {
    const fullHour: number = Math.floor(this.game.time / this.hourFactor);
    const minuteFactor: number =
      (this.game.time % this.hourFactor) / this.hourFactor;

    const currentSunLight: Color3 = Color3.FromInts(
      (1 - minuteFactor) * this.lightColors[fullHour].r +
        minuteFactor * this.lightColors[(fullHour + 1) % 24].r,
      (1 - minuteFactor) * this.lightColors[fullHour].g +
        minuteFactor * this.lightColors[(fullHour + 1) % 24].g,
      (1 - minuteFactor) * this.lightColors[fullHour].b +
        minuteFactor * this.lightColors[(fullHour + 1) % 24].b
    );
    const currentAmbientLight = currentSunLight.subtract(
      new Color3(0.25, 0.25, 0.25)
    );

    this.ambientLight.groundColor = currentAmbientLight;
    this.ambientLight.specular = currentAmbientLight;
    this.ambientLight.diffuse = currentAmbientLight;

    this.sun.specular = currentSunLight;
    this.sun.diffuse = currentSunLight;

    if (this.game.time <= 4 * this.hourFactor) {
      this.skyBox.material.alpha = 0.1;
    } else if (
      this.game.time > 4 * this.hourFactor &&
      this.game.time <= 5 * this.hourFactor
    ) {
      this.skyBox.material.alpha = 0.2;
    } else {
      this.skyBox.material.alpha = 1;
    }
  }

  /* In-Game Functions */
  abs(value: number): number {
    return Math.abs(value);
  }
  add() {}
  addscript(s2Class: S2Class, id: any, source: any) {}
  addstate(s2Class: S2Class, id: any, state: any): void {
    const e = this.getInstance(s2Class, id);
    if (e.states.indexOf(state) === -1) {
      e.states.push(state);
    }
  }
  air(time: number): void {
    this.player.air.available = time;
  }
  ai_behavioursignal(
    aiSignal: any,
    behaviour: any,
    radius?: number,
    className?: any,
    id?: any
  ) {}
  ai_center(unitId: number) {}
  ai_eater() {}
  ai_mode(unitId: number, mode: any, targetClass?: any, targetId?: any) {}
  ai_signal(aiSignal: any, radius?: number, s2Class?: S2Class, id?: number) {}
  ai_stay(unitId: number, mode?: any) {}
  ai_typesignal(
    aiSignal: any,
    type: any,
    radius?: number,
    s2Class?: S2Class,
    id?: number
  ) {}
  alpha(value: number, s2Class: S2Class, id: number): void {
    const e = this.getInstance(s2Class, id);
    const material: StandardMaterial = e.mesh.material as StandardMaterial;
    material.alpha = value;
  }
  alteritem(
    amount: number,
    type: number,
    newAmount?: number,
    newType?: number
  ): void {
    // TODO: this is a tricky command...
    const item: S2PlayerItem = this.player.items.find(
      (currentItem: { id: number; amount: number }) => currentItem.id === type
    );
    if (item.amount >= amount) {
    }
  }
  alterobject(objectId: number, objectType: any): void {
    const o: S2Instance = this.getInstance(S2Class.OBJECT, objectId);
    o.id = objectType;
  }
  ambientsfx(fileName: string) {}
  animate(
    unitId: number,
    startFrame: number,
    endFrame: number,
    speed: number,
    mode?: any
  ) {}
  areal_event(
    event: any,
    x: number,
    y: number,
    z: number,
    radius?: number,
    eventLimit?: any
  ) {}
  areal_state(state: any, x: number, y: number, z: number, radius?: number) {}
  autoload() {}
  autosave() {}
  behaviour(s2Class: S2Class, typId: number) {}
  blend(mode: any, s2Class?: S2Class, id?: number) {}
  blur(value: number): void {}
  buffer() {}
  buildsetup(id: number, cameraHeight?: number) {}
  builtat(objectId: number) {}
  button(id: number, text: string, icon?: any, script?: any) {}
  callscript(server: any, path: string, execute?: boolean) {}
  camfollow(
    time: any,
    s2Class: S2Class,
    id: number,
    x: number,
    y: number,
    z: number
  ) {}
  cammode(time: any, mode: any, s2Class?: S2Class, id?: number) {}
  campath(time: any, stepTime: any, ids: number[]) {}
  clear() {}
  climate(newClimate: S2Climate): void {
    this.game.map.climate = newClimate;
  }
  closemenu() {}
  color(
    red: number,
    green: number,
    blue: number,
    s2Class?: S2Class,
    id?: number
  ) {
    const instance: S2Instance = this.getInstance(s2Class, id);
    // TODO: color mesh
  }
  compare_behaviour(s2Class: S2Class, id: number, behaviour: any) {}
  compare_material(s2Class: S2Class, id: number, material: any) {}
  compass(show: boolean) {
    this.player.showCompass = show;
  }
  con(command: any) {}
  consume(
    energy?: number,
    hunger?: number,
    thirst?: number,
    exhaustion?: number
  ): void {
    this.player.enery += energy;
    this.player.hunger += hunger;
    this.player.thirst += thirst;
    this.player.exhaustion += exhaustion;
  }
  copychildren(
    s2Class: S2Class,
    id: number,
    variables?: any,
    items?: any,
    states?: any,
    script?: any,
    add?: any
  ) {}
  corona(
    x: number,
    z: number,
    radius?: number,
    red?: number,
    green?: number,
    blue?: number,
    speed?: number,
    unitId?: number
  ) {}
  cos(value: number, useFactor100: boolean): number {
    return useFactor100 ? Math.cos(value) * 100 : Math.cos(value);
  }
  count(s2Class: S2Class, type: any) {}
  count_behaviourinrange(
    s2Class: S2Class,
    behaviour: any,
    radius?: number,
    seconds2Class?: S2Class,
    secondId?: number
  ) {}
  count_inrange(
    s2Class: S2Class,
    type: any,
    radius?: number,
    seconds2Class?: S2Class,
    secondId?: number
  ) {}
  count_state(state: S2State) {
    let result: number = 0;

    this.game.map.objects.forEach((o: S2Instance) => {
      if (o.states.indexOf(state) > -1) {
        result++;
      }
    });
    this.game.map.units.forEach((u: S2Instance) => {
      if (u.states.indexOf(state) > -1) {
        result++;
      }
    });
    this.game.map.items.forEach((i: S2Instance) => {
      if (i.states.indexOf(state) > -1) {
        result++;
      }
    });

    return result;
  }
  count_stored(s2Class: S2Class, id: number, type?: any) {}
  cracklock(text: string, mode: any, combination: any) {}
  create(
    s2Class: S2Class,
    type: any,
    x?: number,
    z?: number,
    amount?: number
  ) {}
  credits() {}
  cscr(image?: any, closeable?: boolean) {}
  cscr_image(image: any, x: number, y: number, tooltip?: any, script?: any) {}
  cscr_text(
    text: string,
    x: number,
    y: number,
    color?: any,
    align?: any,
    tooltip?: any,
    script?: any
  ) {}
  currentclass() {}
  currentid() {}
  damage(s2Class: S2Class, id: number, amount: number) {}
  day(): number {
    return this.game.day;
  }
  debug(classOrMode: any, id?: number) {}
  decisionwin(
    text: string,
    font?: any,
    cancel?: any,
    okay?: any,
    image?: any
  ) {}
  defparam(s2Class: S2Class, type: any, parameter: any) {}
  def_extend(s2Class: S2Class, type: any, source: any) {}
  def_free(s2Class: S2Class, type: any) {}
  def_override(s2Class: S2Class, type: any, source: any) {}
  dialogue(startPage: any, source: any) {}
  diary(title: string, source?: any) {}
  distance(
    firsts2Class: S2Class,
    firstId: number,
    seconds2Class: S2Class,
    secondId: number
  ) {}
  downloadfile(server: any, path: string, file: any) {}
  drink(
    energy?: number,
    hunger?: number,
    thirst?: number,
    exhaustion?: number
  ): void {
    // TODO: play drink sound
    this.consume(energy, hunger, thirst, exhaustion);
  }
  eat(
    energy?: number,
    hunger?: number,
    thirst?: number,
    exhaustion?: number
  ): void {
    // TODO: play eat sound
    this.consume(energy, hunger, thirst, exhaustion);
  }
  echo(text: string) {}
  equip(itemType: any) {}
  event(eventName: any, s2Class: S2Class, id: number) {}
  exchange(s2Class: S2Class, id: number, store?: boolean, itemTypes?: any[]) {}
  exec(command: any) {}
  exists(s2Class: S2Class, id: number) {}
  exit() {}
  explosion(
    x: number,
    y: number,
    z: number,
    radius?: number,
    damage?: number,
    style?: any
  ) {}
  extendentry(title: string, source?: any) {}
  extendscript(s2Class: S2Class, id: number, source?: any) {}
  extract(term: string, start: number, length?: number): string {
    return length ? term.substr(start, length) : term.substr(start);
  }
  fademusic(duration: number) {}
  fileexists(path: string) {}
  find(itemType: any, amount?: number) {
    if (amount === undefined) {
      amount = 1;
    }

    // TODO: message and 2D effect
    const item: S2PlayerItem = this.player.items.find(
      (playerItem: S2PlayerItem) => playerItem.id === itemType
    );
    if (item) {
      item.amount += amount;
    } else {
      this.player.items.push({
        id: itemType,
        amount,
      });
    }
  }
  flash(
    red: number,
    green: number,
    blue: number,
    speed?: number,
    alpha?: number
  ) {}
  free(s2Class: S2Class, id: number, amount?: number) {}
  freebutton(id: number) {}
  freeentry(title?: string) {}
  freescript(s2Class: S2Class, id: number) {}
  freescripts() {}
  freeskill(skill: any) {
    delete this.player.skills[skill];
  }
  freespace(
    x: number,
    y: number,
    z: number,
    radius?: number,
    objects?: boolean,
    units?: boolean,
    items?: boolean,
    infos?: boolean
  ) {}
  freestate(s2Class: S2Class, id: number, state?: any) {}
  freestored(s2Class: S2Class, id: number, type: any, amount?: number) {}
  freetext(id: number) {}
  freetimers(s2Class: S2Class, id: number, source?: any) {}
  freeunitpath(unitId: number) {}
  freevar(variables: any[]) {
    variables.forEach((variable: string) => {
      if (this.game.variables.hasOwnProperty(variable)) {
        delete this.game.variables[variable];
      }
    });
  }
  freevars(locals?: boolean) {
    // TODO: distinguish local and global variables
  }
  freeze(unitId?: number, mode?: any) {}
  fry() {}
  fx(mode: any, s2Class?: S2Class, id?: number) {}
  getamount(id: number) {}
  getlocal(s2Class: S2Class, id: number, variable: any) {}
  getoff() {}
  getpitch(s2Class: S2Class, id: number) {}
  getplayerammo(): number {
    return this.player.ammo;
  }
  getplayervalue(value: number) {
    switch (value) {
      case 1:
        return this.player.enery;
      case 2:
        return this.player.hunger;
      case 3:
        return this.player.thirst;
      case 4:
        return this.player.exhaustion;
    }
  }
  getplayerweapon(): number {
    return this.player.weapon;
  }
  getroll(s2Class: S2Class, id: number) {}
  getsetting(settingName: string) {
    switch (settingName) {
      case 'xres':
        return this.canvas.nativeElement.width;
      case 'yres':
        return this.canvas.nativeElement.height;
      case 'depth':
        return 32;
      case 'debug':
        return this.debugModeEnabled;
      case 'viewrange':
        return this.viewRange;
      case 'gore':
        return this.goreMode;
      case 'commandline':
        return ''; // TODO:
      case 'time':
        return ''; // TODO:
      case 'date':
        return ''; // TODO:
      case 'version':
        return '0.0.1'; // TODO:
      default: {
        console.error('[getsetting] Setting not found:', settingName);
        return null;
      }
    }
  }
  getstatevalue(s2Class: S2Class, id: number, state: any, value?: number) {}
  getstored(s2Class: S2Class, id: number, type?: any) {}
  getweather() {
    return this.game.map.weather;
  }
  getx(s2Class: S2Class, id: number) {}
  gety(s2Class: S2Class, id: number) {}
  getyaw(s2Class: S2Class, id: number) {}
  getz(s2Class: S2Class, id: number) {}
  gotskill(skill: any) {
    return this.player.skills.hasOwnProperty(skill);
  }
  gotstate(s2Class: S2Class, id: number, state: any) {}
  grasscolor(red: number, green: number, blue: number) {}
  growtime(type: any) {}
  gt() {}
  heal(s2Class: S2Class, id: number, value: number): void {
    const e = this.getInstance(s2Class, id);
    e.health += value;
  }
  health(s2Class: S2Class, id: number, change?: number): number {
    if (!change) {
      change = 0;
    }

    const e = this.getInstance(s2Class, id);
    if (change !== 0) {
      this.heal(s2Class, id, change);
    }

    return e.health;
  }
  hidebar(time: any) {}
  hideindicator(id: number) {}
  hideindicators() {}
  hit_damage() {}
  hit_weapon() {}
  hour(): number {
    return Math.floor(this.game.time / 60);
  }
  image(id: number, image: any, x: number, y: number, masked?: boolean) {}
  imagewin(image: any) {}
  impact_amount() {}
  impact_class() {}
  impact_first() {}
  impact_ground() {}
  impact_id() {}
  impact_kill() {}
  impact_x() {}
  impact_y() {}
  impact_z() {}
  inarea(s2Class: S2Class, id: number) {}
  inarea_dig(s2Class: S2Class, id: number) {}
  inarea_fish(s2Class: S2Class, id: number) {}
  inarea_freshwater(s2Class: S2Class, id: number) {}
  incskill(skill: any, value?: number, description?: any) {
    // tslint:disable-next-line: object-literal-shorthand
    if (this.player.skills.hasOwnProperty(skill)) {
      this.setskill(
        skill,
        this.player.skills[skill].value + value,
        description
      );
    } else {
      this.setskill(skill, value, description);
    }
  }
  info_loudspeaker(infoId: number, file: string, radius?: number) {}
  info_spawncontrol(
    infoId: number,
    radius: number,
    s2Class: S2Class,
    type: any,
    part: number,
    maximumParts: number,
    days: number
  ) {}
  info_sprite(
    infoId: number,
    file?: any,
    x?: number,
    y?: number,
    r?: number,
    g?: number,
    b?: number,
    alpha?: number,
    blend?: any,
    fix?: any
  ) {}
  inputwin(text: string, font?: any, cancel?: any, okay?: any, image?: any) {}
  inrange(
    s2Class: S2Class,
    id: number,
    radius?: number,
    seconds2Class?: S2Class,
    secondId?: number
  ) {}
  int(value: string | number | boolean): number {
    return parseInt(value.toString(), 10);
  }
  intersect(
    firsts2Class: S2Class,
    firstId: number,
    seconds2Class?: S2Class,
    secondId?: number
  ) {}
  inview(s2Class: S2Class, id: number) {}
  jade(amount: number) {
    this.player.hunger += amount;
    this.player.thirst += amount;
    this.player.exhaustion += amount;
  }
  join(terms: (string | number)[]) {
    return terms.join();
  }
  jumpfactor(factor: number) {
    this.player.jump.factor = factor;
  }
  jumptime(time: number) {
    this.player.jump.time = time;
  }
  kill(id: number) {
    const unit: S2Instance = this.game.map.units.find(
      (currentUnit: S2Instance) => unit.id === id
    );
    unit.health = 0;
  }
  lastbuildingsite() {}
  length(term: string): number {
    return term.length;
  }
  lensflares(enabled: boolean) {}
  lives(s2Class: S2Class, id: number) {}
  loadani(unitType: any, startFrame: any, endFrame: any) {}
  loadfile(file: any, range?: any) {}
  loadmap(
    map: any,
    skills?: any,
    items?: any,
    variables?: any,
    diary?: any,
    states?: any,
    buildLocks?: any
  ) {}
  loadmaptakeover() {}
  loadvars(file?: any) {}
  lockbuilding(buildingId: number) {}
  lockbuildings() {}
  lockcombi(combinationId: number) {}
  lockcombis() {}
  locked(buildingOrCombinationId: number) {}
  loop_id() {}
  map() {}
  mapsize() {}
  maxhealth(s2Class: S2Class, id: number, change?: number) {}
  menu() {}
  minute(): number {
    return this.game.time % 60;
  }
  mkdir(directoryName: string) {}
  model(model: any, s2Class?: S2Class, id?: number) {}
  modifyentry(title: string, source?: any) {}
  modifyentryline(title: string, line: number, text: string) {}
  movecam(time: any, targetTime: any, id: number) {}
  msg(message: string, font?: any, duration?: number) {}
  msgbox(title: string, source?: any) {}
  msgwin(text: string, font?: any, image?: any) {}
  msg_extend(source: any) {}
  msg_replace(originalTerm: string, replaceTerm: string) {}
  music(fileName: string, volume?: number, fadeDuration?: number) {
    // TODO: implement fade duration feature
    this.game.music.src = fileName;
    this.game.music.volume = volume;
    this.game.music.load();
  }
  musicvolume(volume: number) {
    this.game.music.volume = volume;
  }
  name(s2Class: S2Class, id: number) {}
  parent_class(itemId: number) {}
  parent_id(itemId: number) {}
  particle(
    x: number,
    y: number,
    z: number,
    type: any,
    size?: any,
    alpha?: any
  ) {}
  particlec(red: number, green: number, blue: number) {}
  pastechildren(
    s2Class: S2Class,
    id: number,
    variables?: any,
    items?: any,
    states?: any,
    script?: any
  ) {}
  play(fileName: string, volume?: number, pan?: number, pitch?: number) {}
  playerdistance(s2Class: S2Class, id: number) {}
  playergotitem(type: any) {}
  playerspotted() {}
  player_ammo(ammo: any): void {
    this.player.ammo = ammo;
  }
  player_attackrange(value: number) {}
  player_damage(value: number): void {
    this.player.damage = value;
  }
  player_mat(material: any) {}
  player_maxweight(value: number): void {
    this.player.maxWeight = value;
  }
  player_speed(value: number): void {
    this.player.speed = value;
  }
  player_weapon(type: any) {}
  process(title: string, time?: any, event?: any) {}
  projectile(
    itemType: any,
    x: number,
    y: number,
    z: number,
    mode: any,
    unknownParam: any,
    offset?: any,
    weapon?: any,
    speed?: any,
    damage?: any,
    drag?: number
  ) {}
  quickload() {}
  quicksave() {}
  quit(): void {
    this.quitGame.emit();
  }
  rainratio(percent: number) {
    this.game.rainRatio = percent;
  }
  random(minOrMax: number, max: number) {
    const rnd: number = Math.random();
    return max
      ? Math.floor(rnd * (max - minOrMax)) + minOrMax
      : Math.floor(rnd * minOrMax);
  }
  randomcreate(
    s2Class: S2Class,
    type: any,
    minY?: number,
    maxY?: number,
    amount?: number
  ) {}
  rename(currentVariableName: string, newVariableName: string) {}
  replace(term: string, currentTerm: string, newTerm: string): string {
    return term.replace(new RegExp(currentTerm, 'gi'), newTerm);
  }
  revive(unitId: number) {}
  ride(unitId: number) {}
  riding() {}
  rpos(
    s2Class: S2Class,
    id: number,
    x: number,
    y: number,
    z: number,
    pitch: number,
    yaw: number,
    roll: number
  ) {}
  savemap(
    map: any,
    skills?: any,
    items?: any,
    variables?: any,
    diary?: any,
    states?: any,
    buildlocks?: any
  ): void {}
  savemapimage(path: string, size?: number): void {}
  savevars(file?: string, variables?: any): void {}
  scale(
    x: number,
    y: number,
    z: number,
    s2Class?: S2Class,
    id?: number
  ): void {}
  scantarget(distance?: number) {}
  selectplace(text: string, cameraHeight?: number) {}
  selectplace_x() {}
  selectplace_y() {}
  selectplace_z() {}
  seqbar(time: any, mode: any) {}
  seqcls(time: any, mode: any, red?: number, green?: number, blue?: number) {}
  seqend(time: any) {}
  seqevent(time: any, event: any, s2Class: S2Class, id: number) {}
  seqfade(
    startTime: any,
    endTime: any,
    red?: number,
    green?: number,
    blue?: number,
    mode?: any
  ) {}
  seqflash(
    time: any,
    red?: number,
    green?: number,
    blue?: number,
    speed?: number,
    alpha?: number
  ) {}
  seqhideplayer(time: any, hide?: any) {}
  seqimage(time: any, image: any, masked?: boolean) {}
  seqimagetext(
    time: any,
    text: string,
    x: number,
    y: number,
    color?: any,
    direction?: any
  ) {}
  seqmsg(time: any, text: string, color?: any) {}
  seqmsgclear(time: any, position?: any) {}
  seqscript(time: any, source: any) {}
  seqsound(
    time: any,
    file: string,
    volume?: number,
    pan?: number,
    pitch?: number
  ) {}
  seqstart(showBars?: boolean, canSkip?: boolean) {}
  seqtimemode(mode: any, absolute?: any) {}
  setamount(id: number, amount: number) {}
  setat(
    s2Class: S2Class,
    id: number,
    targets2Class: S2Class,
    targetId: number
  ) {}
  setcam(time: any, id: number) {}
  setday(day: number): void {
    this.game.day = day;
  }
  sethour(hour: number): void {
    const currentMinute: number = this.minute();
    this.game.time = hour * 60 + currentMinute;
  }
  setindicatorinfo(id: number, text: string) {}
  setindicatorlook(id: number, look: number) {}
  setlocal(s2Class: S2Class, id: number, variable: any, value?: any) {}
  setminute(minute: number): void {
    const currentHour: number = this.hour();
    this.game.time = currentHour * 60 + minute;
  }
  setpos(s2Class: S2Class, id: number, x: number, y: number, z: number) {}
  setrot(
    s2Class: S2Class,
    id: number,
    pitch: number,
    yaw: number,
    roll: number
  ) {}
  setskill(skill: any, value?: number, description?: string): void {
    this.player.skills[skill] = { description, value };
  }
  shininess(value: number, s2Class?: S2Class, id?: number) {}
  showbar(time: any) {}
  showentry(title: string, sfx?: any) {}
  showindicator(id: number) {}
  showindicators() {}
  sin(value: number, useFactor100?: boolean) {
    return useFactor100 ? Math.sin(value) * 100 : Math.sin(value);
  }
  skillname(skill: string, description: string) {
    this.player.skills[skill].description = description;
  }
  skillvalue(skill: string) {
    return this.player.skills[skill].value || -1;
  }
  skip() {}
  skipevent() {}
  skycolor(
    mode: any,
    red?: number,
    green?: number,
    blue?: number,
    transparency?: number
  ) {}
  skytexture(textureName: string) {}
  sleep(): void {
    this.player.sleeping = true;
  }
  sleeping(): boolean {
    return this.player.sleeping;
  }
  snowratio(percent: number) {
    this.game.snowRatio = percent;
  }
  spawntimer(objectId: number, value?: number) {}
  speech(file: string, cancel?: any, value?: any) {}
  split(term: string, delimiter: string, part: number): string {
    return term.split(delimiter)[part];
  }
  starttrigger(id: number) {}
  starttriggers() {}
  state() {}
  statecolor(
    s2Class: S2Class,
    id: number,
    state: any,
    red: number,
    green: number,
    blue: number
  ) {}
  statesize(s2Class: S2Class, id: number, state: any, size: number) {}
  statevalue(s2Class: S2Class, id: number, state: any, value: number) {}
  stopmusic() {
    if (!this.game.music.paused) {
      this.game.music.pause();
      this.game.music.currentTime = 0;
    }
  }
  stopsounds() {}
  stoptrigger(id: number) {}
  stoptriggers() {}
  storage(s2Class: S2Class, id: number, mode?: any) {}
  store(itemId: number, s2Class: S2Class, id: number, outside: number) {}
  tan(value: number, useFactor100?: boolean) {
    return useFactor100 ? Math.tan(value) * 100 : Math.tan(value);
  }
  targetclass() {}
  targetdistance() {}
  targetid() {}
  targetx() {}
  targety() {}
  targetz() {}
  tempall() {}
  terrain(x: number, z: number, mode: any, height?: number) {}
  terraintexture(file: string, grass?: any) {}
  terrainy(x: number, z: number) {}
  text(
    id: number,
    text: string,
    font?: any,
    x?: number,
    y?: number,
    align?: any
  ) {}
  text3d(
    s2Class: S2Class,
    id: number,
    text: string,
    font?: any,
    offset?: number,
    viewRange?: number
  ) {}
  texture(texture: any, s2Class?: S2Class, id?: number) {}
  thunder() {}
  timedcampath(time: any, steps: { stepTime: any; id: any }[]) {}
  timer(
    s2Class: S2Class,
    id: number,
    duration: number,
    loops?: any,
    source?: any
  ) {}
  timercount(s2Class: S2Class, id: number) {}
  trigger(id: number) {}
  trim(term: string) {
    return term.trim();
  }
  type(s2Class: S2Class, id: number) {}
  unitpath(unitId: number, pathIds: number[]) {}
  unlockbuilding(buildingId: number) {}
  unlockbuildings() {}
  unlockcombi(combinationId: number) {}
  unlockcombis() {}
  unstore(itemId: number, amount?: number) {}
  use_x() {}
  use_y() {}
  use_z() {}
  varexists(variableName: string) {}
  viewline(
    x1: number,
    y1: number,
    z1: number,
    x2: number,
    y2: number,
    z2: number
  ) {}
  vomit(unitId: number) {}
  wateralpha(alpha: number) {
    const material: StandardMaterial = this.ocean.material as StandardMaterial;
    material.alpha = alpha;
  }
  watertexture(textureName: string) {}
  weather(value: S2Weather) {
    this.game.map.weather = value;
  }

  getS2ClassProperty(s2Class: S2Class): string {
    switch (s2Class) {
      case S2Class.INFO:
        return 'infos';
      case S2Class.ITEM:
        return 'items';
      case S2Class.OBJECT:
        return 'objects';
      case S2Class.UNIT:
        return 'units';
      default: {
        console.error('[getS2ClassProperty] S2Class not found:', s2Class);
        return null;
      }
    }
  }
  getInstance(s2Class: S2Class, id: number): S2Instance {
    switch (s2Class) {
      case S2Class.OBJECT:
        return this.game.map.objects.find((o: S2Instance) => o.id === id);
      case S2Class.UNIT:
        return this.game.map.units.find((u: S2Instance) => u.id === id);
      case S2Class.ITEM:
        return this.game.map.items.find((i: S2Instance) => i.id === id);
      case S2Class.INFO:
        return this.game.map.infos.find((i: S2Instance) => i.id === id);
      default: {
        console.error('[getInstance] Invalid S2Class:', s2Class);
        return null;
      }
    }
  }

  /* Scripts */
  makeFire() {
    /* this.gameVariables['barkbranchfire'] = 0;
    this.event("barkbranchfire1", "global");
    this.process("Feuer machen", 4500, "barkbranchfire2");
    this.play("barkbranchfire.wav");
    this.skipevent(); */
  }

  /* GUI Menus */
  adventure() {
    console.info('Adventure will start now.');
  }

  randomIsland() {}

  singleIsland() {
    this.activeMenu = 'game';
  }

  loadIsland() {}

  saveOptions() {
    // TODO:
    this.activeMenu = 'main';
  }

  loadGameMap() {}

  saveGameMap() {}
}
