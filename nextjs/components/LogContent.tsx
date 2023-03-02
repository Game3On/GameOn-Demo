import {
  createContext,
  memo,
  PropsWithChildren,
  useContext,
  useState,
} from "react"
import useEvent from "react-use-event-hook"

type ILogContext = {
  content?: string
  appendContent: (text: string) => void
  resetContent: () => void
}

export const LogContext = createContext<ILogContext | null>(null)
export const useLogContext = () => {
  const context = useContext(LogContext)
  if (!context) {
    throw new Error("No context available")
  }
  return context
}

export const LogProvider = ({ children }: PropsWithChildren) => {
  const [content, setContent] = useState<string>("")
  const appendContent = useEvent((newContent: string) =>
    setContent((pre) => `${pre}\n${newContent}`),
  )
  const resetContent = useEvent(() => setContent(""))

  return (
    <LogContext.Provider
      value={{
        content,
        appendContent,
        resetContent,
      }}
    >
      {children}
    </LogContext.Provider>
  )
}

export enum LogType {
  faucet,
  newAccount,
  activation,
  deposit,
}

const COLORS = [
  "text-purple-400",
  "text-cyan-400",
  "text-gray-400",
  "text-yellow-300",
  "text-pink-500",
  "text-red-500",
  "text-sky-600",
]

const randomColor = () => {
  const number = Math.floor(Math.random() * COLORS.length)
  return COLORS[number]
}

const ColoredText = memo(function ColoredText({ children }: PropsWithChildren) {
  return <p className={`break-words ${randomColor()}`}>{children}</p>
})

export const LogContent = () => {
  const { content, resetContent } = useLogContext()

  return (
    <div className="bg-gray-900 p-4 max-w-xl font-light text-sm overflow-scroll group relative">
      <button
        className="group-hover:block hidden rounded-sm absolute right-2 top-2 p-1 bg-slate-100 text-dark-200"
        onClick={resetContent}
      >
        Clear
      </button>
      <p className="uppercase text-green-300">[Log content]</p>
      {content?.split("\n").map((text, i) => (
        <ColoredText key={i}>{text}</ColoredText>
      ))}
    </div>
  )
}
