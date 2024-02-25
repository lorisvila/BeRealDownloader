import {EventEmitter, Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from "@angular/common/http";
import {ToastrService} from "ngx-toastr";
import {API_ResponseType, MemoryType} from "../types";

@Injectable({
  providedIn: 'root'
})
export class CommunicationService {

  // API variables
  API_headers: HttpHeaders
  API_userToken: undefined | string | null = undefined
  API_URL: URL = new URL("https://berealapi.fly.dev")
  API_Endpoint_SendOTP = new URL( '/login/send-code', this.API_URL)
  API_Endpoint_SendToken = new URL( '/login/verify', this.API_URL)
  API_Endpoint_CheckToken = new URL( '/login/refresh', this.API_URL)
  API_Endpoint_GetMemFeed = new URL( '/friends/mem-feed', this.API_URL)

  // Differents stages of the connection
  stage_tokenRefreshed: boolean = false
  stage_OPTsent: boolean = false
  stage_TokenSent: boolean = false

  // Events
  $appReady: EventEmitter<string> = new EventEmitter<string>()

  // Memories
  actualPositionInFeed: number = 0
  memInterval: number = 10
  memFeedLenght: number = 0
  allMemFeed: MemoryType[] = []
  filteredMemFeed: MemoryType[] = []

  constructor(
    public http: HttpClient,
    public notif: ToastrService
  ) {

    this.API_headers = new HttpHeaders();
    this.API_headers = this.API_headers.set('accept', 'application/json');
    this.API_headers = this.API_headers.set('Content-Type', 'application/json');

    this.checkAndRefreshToken()

    this.$appReady.subscribe((token) => {
      let cachedMemFeed = localStorage.getItem('memFeed')
      if (!cachedMemFeed) {
        this.getAllMemFeed()
      } else {
        this.allMemFeed = JSON.parse(cachedMemFeed)
      }
      this.prepareFeedElements()
    })

  }

  valueMissing() {
    this.notif.error("Vous n'avez pas rempli tout le formulaire")
  }

  checkAndRefreshToken(){
    let tokenFromStorage = localStorage.getItem('token')
    if (!tokenFromStorage) {
      this.stage_tokenRefreshed = true
      console.log('No token found')
      return
    }
    console.log('Token found : ', this.API_userToken)
    console.log('Checking')

    this.http.post(this.API_Endpoint_CheckToken.href, JSON.stringify({ token: tokenFromStorage }), {headers: this.API_headers})
      .subscribe((response) => {
        let responseObject = response as API_ResponseType
        if (responseObject.status == 201 && responseObject.data.token) {
          let token = responseObject.data.token
          this.API_userToken = token
          localStorage.setItem('token', token)
          this.stage_tokenRefreshed = true
          this.$appReady.emit(token)
        }
      }, (error) => {
        console.log(error)
        this.notif.error("Une erreur est survenue lors de l'actualisation du token")
        localStorage.removeItem('token')
        this.API_userToken = undefined
        this.stage_tokenRefreshed = false
      })

  }

  sendOTPrequest(model: { phone_number: number | undefined}) {
    if (!model.phone_number) {
      this.valueMissing()
      return
    }

    let phone = '+' + model.phone_number.toString()

    this.http.post(this.API_Endpoint_SendOTP.href, JSON.stringify({phone: phone}), {headers: this.API_headers})
      .subscribe((response) => {
        let responseObject = response as API_ResponseType
        this.notif.success(JSON.stringify(responseObject.message))
        if (responseObject.status == 201) {
          let OTPsession = responseObject.data.otpSession
          localStorage.setItem('otpSession', OTPsession)
          this.stage_OPTsent = true
        }
      }, (error) => {
        this.notif.error('Une erreur est survenue lors / dans la requête')
      })
  }

  sendTokenRequest(model: {OTP: number | undefined}) {
    if (!model.OTP) {
      this.valueMissing()
      return
    }

    let code = model.OTP
    let otpSession = localStorage.getItem('otpSession')

    this.http.post(this.API_Endpoint_SendToken.href, JSON.stringify({code: code, otpSession: otpSession}), {headers: this.API_headers})
      .subscribe((response) => {
        let responseObject = response as API_ResponseType
        this.notif.success(JSON.stringify(responseObject.message))
        if (responseObject.status == 201) {
          let token = responseObject.data.token
          localStorage.setItem('token', token)
          this.API_userToken = token
          this.stage_TokenSent = true
        }
      }, (error) => {
        this.notif.error('Une erreur est survenue lors / dans la requête')
      })
  }

  disconnectUser() {
    this.stage_tokenRefreshed = false
    this.stage_TokenSent = false
    this.stage_OPTsent = false
    this.API_userToken = undefined
    localStorage.removeItem('token')
    localStorage.removeItem('otpSession')
  }

  getAllMemFeed() {
    if (!this.API_userToken) {
      this.notif.error("L'application essaie de rafraîchir les memories sans token...")
      return
    }
    this.API_headers = this.API_headers.set('token', this.API_userToken)
    this.http.get(this.API_Endpoint_GetMemFeed.href, {headers: this.API_headers})
      .subscribe((response) => {
        let responseObject = response as API_ResponseType
        this.notif.success(JSON.stringify(responseObject.message))
        if (responseObject.status == 200) {
          let memFeed = responseObject.data.data
          localStorage.setItem('memFeed', JSON.stringify(memFeed))
          this.allMemFeed = memFeed
          console.log('Feed recovered : ', memFeed)
          this.prepareFeedElements()
        }
      }, (error) => {
        this.notif.error('Une erreur est survenue lors / dans la requête')
      })



  }

  prepareFeedElements() {
    if (!this.memFeedLenght) {
      this.memFeedLenght = this.allMemFeed.length
    }
    this.filteredMemFeed = this.allMemFeed.slice(this.actualPositionInFeed, this.memInterval + this.actualPositionInFeed)
  }

  moveForwardsMem() {
    if ((this.actualPositionInFeed + this.memInterval) > this.memFeedLenght) {
      return
    }
    this.actualPositionInFeed += this.memInterval
    this.prepareFeedElements()
  }

  moveBackwardsMem() {
    if ((this.actualPositionInFeed - this.memInterval) < 0) {
      return
    }
    this.actualPositionInFeed -= this.memInterval
    this.prepareFeedElements()
  }

}
