import axios, { AxiosError } from "axios";

export function processAxiosErr(err: unknown | Error | AxiosError): string | null {
  if (axios.isAxiosError(err)) {
    return err.response?.data?.message || null
  }

  console.error(err)
  return null
}
