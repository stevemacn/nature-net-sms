'use strict'

const elsewhere = 'zz_elsewhere';

//const firebase = require('firebase');
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const GeoFire = require('geofire');
var twilio = require('twilio');
var request = require('request')//.debug = true;
const path = require('path');
const cors = require('cors')();
var cloudinary = require('cloudinary');


// ====== Configurations ======= //

var accountSid = 'AC206648d505b662a0f7a7a90ed6e45c39'; // Your Account SID from www.twilio.com/console
var authToken = '44612bb6b05ef60f16b10e755daf86d8';   // Your Auth Token from www.twilio.com/console

var twilioBase = "https://api.twilio.com"
var twilioApi = "https://"+accountSid+":"+authToken+"@api.twilio.com"
var twilioClient = new twilio(accountSid, authToken);
var MessagingResponse = twilio.twiml.MessagingResponse;

cloudinary.config({
  cloud_name: 'university-of-colorado',
  api_key: '897345934763116',
  api_secret: '_XFUaxPfOoow8lt5IPJUNZrINHI'
});

var serviceAccount = require('./config.json')


console.log(serviceAccount);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://naturenet.firebaseio.com"
});


// ==== SMS ======= //


function deleteMediaItem(mediaItem) {
  return twilioClient
    .api.accounts(accountSid)
    .messages(mediaItem.MessageSid)
    .media(mediaItem.mediaSid).remove();
}

function SaveMedia(mediaItem) {
  //Promises should make it easier to extend to multiple uploads
  return new Promise((resolve, reject) => {
    const { mediaUrl, MessageSid } = mediaItem;
    if (!MessageSid) return reject("Twilio Error: No Message SID");
    if (!mediaUrl) return reject("Twilio Error: No Media Url");

    twilioClient.messages(MessageSid).media
      .each((media) => {
        var uri = media.uri.split('.json')[0];
        console.log(twilioBase+uri);
          var cloudUrl = twilioBase+uri
        //Upload Media to Cloudinary
        cloudinary.uploader.upload(cloudUrl, function(result) {
          console.log(result);
          if (!result) return reject('Cloudinary Error');
          if (result.error) return reject('Cloudinary Error');
          //Associate image with anonymous user in firebase
          var obs = {
            id: admin.database().ref('observations').push().key,
            observer: 'DoAfglmluGcIyKYP5ke5ipwLmkt2', //user anonymous user
            activity: '-ACES_a38',
            site: 'zz_elsewhere',
            source: 'sms',
            data: {
              image: result.secure_url //save cloudinary url
            },
            l: { 0: 35.2617568, 1: -80.7215697 },
            created_at: admin.database.ServerValue.TIMESTAMP,
            updated_at: admin.database.ServerValue.TIMESTAMP
          };

          console.log(obs);

          var newData = {};
          newData['/observations/' + obs.id] = obs;
          newData['/activities/' + obs.activity + '/latest_contribution'] = admin.database.ServerValue.TIMESTAMP;
          newData['/users/' + obs.observer + '/latest_contribution'] = admin.database.ServerValue.TIMESTAMP;

          admin.database().ref().update(newData, function (error) {
            if (error) return reject("Firebase Error: "+ error);
            resolve('Upload successful');
          })
        })
      });
  });
}

exports.sms = functions.https.onRequest((req, res) => {
  const { body } = req;
  const { NumMedia, From: SenderNumber, MessageSid } = body;
  let saveOperations = [];
  const mediaItems = [];

  console.log(NumMedia);
  console.log(body);

  res.send("success response").status(200);

  for (var i = 0; i < NumMedia; i++) {  // eslint-disable-line
    const mediaUrl = body[`MediaUrl${i}`] ? body[`MediaUrl${i}`]: body[`MediaUrl`];
    console.log("MURL: " + mediaUrl);

    const MessageSid = body.MessageSid;
    mediaItems.push({  mediaUrl, MessageSid });
    saveOperations = mediaItems.map(mediaItem => SaveMedia(mediaItem));
  }

  Promise.all(saveOperations).then((resp) => {
    //if (resp.state == "rejected") return res.send(resp.reason).status(500)

    //response.message({
    //  from: twilioPhoneNumber,
    //  to: SenderNumber,
    //}, messageBody);

  }).catch((exception) => {
    console.log('Error' + exception);
    return res.send(exception).status(500);
  })
})


// ==== End SMS ====== //
