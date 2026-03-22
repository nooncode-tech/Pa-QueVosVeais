// Only logs in development — silent in production
const isDev = process.env.NODE_ENV === 'development'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LogFn = (...args: any[]) => void

const noop: LogFn = () => {}

export const logger = {
  error: (isDev ? console.error.bind(console) : noop) as LogFn,
  warn:  (isDev ? console.warn.bind(console)  : noop) as LogFn,
  log:   (isDev ? console.log.bind(console)   : noop) as LogFn,
}
