import {
  Breakpoint,
  InitializedEvent,
  LoggingDebugSession,
  Scope,
  Source,
  StackFrame,
  TerminatedEvent,
  Thread
} from '@vscode/debugadapter';
import { DebugProtocol } from '@vscode/debugprotocol';
import {
  AnotherAnsiProvider,
  ColorType,
  EscapeSequence,
  ModifierType
} from 'another-ansi';
import {
  ContextType,
  CustomValue,
  HandlerContainer,
  Instruction,
  Interpreter,
  OperationContext,
  PrepareError,
  RuntimeError
} from 'greybel-interpreter';
import { init as initMSIntrinsics } from 'greybel-ms-intrinsics';
import vscode, { Uri } from 'vscode';

import { showCustomErrorMessage } from '../helper/show-custom-error';
import { InterpreterResourceProvider } from '../resource';
import { GrebyelDebugger, GrebyelPseudoDebugger } from './debugger';
import { VSOutputHandler } from './output';
import { DebugSessionLike } from './types';
import { parseEnvVars } from '../helper/parse-env-vars';
import { PseudoFS } from '../helper/fs';

const ansiProvider = new AnotherAnsiProvider(EscapeSequence.Hex);

interface ILaunchRequestArguments extends DebugProtocol.LaunchRequestArguments {
  program: string;
  noDebug?: boolean;
}

interface IRuntimeStackFrame {
  index: number;
  name: string;
  file: string;
  line: number;
  column?: number;
}

interface IRuntimeStack {
  count: number;
  frames: IRuntimeStackFrame[];
}

export class GreybelDebugSession
  extends LoggingDebugSession
  implements DebugSessionLike {
  public threadID: number;
  public lastInstruction: Instruction | undefined;
  public breakpoints: Map<string, DebugProtocol.Breakpoint[]> = new Map();

  private _runtime: Interpreter;
  private _breakpointIncrement: number = 0;
  private _restart: boolean = false;
  private _out: VSOutputHandler;

  private _silenceErrorPopups: boolean = false;

  public constructor() {
    super('miniscript-debug.txt');

    // this debugger uses zero-based lines and columns
    const me = this;
    const config = vscode.workspace.getConfiguration('miniscript');
    const environmentVariables =
      config.get<object>('interpreter.environmentVariables') || {};

    me.setDebuggerLinesStartAt1(false);
    me.setDebuggerColumnsStartAt1(false);

    this.threadID = Math.random() * 0x7fffffff;
    this._silenceErrorPopups = config.get<boolean>(
      'interpreter.silenceErrorPopups'
    );
    this._out = new VSOutputHandler();
    this._runtime = new Interpreter({
      handler: new HandlerContainer({
        resourceHandler: new InterpreterResourceProvider(),
        outputHandler: this._out
      }),
      debugger: new GrebyelDebugger(me),
      api: initMSIntrinsics(),
      environmentVariables: parseEnvVars(environmentVariables)
    });
  }

  /**
   * The 'initialize' request is the first request called by the frontend
   * to interrogate the features the debug adapter provides.
   */
  protected initializeRequest(
    response: DebugProtocol.InitializeResponse,
    _args: DebugProtocol.InitializeRequestArguments
  ): void {
    // build and return the capabilities of this debug adapter:
    response.body = response.body || {};

    // the adapter implements the configurationDone request.
    response.body.supportsConfigurationDoneRequest = false;

    // make VS Code use 'evaluate' when hovering over source
    response.body.supportsEvaluateForHovers = false;

    // make VS Code show a 'step back' button
    response.body.supportsStepBack = false;

    // make VS Code support data breakpoints
    response.body.supportsDataBreakpoints = false;

    // make VS Code support completion in REPL
    response.body.supportsCompletionsRequest = false;
    response.body.completionTriggerCharacters = ['.', '['];

    // make VS Code send cancel request
    response.body.supportsCancelRequest = false;

    // make VS Code send the breakpointLocations request
    response.body.supportsBreakpointLocationsRequest = true;

    // make VS Code provide "Step in Target" functionality
    response.body.supportsStepInTargetsRequest = false;

    // the adapter defines two exceptions filters, one with support for conditions.
    response.body.supportsExceptionFilterOptions = false;
    response.body.exceptionBreakpointFilters = [];

    // make VS Code send exceptionInfo request
    response.body.supportsExceptionInfoRequest = false;

    // make VS Code send setVariable request
    response.body.supportsSetVariable = false;

    // make VS Code send setExpression request
    response.body.supportsSetExpression = false;

    // make VS Code send disassemble request
    response.body.supportsDisassembleRequest = false;
    response.body.supportsSteppingGranularity = false;
    response.body.supportsInstructionBreakpoints = false;

    // make VS Code able to read and write variable memory
    response.body.supportsReadMemoryRequest = false;
    response.body.supportsWriteMemoryRequest = false;

    response.body.supportsRestartRequest = true;

    this.sendResponse(response);

    // since this debug adapter can accept configuration requests like 'setBreakpoint' at any time,
    // we request them early by sending an 'initializeRequest' to the frontend.
    // The frontend will end the configuration sequence by calling 'configurationDone' request.
    this.sendEvent(new InitializedEvent());
  }

  protected async launchRequest(
    response: DebugProtocol.LaunchResponse,
    args: ILaunchRequestArguments
  ): Promise<void> {
    const me = this;
    const uri = Uri.parse(args.program);

    me._runtime.debugMode = !args.noDebug;
    me._runtime.setTarget(uri.toString());
    me._runtime.setDebugger(
      args.noDebug ? new GrebyelPseudoDebugger() : new GrebyelDebugger(me)
    );

    me._restart = false;

    // start the program in the runtime
    try {
      await me._runtime.run();
      me.sendResponse(response);
    } catch (err: any) {
      if (err instanceof PrepareError) {
        this._out.terminal.print(
          ansiProvider.color(
            ColorType.Red,
            `${ansiProvider.modify(ModifierType.Bold, 'Prepare error')}: ${err.message
            } at ${err.target}:${err.range?.start || 0}`
          )
        );
      } else if (err instanceof RuntimeError) {
        this._out.terminal.print(
          ansiProvider.color(
            ColorType.Red,
            `${ansiProvider.modify(ModifierType.Bold, 'Runtime error')}: ${err.message
            } in ${err.target}\n${err.stack}`
          )
        );
      } else {
        this._out.terminal.print(
          ansiProvider.color(
            ColorType.Red,
            `${ansiProvider.modify(ModifierType.Bold, 'Unexpected error')}: ${err.message
            }\n${err.stack}`
          )
        );
      }

      if (!this._silenceErrorPopups) {
        showCustomErrorMessage(err);
      }
    }

    if (me._restart) {
      return me.launchRequest(response, args);
    }

    me.sendEvent(new TerminatedEvent());
  }

  protected threadsRequest(response: DebugProtocol.ThreadsResponse): void {
    // runtime supports no threads so just return a default thread.
    response.body = {
      threads: [new Thread(this.threadID, 'thread 1')]
    };
    this.sendResponse(response);
  }

  protected scopesRequest(
    response: DebugProtocol.ScopesResponse,
    _args: DebugProtocol.ScopesArguments
  ): void {
    response.body = {
      scopes: [new Scope('Current scope', 1, true)]
    };
    this.sendResponse(response);
  }

  protected async variablesRequest(
    response: DebugProtocol.VariablesResponse,
    _args: DebugProtocol.VariablesArguments,
    _request?: DebugProtocol.Request
  ): Promise<void> {
    const me = this;
    const frame = me._runtime.vm.getFrame();
    const variables: DebugProtocol.Variable[] = [];
    const setVariables = (current: OperationContext, ref: number) => {
      current.scope.value.forEach((item: CustomValue, name: CustomValue) => {
        const v: DebugProtocol.Variable = {
          name: name.toString(),
          value: item.toString(),
          type: item.getCustomType(),
          variablesReference: ref,
          evaluateName: '$' + name
        };

        variables.push(v);
      });
    };

    if (frame && frame.type !== ContextType.Global) {
      setVariables(frame, 0);
    }

    setVariables(me._runtime.globalContext, 0);

    response.body = {
      variables
    };
    this.sendResponse(response);
  }

  protected continueRequest(
    response: DebugProtocol.ContinueResponse,
    _args: DebugProtocol.ContinueArguments
  ): void {
    this._runtime.debugger.setBreakpoint(false);
    this.sendResponse(response);
  }

  protected nextRequest(
    response: DebugProtocol.NextResponse,
    _args: DebugProtocol.NextArguments
  ): void {
    this._runtime.debugger.next();
    this.sendResponse(response);
  }

  protected async disconnectRequest(
    response: DebugProtocol.DisconnectResponse,
    _args: DebugProtocol.DisconnectArguments,
    _request?: DebugProtocol.Request
  ): Promise<void> {
    this._runtime.debugger.setBreakpoint(false);

    try {
      await this._runtime.exit();
    } catch (err: any) {
      console.warn(`WARNING: ${err.message}`);
    }

    this.sendResponse(response);
    this.shutdown();
  }

  protected pauseRequest(
    response: DebugProtocol.PauseResponse,
    _args: DebugProtocol.PauseArguments,
    _request?: DebugProtocol.Request
  ): void {
    this._runtime.debugger.setBreakpoint(true);
    this.sendResponse(response);
  }

  protected async restartRequest(
    response: DebugProtocol.RestartResponse,
    _args: DebugProtocol.RestartArguments,
    _request?: DebugProtocol.Request
  ): Promise<void> {
    this._runtime.debugger.setBreakpoint(false);

    try {
      this._restart = true;
      await this._runtime.exit();
    } catch (err: any) {
      console.warn(`WARNING: ${err.message}`);
    }

    this.sendResponse(response);
  }

  protected async terminateRequest(
    response: DebugProtocol.TerminateResponse,
    _args: DebugProtocol.TerminateArguments,
    _request?: DebugProtocol.Request
  ): Promise<void> {
    this._runtime.debugger.setBreakpoint(false);

    try {
      await this._runtime.exit();
    } catch (err: any) {
      console.warn(`WARNING: ${err.message}`);
    }

    this.sendResponse(response);
  }

  protected async evaluateRequest(
    response: DebugProtocol.EvaluateResponse,
    args: DebugProtocol.EvaluateArguments
  ): Promise<void> {
    try {
      this._runtime.debugger.setBreakpoint(false);
      await this._runtime.injectInLastContext(args.expression);

      response.body = {
        result: `Execution of ${args.expression} was successful.`,
        variablesReference: 0
      };
    } catch (err: any) {
      response.body = {
        result: err.toString(),
        variablesReference: 0
      };
    } finally {
      this._runtime.debugger.setBreakpoint(true);
    }

    this.sendResponse(response);
  }

  public getStack(): IRuntimeStack {
    const me = this;
    const frames: IRuntimeStackFrame[] = [];
    const instructions = me._runtime.vm.getStacktrace();

    for (let index = instructions.length - 1; index >= 0; index--) {
      const current = instructions[index];

      const stackFrame: IRuntimeStackFrame = {
        index,
        name: current.source.name, // use a word of the line as the stackframe name
        file: current.source.path,
        line: current.source.start.line,
        column: current.source.start.character
      };

      frames.unshift(stackFrame);
    }

    return {
      frames,
      count: frames.length
    };
  }

  protected stackTraceRequest(
    response: DebugProtocol.StackTraceResponse,
    _args: DebugProtocol.StackTraceArguments
  ): void {
    const me = this;
    const stk = me.getStack();

    response.body = {
      stackFrames: stk.frames.map((f, _ix) => {
        const sf: DebugProtocol.StackFrame = new StackFrame(
          f.index,
          f.name,
          new Source(PseudoFS.basename(f.file), f.file),
          f.line,
          f.column
        );

        return sf;
      }),
      // 4 options for 'totalFrames':
      // omit totalFrames property: 	// VS Code has to probe/guess. Should result in a max. of two requests
      totalFrames: stk.count // stk.count is the correct size, should result in a max. of two requests
      // totalFrames: 1000000 			// not the correct size, should result in a max. of two requests
      // totalFrames: endFrame + 20 	// dynamically increases the size with every requested chunk, results in paging
    };
    this.sendResponse(response);
  }

  protected async setBreakPointsRequest(
    response: DebugProtocol.SetBreakpointsResponse,
    args: DebugProtocol.SetBreakpointsArguments
  ): Promise<void> {
    const me = this;
    const uri = Uri.file(args.source.path);
    const clientLines = args.lines || [];

    const actualBreakpoints0 = clientLines.map((line: number) => {
      const bp = new Breakpoint(
        false,
        line,
        0,
        new Source(uri.toString(), uri.toString())
      ) as DebugProtocol.Breakpoint;
      bp.id = me._breakpointIncrement++;
      return bp;
    });
    const actualBreakpoints = await Promise.all<DebugProtocol.Breakpoint>(
      actualBreakpoints0
    );

    me.breakpoints.set(uri.toString(), actualBreakpoints);

    response.body = {
      breakpoints: actualBreakpoints
    };

    this.sendResponse(response);
  }

  protected breakpointLocationsRequest(
    response: DebugProtocol.BreakpointLocationsResponse,
    args: DebugProtocol.BreakpointLocationsArguments,
    _request?: DebugProtocol.Request
  ): void {
    if (args.source.path) {
      const uri = Uri.file(args.source.path);
      const breakpoints = this.breakpoints.get(uri.toString()) || [];
      const actualBreakpoint = breakpoints.find(
        (bp: DebugProtocol.Breakpoint) => {
          return bp.line === args.line;
        }
      ) as DebugProtocol.Breakpoint;

      if (actualBreakpoint) {
        response.body = {
          breakpoints: [
            {
              line: args.line
            }
          ]
        };

        this.sendResponse(response);
        return;
      }
    }

    response.body = {
      breakpoints: []
    };

    this.sendResponse(response);
  }

  protected stepInRequest(
    _response: DebugProtocol.StepInResponse,
    _args: DebugProtocol.StepInArguments,
    _request?: DebugProtocol.Request | undefined
  ): void {
    vscode.window.showErrorMessage('Step in is not supported.');
  }

  protected stepOutRequest(
    _response: DebugProtocol.StepOutResponse,
    _args: DebugProtocol.StepOutArguments,
    _request?: DebugProtocol.Request | undefined
  ): void {
    vscode.window.showErrorMessage('Step out is not supported.');
  }

  protected stepBackRequest(
    _response: DebugProtocol.StepBackResponse,
    _args: DebugProtocol.StepBackArguments,
    _request?: DebugProtocol.Request | undefined
  ): void {
    vscode.window.showErrorMessage('Step back is not supported.');
  }
}
