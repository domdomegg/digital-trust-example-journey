import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService, Token } from '../../services/sdk.service';

@Component({
  selector: 'step-2',
  templateUrl: './step2.component.html',
  styleUrls: ['./step2.component.scss']
})
export class Step2Component implements OnInit {
  public _isLoading = false;
  public _errors: string[];
  public _traceId: string;
  public _data: Token;
  public _code: string;

  constructor(
    public readonly sdkService: SDKService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) {}

  public ngOnInit() {
    const { code, error, error_description } = (this.activatedRoute.queryParams as unknown as
      { _value: { code: string, error: string, error_description: string } })._value;

    if (code) {
      this._code = code;
      this._isLoading = true;
      this.router.navigate(['/step2']);

      this.sdkService.extractData(code).subscribe(
        (data) => {
          this._data = data;
          this._isLoading = false;
        },
        (errorRes?: HttpErrorResponse) => {
          if (errorRes && errorRes.error) {
            if (errorRes.error.errors) {
              this._errors = errorRes.error.errors;
            } else if (errorRes.error.error_description) {
              this._errors = [errorRes.error.error_description];
            }
            this._errors = ['An unexpected error occurred'];
            this._traceId = errorRes.error.trace_id;
          }

          this._isLoading = false;
        }
      );
    } else if (error || error_description) {
      if (error_description === 'End-User aborted interaction') {
        this._errors = ['You cancelled verifying with Santander'];
      } else if (error_description) {
        this._errors = [error_description];
      } else {
        this._errors = [error];
      }

      this.router.navigate(['/step2']);
    }
  }
}
