export type CommandAction<Arguments, Options> = (
  meta: {
    args: Arguments;
    options: Options;
    cwd: string;
    wardrobeCommandDirectory: string;
  },
) => void;

type OptionName = `--${string}`;
type OptionDescription = string;
type Option = [OptionName, OptionDescription];

type ArgumentOptional = `[${string}]`;
type ArgumentRequired = `<${string}>`;
type ArgumentOptionalVariadic = `[...${string}]`;
type ArgumentRequiredVariadic = `<...${string}>`;

type Argument =
  | ArgumentOptional
  | ArgumentRequired
  | ArgumentOptionalVariadic
  | ArgumentRequiredVariadic;

function argumentOptional(s: string): ArgumentOptional {
  return `[${s}]`;
}

function argumentOptionalVariadic(s: string): ArgumentOptionalVariadic {
  return `[...${s}]`;
}

function argumentRequired(s: string): ArgumentRequired {
  return `<${s}>`;
}

function argumentRequiredVariadic(s: string): ArgumentRequiredVariadic {
  return `<...${s}>`;
}

export type WardrobeCommand<
  Arguments = unknown[],
  Options = Record<string, unknown>,
> = {
  description: string;
  action: CommandAction<Arguments, Options>;
  options?: Option[];
  commandArguments?: Argument[];
};

export function createOption(opt: {
  name: OptionName;
  description: string;
  argument?: {
    name: string;
    isRequired: boolean;
  };
}): Option {
  if (opt.argument) {
    const optionArgument = opt.argument.isRequired
      ? `<${opt.argument.name}>`
      : `[${opt.argument.name}]`;

    return [`${opt.name} ${optionArgument}`, opt.description];
  }

  return [opt.name, opt.description];
}

export function createCommandArgument(
  opt: { name: string; isRequired?: boolean; isVariadic?: boolean },
): Argument {
  if (opt.isRequired && opt.isVariadic) {
    return argumentRequiredVariadic(opt.name);
  }

  if (opt.isRequired && !opt.isVariadic) {
    return argumentRequired(opt.name);
  }

  if (!opt.isRequired && opt.isVariadic) {
    return argumentOptionalVariadic(opt.name);
  }

  return argumentOptional(opt.name);
}
