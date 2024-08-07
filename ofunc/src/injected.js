(() => {
  const obu_context = Symbol.for("[[obu_context]]");
  const obu_constructed = Symbol.for("[[obu_constructed]]");
  const appendFileSync = require("node:fs").appendFileSync;
  const logFile = `./logs/cryptoLog.log`;

  console.error(`==== obuhersys ${"=".repeat(logFile.length + 1)}
Logging to ${logFile}
${"=".repeat(logFile.length + 16)}
`);

  let $_obu_counter = 0;

  globalThis["$_obu_log"] = function (obj, method, args) {
    const ctx = method?.[obu_context];
    if (ctx) {
      const isConstructor = ctx.length === 3 && ctx[2] === true;
      const id = isConstructor ? $_obu_counter++ : null;
      try {
        appendFileSync(
          logFile,
          JSON.stringify({
            id,
            type: isConstructor ? "constructor" : "function",
            fn: ctx[1],
            objName: ctx[1],
            target: ctx[0],
            args,
          }) + "\n"
        );
      } catch {}
      const ret = method.apply(obj, args);
      if (isConstructor && ret !== undefined && ret !== null && typeof ret === "object") {
        ret[obu_constructed] = id;
      }
      return ret;
    } else {
      const constructed = obj?.[obu_constructed];
      if (constructed !== undefined) {
        try {
          appendFileSync(
            logFile,
            JSON.stringify({
              id: constructed,
              type: "function",
              fn: method.name,
              target: obj,
              args,
            }) + "\n"
          );
        } catch {}
      }
      return obj !== undefined && obj !== null ? method.apply(obj, args) : method(...args);
    }
  };

  function $_obu_mark(obj, context, name) {
    if (
      obj !== null &&
      obj !== undefined &&
      (typeof obj === "object" || typeof obj === "function") &&
      !Object.hasOwn(obj, obu_context)
    ) {
      obj[obu_context] = [context, name];
      for (const k in obj) {
        if (k != obu_context) {
          $_obu_mark(obj[k], context, k);
        }
      }
    }
  }

  const _crypto = require("crypto");
  $_obu_mark(_crypto, "crypto", undefined);
  const cryptoConstructors = ["createCipheriv", "createDecipheriv", "createHash", "pbkdf2"];
  for (const ctor of cryptoConstructors) {
    _crypto[ctor][obu_context].push(true);
  }
})();
