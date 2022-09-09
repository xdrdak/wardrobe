# wardrobe

👚 Organize your scripts!

## What is this?

Wardrobe is a cli app to "automatically" create contextually bound cli apps. It
allows you to dump deno runtime compatible scripts as well as shell scripts in a
singular directory and have a nice little cli prompt, complete with command
listing and help outputs.

## Requirements

- Deno
- *Nix based system
- A Complete disreguard for filesystem intrincacies and security

## Installing

```sh
# And here comes the complete disregard to security
deno install --allow-all --name=wardrobe wardrobe.ts
```

## How to create a wardrobe

You can quickly initialize a `.wardrobe` folder structure via the
`wardrobe init` command.

## .wardrobe structure

The structure of `.wardrobe` is pretty straight forward.

All commands go into the `.wardrobe/cmd` folders... and that's it! The CLI tool
will take care of parsing the command files and adding them to the prompt. The
name of the commands will match the name of the file, minus the extension.

Please note that for the time being, nesting commands inside subfolders inside
the `.wardrobe/cmd` will not work. `wardrobe` only supports a flat listing of
commands.

## Creating a command (in TS or JS)

You must create a new command inside the `.wardrobe/cmd` folder.

The name of the command will be set to the name of the command file you've just
created.

A `wardrobe` compatible command must export a `command` variable that is
instanciated to a `Command` class;

```ts
// `.wardrobe/cmd/say-hello.ts`
import { Command } from "https://.../command.ts";

export const command = new Command()
  .addCommandArgument({
    name: "name",
    isRequired: false,
    isVariadic: false,
  })
  .setDescription("This is a description")
  .setAction(([name]) => {
    console.log(name);
  });
```
