const redis = require('../../../cache/redis');
const { firestore } = require('../../../database/firestore');

module.exports = {
    async pull(address, options) {
        // options: { path?: string, default?: object }
        let data = await redis.get(address, options);
        if (data) return data;

        data = (await firestore.doc(address.replace(/:/g, '/')).get()).data() ?? options?.default;
        if (!data) return data;

        data.update_timestamp = Date.now();

        await redis.set(address, data, options);
        return data;
    },
    async push(address, data, options) {
        // options: { path?: string, ttl?: number, persistent?: boolean, write?: boolean }
        const timestamp = Date.now();
        if (!data.update_timestamp || timestamp - data.update_timestamp >= 900000 || options?.write) {
            data.update_timestamp = timestamp;
            await firestore.doc(address.replace(/:/g, '/')).set(data, { merge: true });
        }
        await redis.set(address, data, options);
    },
    // async pull_user(server_id, user_id, options) {
    //     // options: { path?: string }

    //     const address = `member:${server_id}:${user_id}`;

    //     let user = await redis.get(address, options);
    //     if (user) return this.tokenize(user);

    //     user = (await firestore.doc(`servers/${server_id}/members/${user_id}`).get()).data() ?? {
    //         id: user_id,
    //         credits: '15000',
    //         essence: 15000,
    //         update_timestamp: Date.now(),
    //     };

    //     await redis.set(address, user, options);
    //     return this.tokenize(user);
    // },
    // async push_user(server_id, user_id, user, options) {
    //     // options: { path?: string, ttl?: number, persistent?: boolean, write?: boolean }

    //     user = this.untokenize(user);
    //     const address = `member:${server_id}:${user_id}`;

    //     const timestamp = Date.now();
    //     if (!user.update_timestamp || timestamp - user.update_timestamp >= 900000 || options?.write) {
    //         user.update_timestamp = timestamp;
    //         await firestore.doc(`servers/${server_id}/members/${user_id}`).set(user, { merge: true });
    //     }
    //     await redis.set(address, user, options);
    // },
    // async pull_server(server_id, options) {
    //     // options: { path?: string }

    //     const address = `server:${server_id}`;

    //     let server = await redis.get(address, options);
    //     if (server) return server;

    //     server = (await firestore.doc(`servers/${server_id}`).get()).data();
    //     if (server) return server;

    //     server = {
    //         id: server_id,
    //         premium: {
    //             active: true,
    //             until_timestamp: Date.now() + WEEK_MS,
    //         },
    //         update_timestamp: Date.now(),
    //     };

    //     await firestore.doc(`servers/${server_id}`).set(server, { merge: true });
    //     await redis.set(address, server, options);
    //     return server;
    // },
    // async push_server(server_id, server, options) {
    //     // options: { path?: string, ttl?: number, persistent?: boolean }

    //     const address = `server:${server_id}`;

    //     server.update_timestamp = Date.now();
    //     await firestore.doc(`servers/${server_id}`).set(server, { merge: true });
    //     await redis.set(address, server, options);
    // },
    // async pull_service(service, server_id, options) {
    //     // options: { path?: string, default?: object }

    //     const address = `service:${service}:${server_id}`

    //     let data = await redis.get(address, options);
    //     if (data) return data;

    //     data = (await firestore.doc(`servers/${server_id}/services/counting`).get()).data() ?? options?.default;
    //     if (!data) return data;

    //     data.update_timestamp = Date.now();

    //     await redis.set(address, data, options);
    //     return data;
    // },
    // async push_service(service, server_id, data, options) {
    //     // options: { path?: string, ttl?: number, persistent?: boolean, write?: boolean }

    //     const address = `service:${service}:${server_id}`

    //     const timestamp = Date.now();
    //     if (!data.update_timestamp || timestamp - data.update_timestamp >= 900000 || options?.write) {
    //         data.update_timestamp = timestamp;
    //         await firestore.doc(`servers/${server_id}/services/counting`).set(data, { merge: true });
    //     }
    //     await redis.set(address, data, options);
    // }
}
