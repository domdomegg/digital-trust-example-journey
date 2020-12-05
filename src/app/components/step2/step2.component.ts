import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { SDKService } from '../../services/sdk.service';
import { UserService } from '../../services/user.service';

@Component({
  selector: 'step-2',
  templateUrl: './step2.component.html',
  styleUrls: ['./step2.component.scss']
})
export class Step2Component implements OnInit {
  public _isLoading: boolean = false;
  public _verified: boolean = false;
  public userDetails: any;

  constructor(
    public readonly sdkService: SDKService,
    private readonly userService: UserService,
    private readonly activatedRoute: ActivatedRoute,
    private readonly router: Router
  ) { }

  public ngOnInit() {
    this.getUser();
    this.getVerified();

    const code = (this.activatedRoute.queryParams as unknown as { _value: { code: string } })._value.code;

    if (code) {
      this._isLoading = true;
      this.router.navigate(['/step2']);

      this.sdkService.extractData(code).subscribe(() => {
        setTimeout(() => {
          this.getVerified();

          setTimeout(() => {
            this._isLoading = false;
            this.getUser();
          }, 1000);
        }, 1000);
      }, () => {
        setTimeout(() => {
          this._isLoading = false;
          this.getUser();
        }, 1000);
      });
    }
  }

  private getUser(): void {
    this.userService.getUserDetails().subscribe(res =>
      this.userDetails = res
    );
  }

  private getVerified(): void {
    this.userService.getUserVerified().subscribe(
      () => this._verified = true,
      () => this._verified = false
    );
  }
}
