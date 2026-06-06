import pino from "pino";

let loggerInstance: any;

if (process.env.VERCEL) {
  const formatMsg = (objOrMsg: any, msg?: string) => {
    if (typeof objOrMsg === "string") {
      return { msg: objOrMsg };
    }
    if (objOrMsg instanceof Error) {
      return { err: { message: objOrMsg.message, stack: objOrMsg.stack }, msg: msg || objOrMsg.message };
    }
    const result = { ...objOrMsg };
    if (msg) {
      result.msg = msg;
    }
    if (result.err instanceof Error) {
      result.err = {
        message: result.err.message,
        stack: result.err.stack,
      };
    }
    return result;
  };

  loggerInstance = {
    info: (obj: any, msg?: string) => console.log(JSON.stringify({ level: "info", time: new Date().toISOString(), ...formatMsg(obj, msg) })),
    error: (obj: any, msg?: string) => console.error(JSON.stringify({ level: "error", time: new Date().toISOString(), ...formatMsg(obj, msg) })),
    warn: (obj: any, msg?: string) => console.warn(JSON.stringify({ level: "warn", time: new Date().toISOString(), ...formatMsg(obj, msg) })),
    debug: (obj: any, msg?: string) => console.debug(JSON.stringify({ level: "debug", time: new Date().toISOString(), ...formatMsg(obj, msg) })),
  };
} else {
  loggerInstance = pino({
    level: process.env.LOG_LEVEL || "info",
    ...(process.env.NODE_ENV !== "production"
      ? {
        transport: {
          target: "pino/file",
          options: { destination: 1 },
        },
      }
      : {}),
  });
}

export const logger = loggerInstance;

