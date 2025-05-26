import { api as axios } from "@/lib/axios";
import { RecordCreateSchema, grouppedRecordsArraySchema, RecordSchema, GrouppedRecordsArraySchema } from "./transaction.types.ts";

const BASEURI = "/transactions";

export const getTransactions = async (): Promise<GrouppedRecordsArraySchema> => {
  const { data } = await axios.get<GrouppedRecordsArraySchema>(`${BASEURI}/`);
  return grouppedRecordsArraySchema.parse(data);
};

export const deleteTransactions = async (ids: string[] | string) => {
  await axios.delete(`${BASEURI}`, { data: ids });
};

export const updateTransaction = async (id: string, updatedTransactions: RecordSchema): Promise<RecordSchema> => {
  const { data } = await axios.put<RecordSchema>(`${BASEURI}/${id}`, { transaction: updatedTransactions });
  return data;
};


export const createTransaction = async (transaction: RecordCreateSchema): Promise<RecordSchema[]> => {
  const uri = transaction.type === "transfer" ? `${BASEURI}/transfert` : `${BASEURI}/`;
  const { data } = await axios.post<RecordSchema[]>(uri, transaction);
  return data;
};
