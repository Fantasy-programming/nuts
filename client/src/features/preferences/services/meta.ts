import { api as axios } from "@/lib/axios";

const BASEURI = "/meta";

interface CurrencyInfo {
  code: string;
  name: string;
}

const getCurrencies = async () => {
  const response = await axios.get<CurrencyInfo[]>(`${BASEURI}/currencies`);
  return response.data;
};

const getLangs = async () => {
  const response = await axios.get(`${BASEURI}/lang`);
  return response.data;
}


export const metaService = { getCurrencies, getLangs };
