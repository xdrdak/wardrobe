import { cac, fs } from "./deps.ts";

import { Command } from "./command.ts";

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
        `import { Command } from "https://raw.githubusercontent.com/xdrdak/wardrobe/main/command.ts";

export const command = new Command()
  .addCommandArgument({
    name: "name",
    isRequired: false,
    isVariadic: false,
  })
  .setDescription("(example) say hello to something")
  .setAction(([name]) => {
    console.log("hello", name);
  }); 
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
        if (mod && mod.command && typeof mod.command.readCommand === 'function') {
          const command = mod.command as Command;

          const {
            action,
            commandArguments,
            description,
            options,
          } = command.readCommand();

          const commandName = file.name.replace(".ts", "");
          const commandString = [commandName, commandArguments.join(" ")]
            .join(
              " ",
            );
          const subCommand = cli.command(commandString, description);
          for (const [name, description] of options) {
            subCommand.option(name, description);
          }
          subCommand.action((...actionArgs) =>
            action(actionArgs, {
              cwd: Deno.cwd(),
              wardrobeCommandDirectory: `${wardrobePath}/cmd`,
            })
          );
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
