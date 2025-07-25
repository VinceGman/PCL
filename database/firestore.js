const fs = require('fs');
const path = require('path');

class FirestoreClient {
    static initialize(serviceAccount) {
        if (!FirestoreClient.instance) {
            const { Firestore, FieldValue } = require('@google-cloud/firestore');

            const serviceAccountPath = path.join(__dirname, 'service-account.json');
            if (!fs.existsSync(serviceAccountPath)) {
                fs.writeFileSync(serviceAccountPath, serviceAccount);
            }

            const credentials = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
            const firestore = new Firestore({
                projectId: credentials.project_id,
                keyFilename: serviceAccountPath
            });
            FirestoreClient.instance = {
                firestore: firestore,
                FieldValue: FieldValue
            };
        }
        return FirestoreClient.instance;
    }
}

// Initialize the Firestore client when the module is loaded
const { firestore, FieldValue } = FirestoreClient.initialize(process.env.GOOGLE_SERVICE_ACCOUNT);

// Export the initialized properties directly
module.exports = { firestore, FieldValue };
