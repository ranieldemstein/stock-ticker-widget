const apiKey = '9htrZy1d7DYcG21DJKi6YwCo1_rCMfN8';

// Function to get URL parameter
function getURLParameter(name) {
    return new URLSearchParams(window.location.search).get(name);
}

// Fetch company details from the API
async function getCompanyData(ticker) {
    try {
        const response = await fetch(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${apiKey}`);
        if (!response.ok) throw new Error(`Company data fetch error: ${response.statusText}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching company data:', error);
        throw error;
    }
}

// Fetch snapshot data from the API
async function getSnapshotData(ticker) {
    try {
        const response = await fetch(`https://api.polygon.io/v2/snapshot/locale/us/markets/stocks/tickers/${ticker}?apiKey=${apiKey}`);
        if (!response.ok) throw new Error(`Snapshot data fetch error: ${response.statusText}`);
        const data = await response.json();
        return data.ticker;
    } catch (error) {
        console.error('Error fetching snapshot data:', error);
        throw error;
    }
}

// Fetch financials data from the API
async function getFinancialsData(ticker) {
    try {
        const response = await fetch(`https://api.polygon.io/vX/reference/financials?ticker=${ticker}&apiKey=${apiKey}`);
        if (!response.ok) throw new Error(`Financials data fetch error: ${response.statusText}`);
        const data = await response.json();
        console.log('Financials data:', data);  // Log the data to see its structure
        return data.results[0];
    } catch (error) {
        console.error('Error fetching financials data:', error);
        throw error;
    }
}

// Fetch dividend data from the API
async function getDividendData(ticker) {
    try {
        const response = await fetch(`https://api.polygon.io/v3/reference/dividends?ticker=${ticker}&apiKey=${apiKey}`);
        if (!response.ok) throw new Error(`Dividend data fetch error: ${response.statusText}`);
        const data = await response.json();
        return data.results;
    } catch (error) {
        console.error('Error fetching dividend data:', error);
        throw error;
    }
}

// Fetch market cap and currency data from the API
async function getMarketCapAndCurrencyData(ticker) {
    try {
        const response = await fetch(`https://api.polygon.io/v3/reference/tickers/${ticker}?apiKey=${apiKey}`);
        if (!response.ok) throw new Error(`Market cap and currency data fetch error: ${response.statusText}`);
        const data = await response.json();
        return {
            marketCap: data.results.market_cap,
            currency: data.results.currency_name
        };
    } catch (error) {
        console.error('Error fetching market cap and currency data:', error);
        throw error;
    }
}

// Fetch market status from the API
async function getMarketStatus() {
    try {
        const response = await fetch(`https://api.polygon.io/v1/marketstatus/now?apiKey=${apiKey}`);
        if (!response.ok) throw new Error(`Market status fetch error: ${response.statusText}`);
        const data = await response.json();
        return data.market;
    } catch (error) {
        console.error('Error fetching market status:', error);
        throw error;
    }
}

// Format market cap value
function formatMarketCap(value) {
    const tiers = [
        { value: 1, symbol: '' },
        { value: 1E3, symbol: 'K' },
        { value: 1E6, symbol: 'M' },
        { value: 1E9, symbol: 'B' },
        { value: 1E12, symbol: 'T' }
    ];
    const tier = tiers.slice().reverse().find(tier => value >= tier.value);
    return tier ? (value / tier.value).toFixed(2) + tier.symbol : '0';
}

// Calculate and format dividend yield
function formatDividendYield(dps, frequency, price) {
    if (dps && frequency && price) {
        const annualDps = dps * frequency;
        return ((annualDps / price) * 100).toFixed(2) + '%';
    }
    return 'N/A';
}

// Calculate and format P/E ratio
function formatPERatio(price, eps) {
    if (price && eps) {
        return (price / eps).toFixed(2);
    }
    return 'N/A';
}

// Update the widget with fetched data
async function updateWidget() {
    try {
        const ticker = getURLParameter('ticker');
        if (!ticker) {
            throw new Error('Ticker parameter is missing in the URL');
        }

        document.getElementById('ticker').innerText = ticker.toUpperCase();

        const companyData = await getCompanyData(ticker);
        document.getElementById('company-logo').src = `${companyData.branding.icon_url}?apiKey=${apiKey}`;
        document.getElementById('company-name').innerText = companyData.name;

        const snapshotData = await getSnapshotData(ticker);
        const financialsData = await getFinancialsData(ticker);
        const dividendData = await getDividendData(ticker);
        const { marketCap, currency } = await getMarketCapAndCurrencyData(ticker);
        const marketStatus = await getMarketStatus();

        if (!snapshotData || !financialsData) {
            throw new Error('Missing data from API response');
        }

        const currentPrice = snapshotData.lastTrade.p;
        const priceChange = snapshotData.todaysChange;
        const priceChangePercent = snapshotData.todaysChangePerc;

        document.getElementById('current-price').innerText = currentPrice.toFixed(2);
        document.getElementById('usd').innerText = currency ? currency.toUpperCase() : "USD";
        const priceChangeElement = document.getElementById('price-change');
        priceChangeElement.innerText = `${priceChange.toFixed(2)} (${priceChangePercent.toFixed(2)}%)`;

        if (priceChange >= 0) {
            priceChangeElement.style.color = '#06cbf8';
        } else {
            priceChangeElement.style.color = '#ff4441';
        }

        // Display the Market Cap value
        document.getElementById('market-cap').innerText = marketCap ? formatMarketCap(marketCap) : 'N/A';

        // Display the Dividend Yield value
        const dps = dividendData.length ? dividendData[0].cash_amount : null;
        const frequency = dividendData.length ? dividendData[0].frequency : null;
        document.getElementById('div-yield').innerText = formatDividendYield(dps, frequency, currentPrice);

        // Display the EPS value
        const epsValue = financialsData.financials.income_statement.basic_earnings_per_share.value;
        console.log('EPS Value:', epsValue);  // Log the EPS value to check if it's being fetched correctly
        document.getElementById('eps').innerText = epsValue ? epsValue.toFixed(2) : 'N/A';

        // Display the P/E ratio
        const peRatio = formatPERatio(currentPrice, epsValue);
        document.getElementById('pe').innerText = peRatio;

        // Display the market status
        document.getElementById('market-status').innerText = `MARKET ${marketStatus.toUpperCase()}`;

    } catch (error) {
        console.error('Error updating widget:', error);
    }
}

// Initial call to update the widget
updateWidget();
