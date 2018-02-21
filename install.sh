export GOOGLE_APPLICATION_CREDENTIALS="./config.json"
firebase use prod
./node_modules/firebase-tools/bin/firebase serve --only functions
