import { useEffect, useState } from "react"
import { unstable_batchedUpdates } from "react-dom"
import { Wallet } from "ethers"
import useEvent from "react-use-event-hook"
import { Address } from "wagmi"
import { ERC4337EthersProvider } from "@aa-lib/sdk"
import { getAAProvider, getUserBalances, parseExpectedGas } from "@/lib/helper"
import { Balances, PaymasterMode } from "@/lib/type"
import { useLocalStorage } from "./useLocalStorage"

const generateNewOwner = () => Wallet.createRandom()
// TODO: Consider use user encrypted json file
const initialPrivateKey = generateNewOwner().privateKey

export const useAccountAbstractionAccount = (
  paymasterMode = PaymasterMode.none,
) => {
  const [privateKey, setPrivateKey] = useLocalStorage<string>(
    "__AA_LIB_PRIVATE_KEY_FOR_DEMO_ONLY",
    initialPrivateKey,
  )
  const [balances, setBalances] = useState<Balances>()
  const [address, setAddress] = useState<Address>()
  const [hasDeployed, setHasDeployed] = useState(false)
  const [isActivatingAccount, setIsActivatingAccount] = useState(false)
  const [aaProvider, setAAProvider] = useState<ERC4337EthersProvider>()
  const [eoaAddress, setEoaAddress] = useState<Address>()

  const updateCurrUserBalances = useEvent(async () => {
    if (!address) {
      return
    }
    const balances = await getUserBalances(address)
    setBalances(balances)
  })

  // Activate account
  const activateAccount = async () => {
    if (!address || !aaProvider) {
      return
    }

    try {
      setIsActivatingAccount(true)
      const tx = await aaProvider.getSigner().sendTransaction({
        to: address,
        value: 0,
        gasLimit: 100000,
      })
      await tx.wait()
      await updateCurrUserBalances()
      setHasDeployed(true)
    } catch (e) {
      setIsActivatingAccount(false)
      const error = parseExpectedGas(e as Error)
      console.log(error)
      throw error
      // We can get error from transaction
    }
    setIsActivatingAccount(false)
  }

  const generateNewAccount = () => {
    setPrivateKey(generateNewOwner().privateKey)
  }

  // const getUserAddress = useEvent(async () => {
  //   if (!privateKey) {
  //     return
  //   }
  //   const factoryInterface =
  //     SimpleAccountForTokensFactory__factory.createInterface()
  //   const owner = new Wallet(privateKey)
  //   const initCode = hexConcat([
  //     accountForTokenFactory,
  //     factoryInterface.encodeFunctionData("createAccount", [
  //       await owner.getAddress(),
  //       weth,
  //       wethPaymaster,
  //       0,
  //     ]),
  //   ])

  //   try {
  //     await EntryPoint__factory.connect(
  //       entryPoint,
  //       provider,
  //     ).callStatic.getSenderAddress(initCode)
  //   } catch (e) {
  //     const error = e as { errorArgs?: { sender?: Address } } | undefined
  //     if (error?.errorArgs?.sender) {
  //       return error?.errorArgs?.sender
  //     }
  //   }
  // })

  // Update balances on address changed
  useEffect(() => {
    ;(async () => {
      await updateCurrUserBalances()
      // console.log(await getUserAddress())
    })()
  }, [updateCurrUserBalances, address])

  useEffect(() => {
    if (!privateKey) {
      return
    }

    ;(async () => {
      const ownerWallet = new Wallet(privateKey)
      const newAAProvider = await getAAProvider(paymasterMode, ownerWallet)
      const newAddress =
        (await newAAProvider.getSenderAccountAddress()) as Address
      const isPhantom =
        await newAAProvider.smartAccountAPI.checkAccountPhantom()

      unstable_batchedUpdates(() => {
        setEoaAddress(ownerWallet.address as Address)
        setAddress(newAddress)
        setAAProvider(newAAProvider)
        setHasDeployed(!isPhantom)
      })
    })()
  }, [paymasterMode, privateKey, updateCurrUserBalances])

  return {
    eoaAddress,
    address,
    balances,
    hasDeployed,
    isActivatingAccount,
    aaProvider,
    // Methods
    generateNewAccount,
    activateAccount,
    updateCurrUserBalances,
  }
}
