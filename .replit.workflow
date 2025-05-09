{
  "runCommands": {
    "StartServer": {
      "name": "Start Server",
      "command": "npx tsx server/index.ts",
      "restartOn": {
        "files": [
          "server/**/*.ts",
          "shared/**/*.ts"
        ]
      }
    }
  }
}