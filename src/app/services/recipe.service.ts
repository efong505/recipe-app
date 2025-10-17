import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecipeService {
  private baseUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getRecipe(url: string): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/scrape?url=${encodeURIComponent(url)}`).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred while scraping the website. Please try again later.';
    if (error.error instanceof ErrorEvent) {
      console.error('Client-side error:', error.error.message);
    } else {
      console.error(`Backend returned code ${error.status}, body was:`, error.error);
      if (error.status === 400) {
        errorMessage = typeof error.error === 'string' ? error.error : error.error?.error || 'Unsupported website or invalid URL';
      } else if (error.status === 404) {
        errorMessage = 'No content found';
      }
    }
    return throwError(() => ({ status: error.status, error: errorMessage }));
  }
}
// import { Injectable } from '@angular/core';
// import { HttpClient, HttpErrorResponse } from '@angular/common/http';
// import { catchError, Observable, throwError } from 'rxjs';

// @Injectable({
//   providedIn: 'root'
// })
// export class RecipeService {

//   private baseUrl = 'http://192.168.50.183:3000';

//   //private baseUrl = '/api';
//   constructor(private http: HttpClient) { }

//   getRecipe(url: string): Observable<any> {
//     return this.http.get<any>(`${this.baseUrl}/scrape?url=${encodeURIComponent(url)}`).pipe(
//       catchError(this.handleError)
//     );
//   }

//   private handleError(error: HttpErrorResponse) {
//     if (error.error instanceof ErrorEvent) {
//       console.error('An error occurred:', error.error.message);
//     } else {
//       console.error(`Backend returned code ${error.status}, body was: ${error.error}`);
//     }
//     return throwError('An error occurred while searching for the website. Please try again later.');
//   }
// }
