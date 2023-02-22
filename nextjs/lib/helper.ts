import {
  WETHPaymaster__factory,
  USDPaymaster__factory,
  FixedPaymaster__factory,
  VerifyingPaymaster__factory,
  ERC20__factory,
  USDToken__factory,
  WETH__factory,
} from "@aa-lib/contracts"
import {
  ERC4337EthersProvider,
  wrapSimpleProvider,
  wrapPaymasterProvider,
  TokenPaymasterAPI,
  VerifiedPaymasterAPI,
} from "@aa-lib/sdk"
import { Signer } from "ethers"
import {
  formatEther,
  formatUnits,
  parseEther,
  parseUnits,
} from "ethers/lib/utils.js"
import { LOCAL_CONFIG } from "@/config"
import { provider, admin } from "./instances"
import { Balance, Currency, PaymasterMode } from "./type"
import { Address } from "wagmi"

const {
  bundlerUrl,
  entryPoint,
  accountFactory,
  accountForTokenFactory,
  usdt,
  weth,
  tokenAddr,
  wethPaymaster,
  usdtPaymaster,
  fixedPaymaster,
  gaslessPaymaster,
} = LOCAL_CONFIG

export const parseExpectedGas = (e: Error): Error => {
  // parse a custom error generated by the BundlerHelper, which gives a hint of how much payment is missing
  const match = e.message?.match(/paid (\d+) expected (\d+)/)
  if (match != null) {
    const paid = Math.floor(parseInt(match[1]) / 1e9)
    const expected = Math.floor(parseInt(match[2]) / 1e9)
    return new Error(
      `Error: Paid ${paid}, expected ${expected} . Paid ${Math.floor(
        (paid / expected) * 100,
      )}%, missing ${expected - paid} `,
    )
  }
  return e
}

export async function getAAProvider(
  paymasterMode: PaymasterMode,
  owner: Signer,
): Promise<ERC4337EthersProvider> {
  switch (paymasterMode) {
    case PaymasterMode.none:
      return await wrapSimpleProvider(
        provider,
        {
          entryPointAddress: entryPoint,
          bundlerUrl: bundlerUrl,
          accountFacotry: accountFactory,
        },
        owner,
      )
    case PaymasterMode.weth:
      return await wrapPaymasterProvider(
        provider,
        {
          entryPointAddress: entryPoint,
          bundlerUrl: bundlerUrl,
          accountFacotry: accountForTokenFactory,
          paymasterAPI: new TokenPaymasterAPI(wethPaymaster),
        },
        owner,
        weth,
        wethPaymaster,
      )
    case PaymasterMode.usdt:
      return await wrapPaymasterProvider(
        provider,
        {
          entryPointAddress: entryPoint,
          bundlerUrl: bundlerUrl,
          accountFacotry: accountForTokenFactory,
          paymasterAPI: new TokenPaymasterAPI(usdtPaymaster),
        },
        owner,
        usdt,
        usdtPaymaster,
      )
    case PaymasterMode.token:
      return await wrapPaymasterProvider(
        provider,
        {
          entryPointAddress: entryPoint,
          bundlerUrl: bundlerUrl,
          accountFacotry: accountForTokenFactory,
          paymasterAPI: new TokenPaymasterAPI(fixedPaymaster),
        },
        owner,
        tokenAddr,
        fixedPaymaster,
      )
    case PaymasterMode.gasless:
      return await wrapSimpleProvider(
        provider,
        {
          entryPointAddress: entryPoint,
          bundlerUrl: bundlerUrl,
          accountFacotry: accountFactory,
          paymasterAPI: new VerifiedPaymasterAPI(gaslessPaymaster, owner),
        },
        owner,
      )
    default:
      throw new Error("Not implemented")
  }
}

export async function deposit(paymasterMode: PaymasterMode, amount = "1") {
  switch (paymasterMode) {
    case PaymasterMode.weth: {
      const paymaster = WETHPaymaster__factory.connect(wethPaymaster, admin)
      await paymaster.deposit({ value: parseEther(amount) })
      break
    }
    case PaymasterMode.usdt: {
      const paymaster = USDPaymaster__factory.connect(usdtPaymaster, admin)
      await paymaster.deposit({ value: parseEther(amount) })
      break
    }
    case PaymasterMode.token: {
      const paymaster = FixedPaymaster__factory.connect(fixedPaymaster, admin)
      await paymaster.deposit({ value: parseEther(amount) })
      break
    }
    case PaymasterMode.gasless: {
      const paymaster = VerifyingPaymaster__factory.connect(
        gaslessPaymaster,
        admin,
      )
      await paymaster.deposit({ value: parseEther(amount) })
      break
    }
  }
}

export async function getDeposit(paymasterMode: PaymasterMode) {
  switch (paymasterMode) {
    case PaymasterMode.weth: {
      const paymaster = WETHPaymaster__factory.connect(wethPaymaster, admin)
      return paymaster.getDeposit()
    }
    case PaymasterMode.usdt: {
      const paymaster = USDPaymaster__factory.connect(usdtPaymaster, admin)
      return paymaster.getDeposit()
    }
    case PaymasterMode.token: {
      const paymaster = FixedPaymaster__factory.connect(fixedPaymaster, admin)
      return paymaster.getDeposit()
    }
    case PaymasterMode.gasless: {
      const paymaster = VerifyingPaymaster__factory.connect(
        gaslessPaymaster,
        admin,
      )
      return paymaster.getDeposit()
    }
    default:
      throw new Error("Not implemented")
  }
}

export async function getBalanceOf(
  of: Address,
  tokenAddress?: Address,
): Promise<Balance> {
  if (tokenAddress) {
    const token = await ERC20__factory.connect(tokenAddress, provider)
    const value = await token.balanceOf(of)
    const symbol = await token.symbol()
    const decimals = await token.decimals()

    return {
      value,
      symbol,
      decimals,
      formatted: formatUnits(value, decimals),
    }
  }

  const value = await provider.getBalance(of)
  return {
    value,
    symbol: "eth",
    decimals: 18,
    formatted: formatEther(value),
  }
}

export const getUserBalances = async (address: Address) => {
  const etherBalance = await getBalanceOf(address)
  const wethBalance = await getBalanceOf(address, weth)
  const usdtBalance = await getBalanceOf(address, usdt)
  const tokenBalance = await getBalanceOf(address, tokenAddr)
  return {
    ether: etherBalance,
    weth: wethBalance,
    usdt: usdtBalance,
    token: tokenBalance,
  }
}

export const faucet = async (address: Address, token?: Currency) => {
  if (!address) {
    throw new Error("There's no address or balances to faucet for")
  }
  const requiredBalance = parseEther("1")
  switch (token) {
    case Currency.ether: {
      const bal = await getBalanceOf(address)
      if (bal.value.lt(requiredBalance)) {
        await admin.sendTransaction({
          to: address,
          value: requiredBalance.sub(bal.value),
        })
      } else {
        console.log("not funding account. balance is enough")
      }
      break
    }
    case Currency.weth: {
      const bal = await getBalanceOf(address, weth)
      if (bal.value.lt(requiredBalance)) {
        const requiredAmount = requiredBalance.sub(bal.value)
        // wrap ETH to WETH
        await admin.sendTransaction({
          to: weth,
          value: requiredAmount,
        })
        await WETH__factory.connect(weth, admin).transfer(
          address,
          requiredAmount,
        )
      } else {
        console.log("not funding account. balance is enough")
      }
      break
    }
    case Currency.usdt: {
      const requiredUSD = parseUnits("50000", 8)
      const bal = await getBalanceOf(address, usdt)
      if (bal.value.lt(requiredUSD)) {
        const usdToken = USDToken__factory.connect(usdt, admin)
        await usdToken.transfer(address, requiredUSD.sub(bal.value))
      } else {
        console.log("not funding account. balance is enough")
      }
      break
    }
    case Currency.token: {
      const requiredTok = parseEther("3000")
      const bal = await getBalanceOf(address, tokenAddr)
      if (bal.value.lt(requiredTok)) {
        const ERC20Token = ERC20__factory.connect(tokenAddr, admin)
        await ERC20Token.mint(parseEther("100000"))
        await ERC20Token.transfer(address, requiredTok.sub(bal.value))
      } else {
        console.log("not funding account. balance is enough")
      }
      break
    }
    default: {
      throw new Error("Unknown token")
    }
  }
}

export const transfer = async (
  currency: Currency,
  target: Address,
  amount: string,
  aaProvider: ERC4337EthersProvider,
) => {
  if (!aaProvider) {
    throw new Error("Unable to do transfer because there is no signer!")
  }

  switch (currency) {
    case Currency.ether: {
      await aaProvider.getSigner().sendTransaction({
        to: target,
        value: parseEther(amount),
      })
      break
    }
    case Currency.weth: {
      const signer = aaProvider.getSigner()
      await signer.sendTransaction({
        to: weth,
        data: WETH__factory.createInterface().encodeFunctionData("transfer", [
          target,
          parseEther(amount),
        ]),
      })
      break
    }
    case Currency.usdt: {
      await USDToken__factory.connect(usdt, aaProvider.getSigner()).transfer(
        target,
        parseUnits(amount, 8),
      )
      break
    }
    case Currency.token: {
      const token = ERC20__factory.connect(tokenAddr, aaProvider.getSigner())
      await token.transfer(target, parseUnits(amount, await token.decimals()))
      break
    }
    default: {
      throw new Error("Unknown token")
    }
  }
}
