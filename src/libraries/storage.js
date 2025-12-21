const redis = require('../../cache/redis');
const { firestore } = require('../../database/firestore');

module.exports = {
    async pull(address, options) {
        // options: { path?: string, default?: object }
        let data = await redis.get(address, options);
        if (data) return data;

        data = (await firestore.doc(address.replace(/:/g, '/')).get()).data() ?? options?.default;
        if (!data) return data;

        await redis.set(address, data, options);
        return data;
    },
    async push(address, data, options) { // always writes to both cache and database
        // options: { path?: string, ttl?: number }
        await firestore.doc(address.replace(/:/g, '/')).set(data, { merge: true });
        await redis.set(address, data, options);
    }
}
