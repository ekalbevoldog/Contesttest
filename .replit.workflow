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
    },
    "StartApplication": {
      "name": "Start application",
      "command": "node start-dev.js",
      "restartOn": {
        "files": [
          "server/**/*.ts",
          "shared/**/*.ts",
          "client/src/**/*.ts",
          "client/src/**/*.tsx"
        ]
      },
      "runAtStart": true
    }
  }
}