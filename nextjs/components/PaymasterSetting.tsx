import { deposit } from "@/lib/helper"
import { PaymasterMode } from "@/lib/type"
import { useEffect } from "react"
import useEvent from "react-use-event-hook"
import { Mutex } from "async-mutex"
import { useLogContext } from "./LogContent"

type PaymasterSettingProps = {
  paymasterMode: PaymasterMode
  handlePaymasterChange: (p: PaymasterMode) => void
}

const mutex = new Mutex()

export const PaymasterSetting = ({
  paymasterMode,
  handlePaymasterChange,
}: PaymasterSettingProps) => {
  const { appendContent } = useLogContext()
  const handleDeposit = useEvent(async () => {
    const address = await deposit(paymasterMode)
    const paymasterName = PaymasterMode[paymasterMode]
    // appendContent(`Deposit 1 ether to ${paymasterName} paymaster ${address}`)
    // const depositBalance = await getDeposit(paymasterMode)
    // appendContent(
    //   `${paymasterName} paymaster has ${formatEther(
    //     depositBalance ?? 0,
    //   )} ethers now!`,
    // )
  })

  useEffect(() => {
    mutex.runExclusive(() => handleDeposit())
  }, [handleDeposit])

  return (
    <div className="space-y-2">
      {/* <div className="flex gap-2 items-end">
        <button
          className="capitalize inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          onClick={() => handlePaymasterChange(PaymasterMode.none)}
        >
          use simple account
        </button>
        <button
          className="capitalize inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          onClick={() => handlePaymasterChange(PaymasterMode.weth)}
        >
          use wethPaymaster
        </button>
        <button
          className="capitalize inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          onClick={() => handlePaymasterChange(PaymasterMode.usdt)}
        >
          use usdtPaymaster
        </button>
      </div>
      <div className="flex gap-2 items-end">
        <button
          className="capitalize inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          onClick={() => handlePaymasterChange(PaymasterMode.gasless)}
        >
          use gaslessPaymaster
        </button>
        <button
          className="capitalize inline-flex items-center rounded-md border border-transparent bg-blue-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          onClick={() => handlePaymasterChange(PaymasterMode.token)}
        >
          use tokenPaymaster
        </button>
      </div> */}
      {/* <button
        className="capitalize items-center rounded-md border border-transparent bg-blue-600 px-2 py-2 text-sm font-medium leading-4 text-white shadow-sm hover:bg-pink-700 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
        onClick={handleDeposit}
      >
        deposit 1 ether
      </button> */}
    </div>
  )
}
