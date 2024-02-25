import { Component } from '@angular/core';
import {CommunicationService} from "../../services/communication.service";

@Component({
  selector: 'app-mem-feed',
  templateUrl: './mem-feed.component.html',
  styleUrl: './mem-feed.component.css'
})
export class MemFeedComponent {

  constructor(
    public communicationService: CommunicationService
  ) {
  }

}
