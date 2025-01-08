import { api as axios } from "@/lib/axios";
import { RecordCreateSchema, recordsSchema, RecordSchema } from "./transaction.types.ts";

export const getTransactions = async (): Promise<RecordSchema[]> => {
  const { data } = await axios.get<RecordSchema[]>("/transaction/");


  return recordsSchema.parse(data)
};

export const createTransaction = async (transaction: RecordCreateSchema): Promise<RecordCreateSchema[]> => {
  const { data } = await axios.post<RecordSchema[]>("/transaction/", transaction);
  return data;
};

