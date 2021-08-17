import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormGroup, Validators} from "@angular/forms";
import {ActivatedRoute, Router} from "@angular/router";
import {ToastrService} from "ngx-toastr";
import {Constants} from "../../../_helpers/constants";
import {first} from "rxjs/operators";
import {MemberCategoryService} from "../../../_services/member-category.service";
import {MemberTypeService} from "../../../_services/member-type.service";
import {Functions} from "../../../_helpers/functions";

@Component({
  selector: 'app-member-categories',
  templateUrl: './member-categories.component.html',
  styleUrls: ['./member-categories.component.css']
})
export class MemberCategoriesComponent implements OnInit {

	  pk: string = 'CategoryID';
	  title: string;
	  object: string = 'Member Category';
	  parentUrl: string = '/settings/member-categories';
	  editUrl: string = '/settings/member-categories/';
	  form: FormGroup;
	  id: string;
	  isAddMode: boolean;
	  loading: boolean = false;
	  errorMessage: string = '';
	  submitted: boolean = false;
	  userManagers: any[] = [];
	  rows: any[];
	  memberTypes: any[] = [];
	  memberType: any = {};

	constructor(
      private formBuilder: FormBuilder,
	  private route: ActivatedRoute,
	  private router: Router,
	  private dataService: MemberCategoryService,
	  private memberTypeService: MemberTypeService,
	  private toastr: ToastrService,
	  private constants: Constants
	) {}

	loadRecords(): void{
	  this.dataService.getAll().subscribe(data=>{
	    this.rows = data;
	  },err=>{
	    this.errorMessage = Functions.handleError(err,Constants.Messages.RECORDS_NOT_FOUND);
	    this.toastr.error(this.errorMessage,Constants.Title.RECORD_OPERATION);
	  });
	}

	initForm(): void {
		this.form = this.formBuilder.group({
		    TypeID: ['', Validators.required],
		    Name: ['', Validators.required],
		    Fees: [null, Validators.required],
		    Description: ['', Validators.required],
		    Code: ['', Validators.required]
		  });
	}

	ngOnInit(): void {
	  this.memberTypeService.getAll().subscribe(data=>{this.memberTypes = data});
	  this.id = this.route.snapshot.params['id'];
	  this.isAddMode = !this.id;
	  this.title = (this.isAddMode? 'Add' : 'Edit') + ' ' + this.object;

	  this.initForm();

	  this.route.params.subscribe(
	    params => {
	      this.id = params['id'];
	      if (!this.isAddMode) {
	        this.dataService.get(this.id)
	          .pipe(first())
	          .subscribe(x => {
	            this.form.patchValue(x);
	            this.toastr.success(Constants.Messages.RECORD_LOADED, Constants.Title.RECORD_OPERATION);
	          }, err => {
	            this.errorMessage = err.message ? err.message : Constants.Messages.RECORDS_NOT_FOUND;
	            this.toastr.error(this.errorMessage, Constants.Title.RECORD_OPERATION);
	            this.router.navigate(['../../'], {relativeTo: this.route});
	          });
	      }
	    }
	  );
	  this.memberTypeService.getAll().subscribe(data=>{this.memberType = Functions.objectify(data,'TypeID')});
	  this.loadRecords();
	}
	onSubmit() {
	  this.submitted = true;
	  /* stop here if form is invalid */
	  if (this.form.invalid) {
	    this.toastr.error(Constants.Messages.FORM_ERROR_FOUND,Constants.Title.FORM_VALIDATION);
	    return;
	  }

	  this.loading = true;
	  if (this.isAddMode) {
	    this.createRecord();
	  } else {
	    this.updateRecord();
	  }
	}


	private createRecord() {
	  this.dataService.create(this.form.value)
	    .pipe(first())
	    .subscribe(() => {
	      this.toastr.success(Constants.Messages.SAVE_SUCCESS,Constants.Title.RECORD_OPERATION);
	      this.loadRecords();
	      this.initForm();
	    },err=>{
	      this.errorMessage = err.message? err.message : Constants.Messages.UPDATE_FAILURE;
	      this.toastr.error(this.errorMessage,Constants.Title.RECORD_OPERATION);
	    })
	    .add(() => {this.loading = false; this.submitted = true;});
	}

	private updateRecord() {
	  this.dataService.update(this.id, this.form.value)
	    .pipe(first())
	    .subscribe(() => {
	      this.toastr.success(Constants.Messages.UPDATE_SUCCESS,Constants.Title.RECORD_OPERATION);
	      this.router.navigate([this.parentUrl]);
	    },err=>{
	      this.errorMessage = err.message? err.message : Constants.Messages.SAVE_FAILURE;
	      this.toastr.error(this.errorMessage,Constants.Title.RECORD_OPERATION);
	    })
	    .add(() => {this.loading = false; this.submitted = true;});
	}

	async deleteRow(row: any) {
		let canDeleteConfirm = await Functions.alertDelete(Constants.Title.RECORD_OPERATION,Constants.Messages.CONFIRM_DELETE);
		if(canDeleteConfirm.isConfirmed)
		{
			Object.assign(row, {isDeleting: true});
			this.dataService.delete(row[this.pk]).subscribe(data=>{
				Object.assign(row, {isDeleting: false});
				/* filter out the deleted row and free it from other rows */
				this.rows = this.rows.filter(x => x[this.pk]!== row[this.pk]);
				this.toastr.success(Constants.Messages.DELETE_SUCCESS,Constants.Title.RECORD_OPERATION);
			},err=>{
				Object.assign(row, {isDeleting: false});
				this.errorMessage = Functions.handleError(err,Constants.Messages.DELETE_FAILURE);
		        this.toastr.error(this.errorMessage,Constants.Title.RECORD_OPERATION);
			});
		}
	}

	get f() { return this.form.controls; }

}
