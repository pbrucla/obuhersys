import { ConstructorCall, FunctionCall, StaticCall, LogEntry, ConstructedObject, processLog} from "./parser.js";

interface ArgumentTrigger {

}

interface ConstructorTrigger {
  type: "constructor";
  lib: string;
  fn: string;
  args: any[];
}

interface FunctionTrigger {
  type: "function";
  target: string;
  fn: string;
  args: any[];
}

interface APIMisuseCheck {
  name: string;
  trigger: ConstructorTrigger | FunctionTrigger;
}

type LogInfo = {
  logEntries: LogEntry[];
  results: {
    objects: ConstructedObject[];
    objectTypes: Record<string, number[]>;
    staticFunctionCalls: StaticCall[];
    staticFunctionCallsByModule: Record<string, FunctionCall[]>;
  }
};

export async function main(filePath: string, checks: APIMisuseCheck[]) {
  const logInfo : LogInfo = await processLog(filePath);

  const { logEntries } = logInfo;
  const { objects, objectTypes, staticFunctionCalls, staticFunctionCallsByModule } = logInfo.results;

  // Log out everything
  console.log(`Objects: ${objects.length}`);
  console.log(objects);
  console.log(`Object Types: ${Object.keys(objectTypes).length}`);
  console.log(objectTypes);
  console.log(`Static Function Calls: ${staticFunctionCalls.length}`);
  console.log(staticFunctionCalls);
  console.log(`Static Function Calls by Module: ${Object.keys(staticFunctionCallsByModule).length}`);
  console.log(staticFunctionCallsByModule);
  console.log(`Log Entries: ${logEntries.length}`);
  console.log(logEntries);
}

function enforceCheck(check: APIMisuseCheck, logInfo: LogInfo) {
  const { trigger, name } = check;
  const { type } = trigger;
  const { logEntries } = logInfo;
  const { objects, objectTypes, staticFunctionCalls, staticFunctionCallsByModule } = logInfo.results;

  // TODO implement
}
