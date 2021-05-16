import { Component, OnInit, ElementRef, ViewChild } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { FormControl, FormGroupDirective, FormBuilder, FormGroup, NgForm, Validators } from '@angular/forms';
import { ErrorStateMatcher } from '@angular/material/core';
import firebase from "firebase/app";
import "firebase/firestore";
import { DatePipe } from '@angular/common';


export class MyErrorStateMatcher implements ErrorStateMatcher {
  isErrorState(control: FormControl | null, form: FormGroupDirective | NgForm | null): boolean {
    const isSubmitted = form && form.submitted;
    return !!(control && control.invalid && (control.dirty || control.touched || isSubmitted));
  }
}

//to extract or convert the Firebase response to the array of objects.
export const snapshotToArray = (snapshot: any) => {
  const returnArr = [];

  snapshot.forEach((childSnapshot: any) => {
      const item = childSnapshot.val();
      item.key = childSnapshot.key;
      returnArr.push(item);
  });

  return returnArr;
};


@Component({
  selector: 'app-chatroom',
  templateUrl: './chatroom.component.html',
  styleUrls: ['./chatroom.component.css']
})
export class ChatroomComponent implements OnInit {

  @ViewChild('chatcontent') chatcontent: ElementRef;
  scrolltop: number = null;

  chatForm: FormGroup;
  nickname = '';
  roomname = '';
  message = '';
  users = [];
  chats = [];
  matcher = new MyErrorStateMatcher();

  constructor(private router: Router,
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    public datepipe: DatePipe)
    {

      // get the nickname from the local storage, the room name from the router params,
      // and get the users and chats list from the Firebase realtime-database documents.
      this.nickname = localStorage.getItem('nickname');
      this.roomname = this.route.snapshot.params.roomname;
      firebase.database().ref('chats/').on('value', resp => {
        this.chats = [];
        this.chats = snapshotToArray(resp);
        setTimeout(() => this.scrolltop = this.chatcontent.nativeElement.scrollHeight, 500);
      });
      firebase.database().ref('roomusers/').orderByChild('roomname').equalTo(this.roomname).on('value', (resp2: any) => {
        const roomusers = snapshotToArray(resp2);
        this.users = roomusers.filter(x => x.status === 'online');
      });
    }

    //Initialize the Form group for the message-form
    ngOnInit(): void {
      this.chatForm = this.formBuilder.group({
        'message' : [null, Validators.required]
      });
    }

    //function to submit the message form and save it to the Firebase realtime-database document.

    onFormSubmit(form: any) {
      const chat = form;
      chat.roomname = this.roomname;
      chat.nickname = this.nickname;
      chat.date = this.datepipe.transform(new Date(), 'dd MM yyyy HH:mm ');
      chat.type = 'message';
      const newMessage = firebase.database().ref('chats/').push();
      newMessage.set(chat);
      this.chatForm = this.formBuilder.group({
        'message' : [null, Validators.required]
      });
    }

    //function to exit the chat room which is to send the exit message to the Firebase realtime database.

    exitChat() {
      const chat = { roomname: '', nickname: '', message: '', date: '', type: '' };
      chat.roomname = this.roomname;
      chat.nickname = this.nickname;
      chat.date = this.datepipe.transform(new Date(), 'dd MM yyyy HH:mm ');
      chat.message = ` ${this.nickname} est parti(e)`;
      chat.type = 'exit';
      const newMessage = firebase.database().ref('chats/').push();
      newMessage.set(chat);

      firebase.database().ref('roomusers/').orderByChild('roomname').equalTo(this.roomname).on('value', (resp: any) => {
        let roomuser = [];
        roomuser = snapshotToArray(resp);
        const user = roomuser.find(x => x.nickname === this.nickname);
        if (user !== undefined) {
          const userRef = firebase.database().ref('roomusers/' + user.key);
          userRef.update({status: 'offline'});
        }
      });

      //set the room user status, and go back to the room list.
      this.router.navigate(['/roomlist']);
    }
}
