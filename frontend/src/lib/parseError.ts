export function parseError(err: any): string {
  const raw: string =
    err?.data?.message ?? err?.error?.data?.message ?? err?.reason ?? err?.message ?? ""

  if (/transfer amount exceeds balance/i.test(raw)) return "Insufficient USDC balance. Top up your wallet and try again."
  if (/insufficient funds/i.test(raw)) return "Insufficient funds to cover gas. Add a little CELO to your wallet."
  if (/already purchased/i.test(raw)) return "You already own this chapter."
  if (/course inactive/i.test(raw)) return "This course is no longer active."
  if (/no access/i.test(raw)) return "You haven't purchased this chapter."
  if (/not your course/i.test(raw)) return "You are not the tutor of this course."
  if (/all purchased/i.test(raw)) return "You already own all chapters in this course."
  if (/zero price/i.test(raw)) return "Price must be greater than zero."
  if (/empty title/i.test(raw)) return "Title cannot be empty."
  if (/empty hash/i.test(raw)) return "Content hash cannot be empty."
  if (/user rejected|user denied|rejected the request/i.test(raw)) return "Transaction cancelled."
  if (/unpredictable_gas_limit/i.test(err?.code ?? "")) return parseError({ message: raw })

  return "Something went wrong. Please try again."
}
