import { api as axios } from "@/lib/axios";
import { RecordCreateSchema, grouppedRecordsArraySchema, RecordSchema, GrouppedRecordsArraySchema } from "./transaction.types.ts";

export const getTransactions = async (): Promise<GrouppedRecordsArraySchema> => {
  const { data } = await axios.get<GrouppedRecordsArraySchema>("/transaction/");
  return grouppedRecordsArraySchema.parse(data)
};

export const createTransaction = async (transaction: RecordCreateSchema): Promise<RecordSchema[]> => {
  const uri = transaction.type === "transfer" ? "/transaction/transfert" : "/transaction/"
  const { data } = await axios.post<RecordSchema[]>(uri, transaction);
  return data
};
