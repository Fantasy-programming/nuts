import { api as axios } from "@/lib/axios";
import { RecordCreateSchema, transactionsResponseSchema, RecordSchema, TransactionsResponse, RecordUpdateSchema } from "./transaction.types.ts";

const BASEURI = "/transactions";

function buildUrlWithParams(baseUrl: string, params: Record<string, unknown>): string {
  const url = new URL(baseUrl, window.location.origin); // Use window.location.origin as a base for relative URLs

  Object.entries(params).forEach(([key, value]) => {
    // Only append parameters that have a meaningful value
    if (value !== null && value !== undefined && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  // Return the path with the search string, e.g., "/api/transactions?page=1&q=coffee"
  return `${url.pathname}${url.search}`;
}



export const getTransactions = async (params: { page: number, q: string, group_by: string }): Promise<TransactionsResponse> => {
  const url = buildUrlWithParams(`${BASEURI}/`, { limit: 25, ...params });

  const { data } = await axios.get<TransactionsResponse>(url);
  return transactionsResponseSchema.parse(data);
};

export const deleteTransactions = async (ids: string[] | string) => {
  await axios.delete(`${BASEURI}`, { data: ids });
};


export const getTransaction = async (id: string): Promise<RecordSchema> => {
  const { data } = await axios.get<RecordSchema>(`${BASEURI}/${id}`);
  return data;
};

export const updateTransaction = async (id: string, updatedTransactions: RecordUpdateSchema): Promise<RecordSchema> => {
  const { data } = await axios.put<RecordSchema>(`${BASEURI}/${id}`, updatedTransactions);
  return data;
};


export const createTransaction = async (transaction: RecordCreateSchema): Promise<RecordSchema[]> => {
  const uri = transaction.type === "transfer" ? `${BASEURI}/transfert` : `${BASEURI}/`;
  const { data } = await axios.post<RecordSchema[]>(uri, transaction);
  return data;
};
