export enum S2Class {
  OBJECT,
  UNIT,
  ITEM,
  INFO,
}

export enum S2Behavior {
  BUILDING_SITE,
}

export enum S2ObjectBehaviour {
  TREE,
  ALIGN_TO_WATER,
  BUILDING_SITE,
  BUILDING_SITE_WATER,
  FOUNTAIN,
  CLOSE_KILL,
  CLOSE_TRIGGER,
  PLAGUE_TARGET,
}

export enum S2UnitBehaviour {
  NORMAL,
  PREDATOR,
  STAND_AND_SNAP,
  STAND_AND_SHOOT,
  IDLE,
  IDLE_TURN,
  MONKEY,
  SHY,
  PLAGUE,
  CRAB,
  AMPHIBIAN,
  FISH,
  CIRCLING_FISH,
  PREDATOR_FISH,
  DEEP_SEA_FISH,
  BIRD,
  HIGH_BIRD,
  LOW_BIRD,
  CIRCLING_BIRD,
  LAND_SKY_BIRD,
  FLYING_INSECT,
  VEHICLE,
  WATERCRAFT,
  AIRCRAFT,
}

export enum S2ItemBehaviour {
  AMMO,
  SLINGSHOT,
  BOW,
  ROCKET_LAUNCHER,
  CATAPULT,
  PISTOL,
  GUN,
  MACHINE_GUN,
  SPEAR,
  SELF_THROW,
  KILL_THROW,
  THROW,
  BLADE,
  SLOW_BLADE,
  FAST_BLADE,
  SPADE,
  FISHING_ROD,
  NET,
  HAMMER,
  MAP,
  WATCH,
  USE_ENVIRONMENT,
  TORCH,
  PLAGUE_TARGET,
}

export enum S2Material {}

export enum S2Climate {
  SUN_AND_RAIN = 0,
  SUN_AND_SNOW = 1,
  SUN = 2,
  RAIN = 3,
  SNOW = 4,
  THUNDERSTORM = 5,
}

export enum S2Weather {
  SUN = 0,
  RAIN = 1,
  SNOW = 2,
  THUNDERSTORM = 3,
}

export enum S2Particle {
  BUBBLES = 10,
  WAVE_RING = 11,
  WATER_SPLASHES = 12,
  WAVE = 15,
  SMOKE = 20,
  SPARK = 21,
  SPLATTER = 22,
  SUB_SPLATTER = 23,
  WOOD_SPLATTER = 24,
  BLOOD_SPOT = 25,
  FLAMES = 30,
  FIRE_SPARK = 35,
  ASCENDING = 40,
  EXPLOSION = 45,
  SHOCK_WAVE = 46,
  STAR = 50,
  SPAWN = 51,
  IMPACT = 60,
  RAIN = 70,
  SNOW = 71,
}

export enum S2State {
  BLEEDING = 1,
  INTOXICATION = 2,
  PUS = 3,
  FIRE = 4,
  ETERNAR_FIRE = 5,
  FROSTBITE = 6,
  FRACTURE = 7,
  ELECTRIC_SHOCK = 8,
  BLOODLUST = 9,
  DIZZY = 10,
  WET = 11,
  FUDDLE = 12,
  HEALING = 16,
  INVULNERABILITY = 17,
  TAME = 18,
  ACTION = 21,
  FLARE = 22,
  SMOKE = 23,
  LIGHT = 24,
  PARTICLES = 25,
  BUILDING_SITE = 52,
  LINK = 53,
  SPEED_MODIFICATION = 54,
  AI_STICK = 60,
}

export enum S2Collision {
  NONE = 0,
  NEAR_COLLISION = 1,
  SELECTABLE = 2,
  FAR_COLLISION = 3,
  CLIMB = 4,
}
