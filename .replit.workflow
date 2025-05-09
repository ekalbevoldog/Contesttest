[nix]
channel = "stable-22_11"

[unitTest]
language = "nodejs"

[deployment]
deploymentTarget = "cloudrun"
run = ["bash", "start.sh"]

[[ports]]
localPort = 5000
externalPort = 80

[[ports]]
localPort = 8080
externalPort = 80

[runners."Start application"]
command = ["npm", "run", "dev"]
isDefault = true
runOnStart = true
persistent = true