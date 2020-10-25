import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { GameRoutingModule } from './game-routing.module';
import { GameComponent } from './game.component';
import { RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    component: GameComponent,
  },
];

@NgModule({
  declarations: [GameComponent],
  imports: [CommonModule, GameRoutingModule, RouterModule.forChild(routes)],
})
export class GameModule {}
