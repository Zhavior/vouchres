const command = process.argv[2] ?? "scan";

switch (command) {
  case "scan":
    await import("./commands/scan");
    break;

  case "ask":
    await import("./commands/ask");
    break;

  case "feature":
    await import("./commands/feature");
    break;

  case "doctor":
    console.log("🚧 Doctor coming...");
    break;

  case "graph":
    console.log("🚧 Graph coming...");
    break;

  case "impact":
    console.log("🚧 Impact coming...");
    break;

  case "validate":
    await import("./validate");
    break;

  case "stats":
    console.log("🚧 Stats coming...");
    break;

  default:
    console.error(`Unknown command: ${command}`);
    process.exit(1);
}
