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
    "AuthTestServer": {
      "name": "Auth Test Server",
      "command": "node start-dev.js",
      "restartOn": {
        "files": [
          "server/**/*.ts",
          "shared/**/*.ts",
          "client/src/**/*.ts",
          "client/src/**/*.tsx",
          "start-dev.js"
        ]
      },
      "runAtStart": true
    }
  }
}