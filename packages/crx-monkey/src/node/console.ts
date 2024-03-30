import pkg from '../../package.json';

export class ConsoleApp {
  private readonly handlers: Handler[] = [];

  public constructor() {
    this.addCommand('help', this.getHelp(), [], 'help');
  }

  public addCommand(
    commandName: string,
    handler: HandlerFunc,
    argv: Arg[] = [],
    description: string = `${commandName} command`,
  ): void {
    this.handlers.push({
      key: commandName,
      handler,
      argv,
      description,
    });
  }

  public run(): void {
    const argv = this.getArgv();
    let commandName: string = 'none';

    Object.keys(argv).forEach((v, index) => {
      if (index === 0) {
        commandName = v;
      }
    });

    if (commandName === 'none') {
      this.getHelp()();
    } else {
      const handlers = this.handlers.filter((handlerData) => {
        return handlerData.key === commandName;
      });

      let isError = false;

      if (handlers.length === 0) {
        console.error(`Error: Command '${commandName}' not found`);
        isError = true;
      }

      const isArgvError = (handler: Handler): boolean => {
        let argvError = false;

        Object.keys(argv).forEach((key, index) => {
          if (!handler.argv.map((arg) => arg.name).includes(key) && index !== 0) {
            console.log(`Error: Unknown compiler option '${key}'`);
            argvError = true;
          }
        });

        return argvError;
      };

      handlers.forEach((handler) => {
        if (handler.argv.length !== 0 || Object.keys(argv).length !== 1) {
          isError = isArgvError(handler);
        }

        if (!isError) {
          handler.handler(argv);
        }
      });
    }
  }

  private getArgv(): Argv {
    const argv = process.argv;
    const result: Argv = {};

    argv.forEach((arg, index) => {
      if (index > 1) {
        const [argName, argValue] = arg.split('=');

        if (argValue === undefined) {
          result[argName] = true;
        } else {
          result[argName] = argValue;
        }
      }
    });

    return result;
  }

  private getHelp(): () => void {
    return () => {
      const space = '  ';

      console.log(`\u001b[36mCRX MONKEY\x1b[32m v${pkg.version} \u001b[0m\n`);
      console.log('Commands:');

      this.handlers.forEach((handler) => {
        console.log(`${space}\x1b[32m- ${handler.key}\u001b[0m`);
        // console.log(`${space}${space}\u001b[0m${handler.description}`);
        handler.argv.forEach(({ name, description }) => {
          console.log(`${space}${space}${space}${name}: ${description}`);
        });
      });

      console.log('');
    };
  }
}

export type Argv = Record<string, string | boolean>;
export interface Arg {
  name: string;
  description: string;
}
export interface Handler {
  key: string;
  handler: HandlerFunc;
  argv: Arg[];
  description: string;
}
export type HandlerFunc = (argv: Argv) => void;
