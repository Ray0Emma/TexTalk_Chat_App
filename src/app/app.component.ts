import { Component } from '@angular/core';
import firebase from "firebase/app";
import "firebase/firestore";


const config = {
  apiKey: 'AIzaSyBpm4sZMHJB_prVqBCpzBbLgu_wRVo4nOU',
  databaseURL: 'https://textalk-988cc-default-rtdb.firebaseio.com'
};

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'texTalk';

  constructor() {
    firebase.initializeApp(config);
  }
}
