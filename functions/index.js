const functions = require("firebase-functions/v2/database");
const admin = require("firebase-admin");
const {logger} = require("firebase-functions");

admin.initializeApp();
const db = admin.database();
const messaging = admin.messaging();
// const firestore = admin.firestore();

// Cloud Function untuk memonitor suhu dan mengirim notifikasi
exports.monitorTemperature = functions.onValueWritten(
    {
      ref: "/sensor/temperature",
      region: "asia-southeast1",
    },
    async (event) => {
      const newSoilMoisture = event.data.after.val();

      // Cek jika suhu mencapai 40 atau lebih
      if (newSoilMoisture >= 40) {
        logger.log(
            `Suhu mencapai ${newSoilMoisture} derajat Celsius.` +
          " Mengirim notifikasi...",
        );

        // Detil notifikasi
        const notification = {
          title: `Suhu mencapai ${newSoilMoisture}°C`,
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

            // const logData = {
            //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
            //   alerts: "High Temperature",
            //   title: notification.title,
            //   body: notification.body,
            // };

            // await firestore.collection("notifications").add(logData);
            // logger.log("Log notifikasi berhasil disimpan ke Firestore.");
          } catch (error) {
            logger.error("Error mengirim notifikasi:", error);
          }
        } else {
          logger.log("Tidak ada token yg ditemukan untuk mengirim notifikasi.");
        }
      } else {
        logger.log(
            `Suhu ${newSoilMoisture} derajat Celsius,` +
          "tidak ada notifikasi yang dikirim.",
        );
      }
    },
);

exports.monitorSoilMoisture = functions.onValueWritten(
    {
      ref: "/sensor/soilMoisture",
      region: "asia-southeast1",
    },
    async (event) => {
      const newSoilMoisture = event.data.after.val();

      // Cek jika suhu mencapai 40 atau lebih
      if (newSoilMoisture <= 20) {
        logger.log(
            `🌱 Tingkat Kelembaban Tanah mencapai ${newSoilMoisture} persen.` +
          " Mengirim notifikasi...",
        );

        // Detil notifikasi
        const notification = {
          title: `Tingkat Kelembaban Tanah mencapai ${newSoilMoisture}%`,
          body:
          "Kelembaban tanah di bawah 20%." +
          "Yuk, bantu tanaman tetap sehat dengan menyiramnya sekarang!",
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
            logger.log(`Notifikasi Moisture berhasil dikirim:`, response);

            // const logData = {
            //   timestamp: admin.firestore.FieldValue.serverTimestamp(),
            //   alerts: "High Temperature",
            //   title: notification.title,
            //   body: notification.body,
            // };

            // await firestore.collection("notifications").add(logData);
            // logger.log("Log notifikasi berhasil disimpan ke Firestore.");
          } catch (error) {
            logger.error("Error mengirim notifikasi:", error);
          }
        } else {
          logger.log("Tidak ada token yg ditemukan untuk mengirim notifikasi.");
        }
      } else {
        logger.log(
            `Suhu ${newSoilMoisture} derajat Celsius,` +
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
