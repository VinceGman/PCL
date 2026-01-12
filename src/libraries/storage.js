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
    async cachePull(address, options) {
        let data = await redis.get(address, options);
        return data;
    },
    async push(address, data, options) { // always writes to both cache and database
        // options: { path?: string, ttl?: number }
        await firestore.doc(address.replace(/:/g, '/')).set(data, { merge: true });
        await redis.set(address, data, options);
    },
    async logPull() {
        let log = await redis.get('services:rankTracker:log');
        if (log) return log;

        log = {
            data: [
                {
                    timestamp: Math.floor(Date.now() / 1000),
                    text: "Log: Cleared"
                },
            ],
        };

        await redis.set('services:rankTracker:log', log);
        return log;
    },
    async logPush(newLog) {
        let log = await this.logPull();

        log.data.unshift({
            timestamp: Math.floor(Date.now() / 1000),
            text: newLog
        });

        log.data = log.data.slice(-300);

        await redis.set('services:rankTracker:log', log);
    }
}
