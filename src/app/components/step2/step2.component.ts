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
    const code = (this.activatedRoute.queryParams as unknown as { _value: { code: string } })._value.code;

    if (code) {
      this._code = code;
      this._isLoading = true;
      this.router.navigate(['/step2']);

      this.sdkService.extractData(code).subscribe(
        (data) => {
          this._data = data;
          this._isLoading = false;
        },
        (error: HttpErrorResponse) => {
          this._errors = error.error.errors ? error.error.errors : [error.error.error_description];
          this._traceId = error.error.trace_id;
          this._isLoading = false;
        }
      );
    }
  }
}
