const Redis = require('ioredis');

// Extends Redis for custom functionality
class RedisClient extends Redis {
    constructor(options) {
        super(options);

        this.on('connect', async () => {
            const info = await this.info("memory");
            const line = info.split("\n").find((l) => l.startsWith("used_memory:"));
            const usedBytes = parseInt(line.split(":")[1], 10);
            const usedMB = Math.ceil(usedBytes / 1024 / 1024);
            console.log(`Usage: ~${usedMB}MB/250MB`);
        });

        this.on('error', (err) => {
            console.error('Redis: Failed =>', err);
        });
    }

    // options
    // exclude: boolean // returns only non-matches
    // sort: boolean    // sorts
    async keys(prefixes = [], options = {}) {
        prefixes = typeof prefixes === 'string' ? [prefixes] : prefixes;
        let keys = [];

        if (prefixes.length == 0 || options.exclude) {
            keys.push(...await this.scan());
        }
        else {
            for (const prefix of prefixes) {
                keys.push(...await this.scan(`*${prefix}*`))
            }
        }

        if (options.exclude) {
            keys = keys.filter(key => !prefixes.some(prefix => key.includes(prefix)));
        }

        if (options.sort) {
            keys.sort((a, b) => {
                const splitA = a.split(':');
                const splitB = b.split(':');
                const typeA = splitA[0];
                const typeB = splitB[0];
                const numberA = parseInt(splitA[1], 10);
                const numberB = parseInt(splitB[1], 10);
                return typeA === typeB ? numberA - numberB : typeA.localeCompare(typeB);
            });
        }

        return keys;
    }

    async scan(pattern = '*') {
        let keys = [];
        let cursor = '0';
        do {
            const reply = await super.scan(cursor, 'MATCH', pattern, 'COUNT', 1000);
            cursor = reply[0];
            keys.push(...reply[1]);
        } while (cursor !== '0');
        return keys;
    }

    async exists(key) {
        try {
            const exists = await super.exists(key);
            return exists === 1;
        } catch (err) {
            console.error(`Redis Error => { Method: exists, Key: ${key}, ${err.toString()} }`);
        }
    }

    // options: { path?: string }
    async set(key, data, options = {}) {
        const { path = '$', ttl = 86400 } = options;
        try {
            const result = await this.call('JSON.SET', key, path, JSON.stringify(data));
            // await super.expire(key, ttl);
            return result === 'OK';
        } catch (err) {
            console.error(`Redis Error => { Method: set, Key: ${key}, ${err.toString()} }`);
        }
    }

    async get(key, options = {}) {
        const { path = '$' } = options;
        try {
            const result = await this.call('JSON.GET', key, path);
            return result ? JSON.parse(result)[0] : null;
        } catch (err) {
            console.error(`Redis Error => { Method: get, Key: ${key}, ${err.toString()} }`);
        }
    }

    async del(key) {
        try {
            const result = await super.del(key);
            return result === 1;
        } catch (err) {
            console.error(`Redis Error => { Method: del, Key: ${key}, ${err.toString()} }`);
        }
    }
}

const redisClient = new RedisClient(process.env.REDIS_URL);

module.exports = redisClient;
