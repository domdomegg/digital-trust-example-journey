import { HttpErrorResponse } from '@angular/common/http';
import { Component } from '@angular/core';
import { SDKService } from '../../services/sdk.service';

@Component({
  selector: 'step-1',
  templateUrl: './step1.component.html',
  styleUrls: ['./step1.component.scss']
})
export class Step1Component {
  public _isLoading = false;
  public _errors: string[];
  public _traceId: string;

  constructor(private readonly sdkService: SDKService) {}

  verifyWithSantander(): void {
    this._isLoading = true;

    this.sdkService.getRequestUri().subscribe(
      (data) => {
        window.location.href = data.redirect_to;
        this._isLoading = false;
      },
      (errorRes?: HttpErrorResponse) => {
        if (errorRes && errorRes.error) {
          if (errorRes.error.errors) {
            this._errors = errorRes.error.errors;
          } else if (errorRes.error.error_description) {
            this._errors = [errorRes.error.error_description];
          }
          this._traceId = errorRes.error.trace_id;
        }

        if (errorRes.status === 0) { this._errors = ['Could not connect to server']; }

        if (!this._errors) { this._errors = ['An unexpected error occurred']; }
        this._isLoading = false;
      }
    );
  }
}
