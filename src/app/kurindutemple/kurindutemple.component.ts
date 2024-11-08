import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { Router } from '@angular/router';

@Component({
  selector: 'app-kurindutemple',
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
     HttpClientModule,
  ],
  templateUrl: './kurindutemple.component.html',
  styleUrl: './kurindutemple.component.css'
})
export class KurindutempleComponent implements OnInit{
  @ViewChild('nameInput') nameInput!: ElementRef;
  mtmpdata:any={};
  fetchedtpmdata:any[]=[];
  typemstdata:any[]=[];
  // private apiurl="http://localhost:3000";
  selectedFile!: File;  
  showDeleteButton = true;
  editMode: boolean = false;  
  classes: any[] = [];
  mproducts: any = {};
  
  edittxtname: string | null = null; 
  showTable: boolean = false;
  showform:boolean=true; 
  selectedClass: any = null;
  nameTaken: boolean = false;
  mNum: number=0;

  unpaidOnly: boolean = false; 
  searchQuery: string = '';
  

  constructor(private http:HttpClient, private router:Router){}
  
  
  ngOnInit(): void {
    this.loadtmpdata();
    this.fetchInitialNum();
 
  }






  fetchInitialNum(): void {
    // this.http.get<{ NUM: number }>(this.apiurl+'/numset').subscribe({
    //   next: (response) => {
    //     this.mNum = response.NUM ;
    //     this.generateStudentCode();
    //   },
    //   error: (err) => {
    //     console.error('Error fetching num:', err);
    //   }
    // });
  }

  incrementAndGenerateCode(): void {
    // this.http.post<{ NUM: number }>(this.apiurl + '/numset/increment', {}).subscribe({
    //   next: (response) => {
    //     this.mNum = response.NUM;
    //     this.generateStudentCode();
    //   },
    //   error: (err) => {
    //     console.error('Error incrementing num:', err);
    //   }
    // });
  }
  

  generateStudentCode(): void {
    if (this.mNum < 1) {
      this.mNum = 1;
    }
  
    const code = this.mNum;
    this.mtmpdata.RECNO = code;
  }
  
  onMobileInput(event: any): void {
    const inputValue = event.target.value;
    
    event.target.value = inputValue.replace(/[^0-9]/g, '').slice(0, 10);

    this.mtmpdata.MOBILE = event.target.value;
  }
  

  

  onSubmit(): void {
    // if (this.editMode) {
    //   this.updateClass();
    // } else {
    //   if (!this.mtmpdata.NAME || !this.mtmpdata.ITEM || !this.mtmpdata.MOBILE || !this.mtmpdata.RATE) {
    //     alert("Please fill in all required fields.");
    //     return;
    //   }
    //   this.mtmpdata.PAID = this.mtmpdata.PAID || 'N';
    //   this.http.post(this.apiurl + '/tmpdata', this.mtmpdata)
    //     .subscribe(
    //       (data: any) => {
    //         console.log("Inserted", data);
    //         alert("Inserted successfully");
    //         this.incrementAndGenerateCode(); 
    //         this.loadtmpdata();
  
          
    //         this.mtmpdata.RECNO = data.RECNO;
  
          
    //         this.mtmpdata.NAME = "";
    //         this.mtmpdata.ITEM = "";
    //         this.mtmpdata.MOBILE = "";
    //         this.mtmpdata.RATE = "";
    //         this.mtmpdata.PAID = "";
    //       },
    //       (error) => {
    //         console.log("Error while inserting", error);
    //         alert("Error while inserting");
    //       }
    //     );
    // }
  }
  


  
  onexitmodify()
  {
    this.showform = true;
    this.showTable=false;
    this.showDeleteButton=true;
    this.fetchInitialNum();
  }
  updateClass() {
    // if (this.edittxtname !== null) {
    //   this.http.put(`${this.apiurl + '/updatetmpdata'}/${this.edittxtname}`, this.mtmpdata).subscribe({
    //     next: (data) => {
    //       console.log(' updated successfully:', data);
    //       alert(" updated successfully");
    //       this.mtmpdata.NAME = "";
    //       this.mtmpdata.ITEM = "";
    //       this.mtmpdata.MOBILE = "";
    //       this.mtmpdata.RATE = "";
    //       this.mtmpdata.PAID = "";
    //       this.fetchInitialNum();
    //       this.loadtmpdata();
    //       this.editMode = false;
    //       this.edittxtname = null;
    //       this.showDeleteButton = true;
    //     },
    //     error: (err) => {
    //       console.error('Error updating :', err);
    //       alert('Error updating ');
    //       this.mtmpdata.NAME = "";
    //       this.mtmpdata.ITEM = "";
    //       this.mtmpdata.MOBILE = "";
    //       this.mtmpdata.RATE = "";
    //       this.mtmpdata.PAID = "";
    //     }
    //   });
    // }
  }
  
  onFileSelected(event: Event): void {
    const fileInput = event.target as HTMLInputElement;
    if (fileInput.files && fileInput.files.length > 0) {
      this.selectedFile = fileInput.files[0];
    }
  }
  
  
  onCheckboxChange(event: any): void {
    this.mtmpdata.PAID = event.target.checked ? 'Y' : 'N';
  }
  
  
  onCheckboxChange1(event: any): void {
    this.unpaidOnly = event.target.checked;
    this.filterData();  
  }
  
  
  filterData(): void {
    if (this.unpaidOnly) {
    
      this.fetchedtpmdata = this.fetchedtpmdata.filter(record => record.PAID === 'N');
    } else {

      this.loadtmpdata();  
    }
  }
  

  loadtmpdata(): void {
    // this.http.get(this.apiurl + '/displaytypmdata')
    //   .subscribe((data: any) => {

    //     this.fetchedtpmdata = data.filter((record: any) => {
    //       return (record.NAME && record.NAME.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
    //              (record.MOBILE && record.MOBILE.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
    //              (record.RECNO && record.RECNO.toString().toLowerCase().includes(this.searchQuery.toLowerCase())) ||
    //              (record.ITEM && record.ITEM.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
    //              (record.PAID && record.PAID.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
    //              (record.RATE && record.RATE.toString().toLowerCase().includes(this.searchQuery.toLowerCase()));
    //     });
    //     console.log("Filtered temple data:", this.fetchedtpmdata);
    //   }, (error) => {
    //     console.log("Error while fetching data", error);
    //   });
  }
  
  
  onSearch(): void {

    if (this.unpaidOnly) {
      this.fetchedtpmdata = this.fetchedtpmdata.filter((record: any) => {
        return (record.NAME && record.NAME.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
               (record.MOBILE && record.MOBILE.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
               (record.RECNO && record.RECNO.toString().toLowerCase().includes(this.searchQuery.toLowerCase())) ||
               (record.ITEM && record.ITEM.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
               (record.PAID && record.PAID.toLowerCase().includes(this.searchQuery.toLowerCase())) ||
               (record.RATE && record.RATE.toString().toLowerCase().includes(this.searchQuery.toLowerCase()));
      });
    } else {
   
      this.loadtmpdata();
    }
  }
  
  onModify() {
  
    this.showTable = !this.showTable;
    this.showform = !this.showform;
    this.editMode = false; 
    this.mtmpdata = {};   
    this.showDeleteButton = !this.showDeleteButton;
    if (this.fetchedtpmdata.length==0) {
      alert("no record found");
      this.fetchInitialNum();
      this.showform=true;
      this.showTable=false;
      this.showDeleteButton=true;
  };
    };
  
  
   
    
  
  
  ondelete() {
  //   if (this.edittxtname !== null) {
  
            
  //     const confirmDelete = confirm('Are you sure you want to delete this homedata?');
      
  //     if (confirmDelete) {
  //       this.http.delete(`${this.apiurl+'/deletetmpdata'}/${this.edittxtname}`).subscribe({
  //         next: () => {
  //           console.log('  deleted successfully');
  //           alert('  deleted successfully');
  //           this.mtmpdata.NAME = "";
  //           this.mtmpdata.ITEM = "";
  //           this.mtmpdata.MOBILE = "";
  //           this.mtmpdata.RATE = "";
  //           this.mtmpdata.PAID = "";
  //           this.editMode=false;
  //           this.fetchInitialNum();
  //           this.loadtmpdata();
  //           this.showDeleteButton=true;
  //         },
  //         error: (err) => {
  //           console.error('Error deleting Homedata:', err);
            
  //         }
  //       });
  //     }
  //   } else {
  //     alert('No name selected for deletion');
  //   }
  //   this.nameInput.nativeElement.focus();
  // this.ngOnInit();
  // this.editMode = false;
  // this.selectedClass="";
  }
  
  onexit()
  {
    this.router.navigate(['/'])
  }
  
  onReset(form: any) {
    this.editMode=false;
    form.resetForm();
    this.selectedClass="";
 this.mtmpdata={}

    this.fetchInitialNum();
    this.nameInput.nativeElement.focus();
    this.editMode=false;
    this.edittxtname = null; 
    this.showDeleteButton=true;
  
  }
  
  editClass(classs: any) {

    console.log('Editing classs:', classs); 
  this.mtmpdata = { 
    ...classs, 
    PAID: classs.PAID === 'Y'
  };
    this.editMode = true;
    console.log("edit mode is ", this.editMode);
    this.edittxtname = classs.RECNO 
    console.log('editted  name set to:', this.edittxtname); 
    this.showTable = false;
    this.showform = true;
    this.showDeleteButton=false;
      console.log("delete mode is",this.showDeleteButton)
  }
  
  selectClass(classs: any) {
    this.selectedClass = classs; 
  
  }
  }
  