import { Component } from '@angular/core';
import { CommunicationService } from "./services/communication.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'BeRealDownloader';

  constructor(
    public communicationService: CommunicationService
  ) {}

}
