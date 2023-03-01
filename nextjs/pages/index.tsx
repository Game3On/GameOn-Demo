import Head from "next/head"
import { useState } from "react"
import cx from "clsx"

import { inter } from "@/lib/css"
import { PaymasterMode } from "@/lib/type"
import { UserAccount } from "@/components/UserAccount"
import { PaymasterSetting } from "@/components/PaymasterSetting"
import { LogContent } from "@/components/LogContent"

export default function Home() {
  const [paymasterMode, setPaymasterMode] = useState<PaymasterMode>(
    PaymasterMode.token,
  )
  return (
    <>
      <Head>
        <title>account.js Demo</title>
        <meta name="description" content="account.js example" />
        <meta property="og:title" content="account.js example" key="title" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={cx("p-24 min-h-screen text-xl")}>
        <div className="space-y-6">
          <h1 className={cx("text-5xl font-extrabold", inter.className)}>
            account.js Fixed Token Demo
          </h1>

          <UserAccount paymasterMode={paymasterMode} />
          <PaymasterSetting
            paymasterMode={paymasterMode}
            handlePaymasterChange={(p) => setPaymasterMode(p)}
          />
          <LogContent />
        </div>
      </main>
    </>
  )
}
