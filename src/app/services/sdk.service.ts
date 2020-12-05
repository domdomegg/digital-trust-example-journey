import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { take, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Token {
  email?: string;
  given_name: string;
  family_name: string;
  nationality: string;
  passport_id?: string;
  national_card_id?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SDKService {
  public verified = false;

  constructor(
    private readonly http: HttpClient,
  ) { }

  public getRequestUri(): Observable<{ redirect_to: string }> {
    return this.http.get(`${environment.apiBaseUrl}/initiate-authorize`).pipe(take(1)) as any;
  }

  public extractData(code: string): Observable<Token> {
    return this.http.post(`${environment.apiBaseUrl}/token`, { code: code }).pipe(tap(() => this.verified = true)) as any;
  }
}
