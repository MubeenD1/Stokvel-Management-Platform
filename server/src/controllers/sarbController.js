const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const NodeCache = require('node-cache');

const prisma = new PrismaClient();

// this will cache the rates for 24 hours which also means that we can only fetch from our external source one time per day
const cache = new NodeCache({ stdTTL: 86400 });

const CACHE_KEY = 'sarb_rates';

// prime rate from SARB
const PRIME_SPREAD = 3.5;

//fetches current repo rate rate and calculates prime rate using it.
//falls back onto the last known source which is stored in the database if the external source is unavailable
 
async function getSarbRates(req, res) {
    try {
        // check if we have a fresh cached rate first
        const cachedRates = cache.get(CACHE_KEY);
        if (cachedRates) {
            return res.status(200).json(cachedRates);
        }

        // fetches data from trading economics 
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

        // if fetch failed, use the last known rate from the database
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
                return res.status(200).json(rates);
            }

            // if no database record exists, use the known current rate
            repoRate = 6.75;
            source = 'SARB (manually verified - March 2026)';
        }

        const primeRate = repoRate + PRIME_SPREAD;

        // save the new rate to the database
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
            fromCache: false,
        };

        // store in memory cache
        cache.set(CACHE_KEY, rates);

        return res.status(200).json(rates);

    } catch (error) {
        console.error('getSarbRates error:', error);
        return res.status(500).json({ error: 'Failed to fetch SARB rates' });
    }
}

module.exports = { getSarbRates };