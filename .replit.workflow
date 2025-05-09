[nix]
channel = "stable-22_11"

[unitTest]
language = "nodejs"

[deployment]
deploymentTarget = "cloudrun"
run = ["bash", "start.sh"]

[[ports]]
localPort = 3002
externalPort = 80

[[ports]]
localPort = 8080
externalPort = 80