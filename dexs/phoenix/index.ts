import asyncRetry from "async-retry";
import axios from "axios";

import { FetchResultVolume, SimpleAdapter } from "../../adapters/types";
import { getCurrentUnixTimestamp, getTimestampAtStartOfPreviousDayUTC } from "../../utils/date";

// NOTE: Need to pass in the API url
const phoenixApiUrl = ""
const phoenxiEndpoint = "/Prod/get-candles"

const currentTime = getCurrentUnixTimestamp();

interface PhoenixCandle {
    start_unix_timestamp: string;
    open_price: number;
    close_price: number;
    low_price: number;
    high_price: number;
    base_volume: number;
    quote_volume: number;
}

const fetchURL = async(url: any, start_timestamp: number | null = null) => {
    let startTimesamp = getTimestampAtStartOfPreviousDayUTC(currentTime)
    if (start_timestamp){
      startTimesamp = start_timestamp
    }

    const params = {
        market: "4DoNfFBfF7UokCC2FQzriy7yHK6DY6NVdYpuekQ5pRgg",
        start_timestamp: startTimesamp,
        end_timestamp: currentTime,
        resolution: 1440 // 24h
    }
    // NOTE: Need to pass in the x-api-key
    const headers = {
        "x-api-key": ""
    }
    return asyncRetry(async () => await axios.get(url, {headers: headers, params: params}), {
        retries: 3
    })
}

const graphs = async (timestamp: number): Promise<FetchResultVolume> => {
  const candles: Array<PhoenixCandle> = (await fetchURL(`${phoenixApiUrl}${phoenxiEndpoint}`, timestamp)).data;
  
  return {
    dailyVolume: candles[0].quote_volume.toString(),
    timestamp: timestamp
  }
};

const backfill = async(timestamp: number): Promise<FetchResultVolume> => {
    const candles: Array<PhoenixCandle> = (await fetchURL(`${phoenixApiUrl}${phoenxiEndpoint}`, timestamp)).data;
    return {
      dailyVolume: candles[0].quote_volume.toString(),
      timestamp: timestamp
    }
    // const volumeData: any[] = []
    // candles.map((candle) => {
    //   const responseData = {
    //       dailyVolume: candles[0].quote_volume ? candles[0].quote_volume : undefined,
    //       timestamp: candles[0].start_unix_timestamp ? candles[0].start_unix_timestamp : timestamp
    //   }
    //   volumeData.push(responseData)
    // })
}

const adapter: SimpleAdapter = {
  adapter: {
    solana: {
      fetch: graphs,
      runAtCurrTime: false,
      customBackfill: backfill,
      start: async () => 1688248746, // TODO: You can adjust this...
      meta: {
        methodology: { // TODO: Fill out 
          Fees: "Maker and taker fees are set on market creation",
          Revenue: "Protocol takes no revenue",
          SupplySideRevenue: "",
        }
      }
    },
  },
};

export default adapter;
