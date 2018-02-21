
# NatureNet Twilio Integration

This code integrates Twilio SMS messages with a Firebase database. It allows NatureNet users to text contributions rather than using the app. The goal of this feature is lower the barriers of entry to NatureNet by providing equitable access to people who don't have a smart phone or who choose not to download the application. 


## Installation 

To install everything you first need to add the project dependencies, and then firebase-tools. I've separated them to make the user of this code aware that firebase-tools are only necessary if you want to deploy / serve the project. Another alternative would be to modify the code to include an express/koa server. 

```
npm install 
npm install -g firebase-tools
```

## Running the code

Again, this is just a quick microservice created to connect twilio to 

firebase serve --only functions --project prod

https://firebase.google.com/docs/functions/local-emulator#install_and_configure_the_cloud_functions_shell
