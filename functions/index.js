const functions = require("firebase-functions/v2/database");
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

admin.initializeApp();
const db = admin.database();
const messaging = admin.messaging();

// Cloud Function untuk memonitor suhu dan mengirim notifikasi
exports.monitorTemperature = functions.onValueWritten(
    {
      ref: "/sensor/temperature",
      region: "asia-southeast1",
    },
    async (event) => {
      const newTemperature = event.data.after.val();

      // Cek jika suhu mencapai 40 atau lebih
      if (newTemperature >= 40) {
        logger.log(
            `Suhu mencapai ${newTemperature} derajat Celsius.` +
          " Mengirim notifikasi...",
        );

        // Detil notifikasi
        const notification = {
          title: "Suhu mencapai 40",
          body:
          "Segera pantau & pindahkan perangkat ke " + "tempat yang lebih sejuk",
        };

        // Ambil semua token FCM dari database
        const tokensSnapshot = await db.ref("/fcmTokens").once("value");
        const tokens = [];

        tokensSnapshot.forEach((childSnapshot) => {
          const token = childSnapshot.val().token;
          if (token) {
            tokens.push(token);
          }
        });

        // Mengirim notifikasi ke semua token
        if (tokens.length > 0) {
          const message = {
            notification: notification,
            tokens: tokens,
            android: {
              priority: "high",
            },
          };

          try {
            const response = await messaging.sendEachForMulticast(message);
            logger.log(`Notifikasi berhasil dikirim:`, response);
          } catch (error) {
            logger.error("Error mengirim notifikasi:", error);
          }
        } else {
          logger.log("Tidak ada token yg ditemukan untuk mengirim notifikasi.");
        }
      } else {
        logger.log(
            `Suhu ${newTemperature} derajat Celsius,` +
          "tidak ada notifikasi yang dikirim.",
        );
      }
    },
);

// Cloud Function untuk mengumpulkan token FCM
// exports.saveFcmToken = functions.auth.user().onCreate(async (user) => {
//   const token = await admin.messaging().getToken();
//   const tokenRef = db.ref(`/fcmTokens/${user.uid}`);

//   // Menyimpan token ke Firebase Realtime Database
//   await tokenRef.set({
//     token: token,
//     timestamp: admin.database.ServerValue.TIMESTAMP,
//   });

//   logger.log("FCM Token has been saved to Realtime Database");
// });
