import { CommonModule } from '@angular/common';
import { AfterViewChecked, AfterViewInit, Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SafePipe } from '../safe.pipe';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-search',
  imports: [CommonModule, FormsModule],
  templateUrl: './search.component.html',
  styleUrl: './search.component.css',
  standalone: true
})
export class SearchComponent implements AfterViewInit {

  query: string = '';
  // googleSearchUrl: string = '';
  googleSearchUrl?: SafeResourceUrl;
  constructor(
    private router: Router,
    private sanitizer: DomSanitizer
  ){}

  searchRecipe() {
    const url =
        `https://www.google.com/search?q=${
        encodeURIComponent(
          this.query + ' recipe')}`;

          window.open(url, '_blank');
  }

  ngAfterViewInit() {
    window.addEventListener('message', (event) => {
      if (event.data && event.data.recipeUrl) {
        this.router.navigate(['/'], { queryParams: { url: event.data.recipeUrl } });
      }
    });
  }
}
