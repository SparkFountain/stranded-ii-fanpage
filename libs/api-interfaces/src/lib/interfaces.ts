export interface Message {
  message: string;
}

import { S2State, S2Class } from '@stranded-ii-fanpage/enums';
import { InstancedMesh } from '@babylonjs/core';

export interface S2Instance {
  id: number;
  s2Class: S2Class;
  states: S2State[];
  mesh: InstancedMesh;
  health: number;
}

export interface S2PlayerItem {
  id: number;
  amount: number;
}
