import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RecipeService } from '../services/recipe.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { timeout, retry, finalize } from 'rxjs/operators';

interface ContentItem {
  type: 'paragraph' | 'heading' | 'div';
  text?: string;
  content?: Array<{ type: 'text' | 'link'; value?: string; text?: string; href?: string }>;
}

interface RecipeResponse {
  type: 'recipe';
  url: string;
  data: {
    recipeName: string;
    description: string;
    recipeImage: string;
    ingredients: string[];
    instructions: Array<{ text: string; image?: string }>;
  };
}

interface NewsResponse {
  type: 'news';
  url: string;
  data: {
    title: string;
    author: string;
    published: { epoch: number | null; humanReadable: string };
    image: string;
    content: ContentItem[];
  };
}

type ScrapeResponse = RecipeResponse | NewsResponse;

@Component({
  selector: 'app-recipe',
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './recipe.component.html',
  styleUrls: ['./recipe.component.css'],
  providers: [RecipeService],
  standalone: true
})
export class RecipeComponent implements OnInit, OnDestroy {
  response: ScrapeResponse | null = null;
  url: string = '';
  query: string = '';
  errorMessage: string = '';
  isLoading: boolean = false;

  fetchContentSubscription?: Subscription;
  getContentSubscription?: Subscription;

  constructor(
    private recipeService: RecipeService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.fetchContentSubscription = this.route.queryParams.subscribe({
      next: (params) => {
        this.url = params['url'] || '';
        if (this.url) {
          this.fetchContent();
        }
      }
    });
  }

  fetchContent() {
    if (!this.url) {
      this.errorMessage = 'Please enter a URL';
      this.response = null;
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.response = null;

    this.getContentSubscription = this.recipeService.getRecipe(this.url).pipe(
      timeout(45000),
      retry(1),
      finalize(() => this.isLoading = false)
    ).subscribe({
      next: (data: ScrapeResponse) => {
        this.response = data;
      },
      error: (error) => {
        console.error('Error fetching content:', error);
        if (error.name === 'TimeoutError') {
          this.errorMessage = 'Request timed out. Please try again.';
        } else if (error.status === 400) {
          this.errorMessage = error.error || 'Unsupported website or invalid URL';
        } else if (error.status === 404) {
          this.errorMessage = 'No content found';
        } else {
          this.errorMessage = 'An error occurred while scraping the website.';
        }
      }
    });
  }

  clear() {
    this.url = '';
    this.errorMessage = '';
    this.response = null;
    this.isLoading = false;
    this.router.navigateByUrl('/');
  }

  setExampleUrl(url: string) {
    this.url = url;
    this.fetchContent();
  }

  ngOnDestroy(): void {
    this.fetchContentSubscription?.unsubscribe();
    this.getContentSubscription?.unsubscribe();
  }
}
