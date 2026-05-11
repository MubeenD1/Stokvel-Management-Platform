const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const NodeCache = require('node-cache');
const prisma = new PrismaClient();

const cache = new NodeCache({ stdTTL: 86400 });
const CACHE_KEY = 'sarb_rates';
const PRIME_SPREAD = 3.5;

async function fetchLatestSarbRates() {
    const cachedRates = cache.get(CACHE_KEY);

    if (cachedRates) {
        return cachedRates;
    }

    let repoRate = null;
    let source = 'Trading Economics';

    try {
        const response = await axios.get(
            'https://api.tradingeconomics.com/financial/markets/south%20africa/interest%20rate?c=guest:guest',
            { timeout: 5000 }
        );

        if (response.data && response.data.length > 0) {
            repoRate = parseFloat(response.data[0].last);
        }

    } catch (fetchError) {
        console.warn('Could not fetch from Trading Economics, using database fallback');
    }

    if (!repoRate) {
        const lastKnownRate = await prisma.sarbRate.findFirst({
            orderBy: { fetchedAt: 'desc' },
        });

        if (lastKnownRate) {
            const rates = {
                repoRate: lastKnownRate.repoRate,
                primeRate: lastKnownRate.primeRate,
                fetchedAt: lastKnownRate.fetchedAt,
                source: lastKnownRate.source,
                fromCache: true,
            };

            cache.set(CACHE_KEY, rates);
            return rates;
        }

        repoRate = 6.75;
        source = 'Fallback Rate';
    }

    const primeRate = repoRate + PRIME_SPREAD;

    await prisma.sarbRate.create({
        data: {
            repoRate,
            primeRate,
            source,
        },
    });

    const rates = {
        repoRate,
        primeRate,
        fetchedAt: new Date(),
        source,
    };

    cache.set(CACHE_KEY, rates);
    return rates;
}
module.exports = {fetchLatestSarbRates};