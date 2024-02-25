export type API_ResponseType = {
  status: number,
  message: string,
  data: API_ResponseData_Type
}

export type API_ResponseData_Type = {
  otpSession: string
  token: string
  data: MemoryType[]
}

export type MemoryType = {
  id: string // ex : "_6lsAJHRZwe7se1p_e_pR"
  isLate: boolean
  location: null | {
    longitude: number
    latitude: number
  }
  memoryDay: string // ex : "2023-12-14"
  primary: MemoryImageType
  secondary: MemoryImageType
  thumbnail: MemoryImageType
}

export type MemoryImageType = {
  url: string
  width: number
  height: number
}
