type CommandAction = (
  commandOptions: unknown[],
  meta: { cwd: string; wardrobeCommandDirectory: string },
) => void;

export class Command {
  private _description: string;
  private _action: CommandAction;
  private _options: [string, string][] = [];
  private _commandArguments: string[] = [];

  constructor() {
    this._description = "";
    this._action = () => {};
  }

  addOption(name: string, description: string) {
    this._options.push([`--${name.replaceAll("-", "")}`, description]);
    return this;
  }

  addOptionWithArgument(
    opt: {
      name: string;
      argumentName: string;
      isRequired: boolean;
      description: string;
    },
  ): Command {
    const optionArgument = opt.isRequired
      ? `<${opt.argumentName}>`
      : `[${opt.argumentName}]`;

    this._options.push([
      `--${opt.name.replaceAll("-", "")} ${optionArgument}`,
      opt.description,
    ]);

    return this;
  }

  setAction(fn: CommandAction) {
    this._action = fn;
    return this;
  }

  setDescription(s: string) {
    this._description = s;
    return this;
  }

  addCommandArgument(
    opt: { name: string; isRequired: boolean; isVariadic: boolean },
  ) {
    let argument = opt.name;

    if (opt.isVariadic) {
      argument = `...${argument}`;
    }

    if (opt.isRequired) {
      argument = `<${argument}>`;
    } else {
      argument = `[${argument}]`;
    }

    this._commandArguments.push(argument);
    return this;
  }

  readCommand() {
    return {
      description: this._description,
      action: this._action,
      options: this._options,
      commandArguments: this._commandArguments,
    };
  }
}
