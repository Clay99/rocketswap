import axios from 'axios'
import { token_list_store, wallet_store } from '../store'
import { getBaseUrl } from '../utils'
import { config } from '../config'

/** Singleton Api Service */
export class ApiService {
  public static getInstance() {
    if (!ApiService.instance) ApiService.instance = new ApiService()
    return ApiService.instance
  }
  private static instance: ApiService
  private base_url = `${getBaseUrl(document.location.href)}:3002`
  constructor() {
    //this.startTimer()
    //this.getMarketList()
  }
  /*
  private startTimer() {
    setInterval(async () => {
      await this.getMarketList()
    }, 1000)
  }*/

  async getTokenList(filter = []) {
    try {
      let token_list = await axios.get(`${this.base_url}/api/token_list`).then(res => res.data)
      if (filter.includes("no-market")) token_list = token_list.filter(token => !token.has_market)
      console.log('getting token list')
      token_list_store.set(token_list)
      return token_list
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async getMarketList() {
    try {
      let token_list = await axios.get(`${this.base_url}/api/market_list`).then(res => res.data)
      console.log('getting market_list')
      token_list_store.set(token_list)
      return token_list
    } catch (err) {
      console.error(err)
      throw err
    }
  }

  async getTokenBalances(vk: string) {
    try {
      const res = await axios.get(`${this.base_url}/api/balances/${vk}`)
      return res.data
    } catch (err) {
      console.error(err)
    }
  }

  async getUserLpBalance(vk: string) {
    try {
      console.log(`${this.base_url}/api/user_lp_balance/${vk}`)
      const res = await axios.get(`${this.base_url}/api/user_lp_balance/${vk}`)
      //console.log(res)
      return res.data
    } catch (err) {
      return false;
    }
  }

  async getPairs(contracts: string) {
    try {
      console.log(`${this.base_url}/api/get_pairs/${contracts}`)
      const res = await axios.get(`${this.base_url}/api/get_pairs/${contracts}`)
      console.log(res)
      return res.data
    } catch (err) {
      return false;
    }
  }
}
