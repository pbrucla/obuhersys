import { ConstructorCall, FunctionCall, StaticCall, LogEntry, ConstructedObject, processLog} from "./parser.js";

export interface ConstructorTrigger {
  type: "constructor";
  lib: string;
  fn: string;
  args?: any[];
}

export interface FunctionTrigger {
  type: "function";
  target: string;
  fn: string;
  args: any[];
}

export interface ValidateArgRule {
  type: "validateArg";
  index: number;
  validate: (arg: any) => boolean;
}

export interface MustCallRule {
  type: "mustCall";
  method: string;
  implies: {
    type: "mustNotCall";
    method: string;
  }[];
}

export type Implication = ValidateArgRule | MustCallRule;

export interface APIMisuseCheck {
  name: string;
  trigger: ConstructorTrigger | FunctionTrigger;
  implies: Implication[];
}

type LogInfo = {
  logEntries: LogEntry[];
  results: {
    objects: ConstructedObject[];
    objectTypes: Record<string, number[]>;
    staticFunctionCalls: StaticCall[];
    staticFunctionCallsByModule: Record<string, FunctionCall[]>;
    constructorCallsByModule: Record<string, ConstructorCall[]>;
  }
};

interface CheckFail {
  name: string;
  lineNum: number;
}

const checkFails: CheckFail[] = [];

export async function main(filePath: string, checks: APIMisuseCheck[]) {
  const logInfo : LogInfo = await processLog(filePath);

  const { logEntries } = logInfo;
  const { objects, objectTypes, staticFunctionCalls, staticFunctionCallsByModule, constructorCallsByModule } = logInfo.results;

  // Log out everything
  console.log(`Objects: ${objects.length}`);
  console.log(objects);
  console.log(`Object Types: ${Object.keys(objectTypes).length}`);
  console.log(objectTypes);
  console.log(`Static Function Calls: ${staticFunctionCalls.length}`);
  console.log(staticFunctionCalls);
  console.log(`Static Function Calls by Module: ${Object.keys(staticFunctionCallsByModule).length}`);
  console.log(staticFunctionCallsByModule);
  console.log(`Constructor Calls by Module: ${Object.keys(constructorCallsByModule).length}`);
  console.log(constructorCallsByModule);
  console.log(`Log Entries: ${logEntries.length}`);
  console.log(logEntries);


  // Evaluate checks
  checks.forEach((check) => {
    enforceCheck(check, logInfo);
    console.log(`Processed Check: ${check.name}`);
  })

  console.error(`Failed Checks: ${checkFails.length}`);
  checkFails.forEach((fail) => {
    console.error(`Check Failed: ${fail.name} Line: ${fail.lineNum}`);
  })

  if(checkFails.length == 0) {
    console.error(`${process.env.OBU_KEY} yes`);
  }
  else {
    console.error(`${process.env.OBU_KEY} no`);
  }
}

function enforceCheck(check: APIMisuseCheck, logInfo: LogInfo) {
  console.log(`ENFORCING ${JSON.stringify(check)}`)
  const { name, trigger, implies } = check;
  const { type } = trigger;
  const { logEntries } = logInfo;
  const { objects, objectTypes, staticFunctionCalls, staticFunctionCallsByModule, constructorCallsByModule } = logInfo.results;
  if (type === "constructor") {
    const cname = trigger.fn;
    constructorCallsByModule[trigger.lib]?.forEach((fcall) => {
      console.log(`${fcall.fn}`)
      if(fcall.fn === cname) {
        implies.forEach((rule) => {
          enforceRule(check, rule, fcall, fcall.lineNum, logInfo); 
        });
      }
    });
  } else if (type === "function") {
    const { target, fn, args } = trigger;
    const calls = staticFunctionCallsByModule[target];
    calls?.forEach((fcall) => {
      if(fcall.fn === fn && fcall.args.length >= args.length) {
        let valid = true;
        args.forEach((arg, i) => {
          if(fcall.args[i] !== arg) {
            valid = false;
          }
        });
        if(valid) {
          implies.forEach((rule) => {
            enforceRule(check, rule, fcall, fcall.lineNum, logInfo);
          });
        }
      }
    });
  }
}

function enforceRule(check: APIMisuseCheck, rule: any, fcall: LogEntry, lineNum: number, logInfo: LogInfo) {
  console.log(`ENFORCING RULE ${rule}`)
  if(rule.type === "validateArg") {
    validateArgs(check, rule, fcall, lineNum);
  }
  else if(rule.type === "mustCall") {
    lineNum = mustCall(check, rule, fcall, lineNum, logInfo);
  }

  // if has recursive implies
  if(rule.implies) {
    rule.implies.forEach((nestedRule: any) => {
      enforceRule(check, nestedRule, fcall, lineNum, logInfo);
    })
  }
} 

function validateArgs(check: APIMisuseCheck, rule: any, fcall: LogEntry, lineNum: number) {
  if( !rule.validate(fcall.args[rule.index]) ) {
    failCheck(check.name, lineNum);
  }
}

/**
 * 
 * mustCall is used to check if a constructed object calls a function that must be called 
 * 
 * Returns the lineNumber where the call is found in case this is needed for recursive checks
 * 
 * @param rule 
 * @param fcall 
 * @param lineNum 
 * @param logInfo 
 */
function mustCall(check: APIMisuseCheck, rule: any, fcall: LogEntry, lineNum: number, logInfo: LogInfo) {
  //get the object that matches the fcall
  const { objects } = logInfo.results;
  const { functionCalls } = objects[fcall.id!]!;

  functionCalls.forEach( (method) => {
    if(method.lineNum > lineNum) {
      // TODO: maybe properly support regex? not sure if necessary though
      if(rule.method === ".*") { 
        return lineNum;
      }
      if(method.fn === rule.method) {
        return lineNum;
      }
    }   
  });

  failCheck(check.name, lineNum);
  return -1; 
}

/**
 * Logs a failed check with the name and line number.
 * Adds it to global list of failed checks
 * 
 * @param name - The name of the failed check.
 * @param lineNum - The line number where the check failed.
 */
function failCheck(name: string, lineNum: number) {
  const formattedName = name.padEnd(40, ' '); // Adjust 20 to the maximum length you expect for 'name'
  const formattedLineNum = lineNum.toString().padStart(5, ' '); // Adjust 5 to the maximum length you expect for 'lineNum'
  
  console.error(`Check Failed: ${formattedName} Line: ${formattedLineNum}`);
  checkFails.push({name, lineNum});
}
