import { cac, fs } from "./deps.ts";

function getFileExtension(fname: string) {
  return fname.slice((fname.lastIndexOf(".") - 1 >>> 0) + 2);
}

function findFolderUpwards(
  startingPath: string,
  target: string,
): string | null {
  try {
    for (const contents of Deno.readDirSync(startingPath)) {
      if (contents.isDirectory && contents.name === target) {
        return `${startingPath}/${target}`;
      }
    }
  } catch (_) {
    return null;
  }

  if (startingPath === "/") {
    return null;
  }

  const upFolder = startingPath.split("/").slice(0, -1);
  return findFolderUpwards(upFolder.join("/"), target);
}

const decoder = new TextDecoder("utf-8");
const encoder = new TextEncoder();

const wardrobePath = findFolderUpwards(Deno.cwd(), ".wardrobe");

const cli = cac("wardrobe");

cli.help();

cli.command("init", "scaffold a .wardrobe folder if it does not exist")
  .action(() => {
    fs.ensureDirSync("./.wardrobe/cmd");
    Deno.writeFileSync(
      "./.wardrobe/cmd/hello.ts",
      encoder.encode(
        `import { createCommandArgument, WardrobeCommand } from "https://raw.githubusercontent.com/xdrdak/wardrobe/main/command.ts";

export const command: WardrobeCommand<[string | null], { scream: boolean }> = {
  description: "This is a description",
  commandArguments: [createCommandArgument({
    name: "name",
  })],
  options: [createOption({
    name: "--scream",
    description: "Scream the name",
  })],
  action: ({ args, options }) => {
    const [name] = args;
    const scream = options.scream;

    if (!name) {
      const ouput = "no one to say hello to";
      console.log(scream ? ouput.toUpperCase() : ouput);
    } else {
      const output = \`hello \${name}!\`;
      console.log(scream ? output.toUpperCase() : output);
    }
  },
};
    `,
      ),
    );
  });

cli.command(
  "which",
  "Print out which wardrobe command folder we're currently targeting",
)
  .action(() => {
    console.log(wardrobePath);
  });

if (wardrobePath) {
  // Only support top level commands for now.
  // Eventually, sub commands will spawn sub-cli apps
  for (const file of fs.expandGlobSync(`${wardrobePath}/cmd/*`)) {
    const fileExtention = getFileExtension(file.name);

    switch (fileExtention) {
      // special scenario, we may be dealing with a shell script here...
      case "": {
        const data = Deno.readFileSync(file.path);
        const filecontents = decoder.decode(data);
        if (filecontents.startsWith("#!/")) {
          cli.command(file.name, "shell script", {
            allowUnknownOptions: true,
          }).action(() => {
            const rawArgs = cli.rawArgs.slice(2);
            Deno.run({
              cmd: [file.path, ...rawArgs],
              stdout: "inherit",
              stderr: "inherit",
              stdin: "inherit",
            });
          });
        }
        break;
      }
      case "ts":
      case "js": {
        const mod = await import(file.path);

        // Doing a bit of a hail mary here...
        if (mod && mod.command && typeof mod.command === "object") {
          const commandName = file.name.replace(".ts", "");
          const description = mod.command.description || "no description";
          const commandArguments = mod.command.commandArguments || [];
          const options = mod.command.options || [];

          const action = (...actionArgs: unknown[]) => {
            let options: unknown = {};
            let args: unknown[] = [];

            options = actionArgs.slice(-1).pop();
            args = actionArgs.slice(0, -1);

            return mod.command.action({
              args,
              options,
              cwd: Deno.cwd(),
              wardrobeCommandDirectory: `${wardrobePath}/cmd`,
            });
          };

          const commandString = [commandName, commandArguments.join(" ")]
            .join(
              " ",
            );
          const subCommand = cli.command(commandString, description);
          for (const [name, description] of options) {
            subCommand.option(name, description);
          }
          subCommand.action(action);
        }
        break;
      }
      default:
        break;
    }
  }
}

cli.command("")
  .action(() => {
    cli.outputHelp();
  });

cli.on("command:*", () => {
  console.error("Invalid command: %s", cli.args.join(" "));
});

try {
  cli.parse();
} catch (e) {
  console.error(e.message);
}
