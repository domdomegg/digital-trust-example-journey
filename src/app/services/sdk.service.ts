import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { switchMap, take, tap } from 'rxjs/operators';
import { Config } from '../models/config.model';
import { ConfigService } from './config.service';

export interface Token {
  email?: string,
  given_name: string,
  family_name: string,
  nationality: string,
  passport_id?: string,
  national_card_id?: string
}

@Injectable({
  providedIn: 'root'
})
export class SDKService {
  public verified = false;

  constructor(
    private readonly http: HttpClient,
    private readonly configService: ConfigService
  ) { }

  public getRequestUri(): Observable<{ redirect_to: string }> {
    return this.configService.getConfig().pipe(switchMap((config: Config) =>
      this.http.get(`${config.apiBaseUrl}/initiate-authorize`).pipe(take(1))
    )) as any;
  }

  public extractData(code: string): Observable<Token> {
    return this.configService.getConfig().pipe(switchMap((config: Config) =>
      this.http.post(`${config.apiBaseUrl}/token`, { code: code }).pipe(tap(() => this.verified = true))
    )) as any;
  }
}
