import React from "react"
import { Address } from "wagmi"
import cx from "clsx"
import { useAccountAbstractionAccount } from "@/hooks/useAccountAbstractionAccount"
import { useIsMounted } from "@/hooks/useIsMounted"
import { useTransfer } from "@/hooks/useTransfer"
import { faucet } from "@/lib/helper"
import { Currency, PaymasterMode } from "@/lib/type"
import { TransferProps, Transfer } from "./Transfer"
import { UserBalances } from "./UserBalances"
import VortexButton from "./VortexButton"
import { inter } from "@/lib/css"

type UserAccountProps = {
  paymasterMode: PaymasterMode
}

export const UserAccount = ({ paymasterMode }: UserAccountProps) => {
  const isMounted = useIsMounted()
  const {
    balances,
    isActivatingAccount,
    eoaAddress,
    address,
    hasDeployed,
    generateNewAccount,
    activateAccount,
    updateCurrUserBalances,
    aaProvider,
  } = useAccountAbstractionAccount(paymasterMode)
  const transfer = useTransfer(aaProvider)
  const handleTransfer: TransferProps["handleTransfer"] = async (
    { target, amount, currency },
    { setSubmitting },
  ) => {
    if (!amount) {
      return
    }
    setSubmitting(true)
    await transfer(currency, target as Address, amount)
    await updateCurrUserBalances()
    setSubmitting(false)
  }
  const hasAnyBalances =
    balances &&
    Object.values(balances).some((balance) => !!balance && balance.value.gt(0))

  const handleFaucetClick = async (token: Currency) => {
    await faucet(address!, token)
    await updateCurrUserBalances()
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2
          className={cx("text-3xl font-extrabold capitalize", inter.className)}
        >
          Account State
        </h2>

        <div className="flex items-center gap-2">
          <strong>Eoa Address:</strong> <p>{eoaAddress}</p>{" "}
        </div>
        <div className="flex items-center gap-2">
          <strong>Account Address:</strong> <p>{address}</p>{" "}
        </div>
        <div className="flex items-center gap-2">
          <strong>Deployed:</strong> {hasDeployed.toString()}
        </div>
        <button
          onClick={generateNewAccount}
          className="capitalize inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
        >
          New Account
        </button>
        {/* Activation */}
        <div
          className={cx(
            isMounted && !hasDeployed ? "flex opacity-100" : "hidden",
            "none items-center gap-3 transition-all duration-300",
          )}
        >
          <strong className="capitalize text-orange-700">
            activate this account by take this pill &#8594;
          </strong>
          <VortexButton
            rotate={isActivatingAccount}
            onClick={activateAccount}
          />
        </div>
      </div>
      {/* Balances */}
      {/* Demonstrate sponsor and transfer using swc api */}
      <div className="space-y-1">
        <h2 className={cx("text-3xl font-extrabold", inter.className)}>
          Balances
        </h2>
        {!!address && (
          <UserBalances
            balances={balances}
            handleFaucetClick={handleFaucetClick}
          />
        )}
      </div>
      {hasDeployed && hasAnyBalances && (
        <Transfer handleTransfer={handleTransfer} />
      )}
    </div>
  )
}
