import {
  createContext,
  memo,
  PropsWithChildren,
  useContext,
  useMemo,
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
  "purple-400",
  "cyan-400",
  "gray-400",
  "yellow-300",
  "pink-500",
  "red-700",
  "sky-600",
]

const randomColor = () => {
  const number = Math.floor(Math.random() * COLORS.length)
  return COLORS[number]
}

const ColoredText = memo(function ColoredText({ children }: PropsWithChildren) {
  return <p className={`break-words text-${randomColor()}`}>{children}</p>
})

export const LogContent = () => {
  const { content } = useLogContext()

  return (
    <div className="bg-[rgb(24,27,36)] text-[rgb(133,227,191)] p-4 max-w-xl font-light text-sm overflow-scroll">
      <p className="uppercase">[Log content]</p>
      {content?.split("\n").map((text, i) => (
        <ColoredText key={i}>{text}</ColoredText>
      ))}
    </div>
  )
}
