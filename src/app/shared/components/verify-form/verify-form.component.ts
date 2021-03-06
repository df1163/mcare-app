import { Component, Input, Output, OnInit, ViewEncapsulation, EventEmitter, Inject } from '@angular/core';
import { FormGroup, AbstractControl, FormBuilder, Validators } from '@angular/forms';

import { ServiceSupportService } from '../../../core/service-support.service';
import { ValidatorsService } from '../../../services/validators.service';

@Component({
  selector: 'app-verify-form',
  templateUrl: './verify-form.component.html',
  styleUrls: ['./verify-form.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class VerifyFormComponent implements OnInit {
  formActive: boolean = true;
  color: string = 'green';
  verifyFormGroup: FormGroup;
  username: AbstractControl;
  mobile: AbstractControl;
  captcha: AbstractControl;

  // 本地缓存数据
  localData: any;

  // 对外暴露提交事件
  @Output() submit: EventEmitter<any> = new EventEmitter<any>();

  constructor(
    @Inject('ConstConfig') private constConfig: any,
    private formBuilder: FormBuilder,
    private serviceSupport: ServiceSupportService) {
  }

  ngOnInit() {
    if (localStorage.getItem(this.constConfig.RepairBaseInfoKey)) {
      this.localData = JSON.parse(localStorage.getItem(this.constConfig.RepairBaseInfoKey));
    } else {
      this.localData = {
        username: '张三',
        mobile: '13602532846'
      };
    }
    this.initForm();
  }

  initForm() {
    this.verifyFormGroup = this.formBuilder.group({
      'username': [this.localData.username, Validators.required],
      'mobile': [this.localData.mobile, ValidatorsService.mobileValidator],
      'captcha': ['', Validators.required]
    });

    this.username = this.verifyFormGroup.controls['username'];
    this.mobile = this.verifyFormGroup.controls['mobile'];
    this.captcha = this.verifyFormGroup.controls['captcha'];

    this.serviceSupport.getLoaction().subscribe((data) => {
      console.log('当前地址：' + data.province + data.city);
    }, (error) => {
      console.log('获取当前地址失败：' + error);
    });
  }

  onSubmit(event) {
    event.preventDefault();
    window.localStorage.setItem(this.constConfig.RepairBaseInfoKey, JSON.stringify({
      username: this.username.value,
      mobile: this.mobile.value,
      captcha: this.captcha.value
    }));
    // 校验短信验证码
    this.serviceSupport.checkSms({
      phone: this.mobile.value,
      captcha: this.captcha.value
    }).subscribe(success => {
      if (success) {
        // 保存本地数据
        window.localStorage.setItem(this.constConfig.RepairBaseInfoKey, JSON.stringify({
          username: this.username.value,
          mobile: this.mobile.value,
          captcha: this.captcha.value
        }));
        this.submit.emit();
      } else {
        alert('短信验证码错误，请重新输入');
      }
    }, (error) => {
      console.log('服务器繁忙，请稍后重试!', error);
    });
    return false;
  }

  // 重置表单小技巧
  resetForm() {
    this.formActive = false;
    this.initForm();
    setTimeout(() => this.formActive = true, 0);
  }

  sendSms() {
    console.log('发送短信验证码');
    this.serviceSupport.sendSms(this.mobile.value).subscribe((data) => {
      console.dir('发送短信成功：' + data.code);
    }, (error) => {
      console.log('获取短信失败：' + error);
    });
    return false;
  }
}
