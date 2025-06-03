import { Routes } from '@angular/router';
import { RecipeComponent } from './recipe/recipe.component';
import { SearchComponent } from './search/search.component';

export const routes: Routes = [
  {
    path: '',
    component: RecipeComponent
  },
  // {
  //   path:'search',
  //   component: SearchComponent
  // }
];
