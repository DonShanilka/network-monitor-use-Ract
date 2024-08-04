const express = require('express');
const os = require('os');
const ps = require('ps-node');
const speedTest = require('speedtest-net');
const axios = require('axios');
const path = require('path');
const app = express();

let networkData = {};
let lastReceived = 0;
let lastSent = 0;
let lastTotal = 0;
let totalUsage = 0;

const getNetworkStats = () => {
    const netStats = os.networkInterfaces();
    let bytesReceived = 0;
    let bytesSent = 0;

    for (let interface in netStats) {
        netStats[interface].forEach(stat => {
            if (stat.family === 'IPv4' && !stat.internal) {
                bytesReceived += stat.rx_bytes || 0;
                bytesSent += stat.tx_bytes || 0;
            }
        });
    }

    return { bytesReceived, bytesSent };
};

const updateNetworkData = () => {
    setInterval(() => {
        try {
            const { bytesReceived, bytesSent } = getNetworkStats();
            const bytesTotal = bytesReceived + bytesSent;

            const newReceived = bytesReceived - lastReceived;
            const newSent = bytesSent - lastSent;
            const newTotal = bytesTotal - lastTotal;

            const mbNewReceived = newReceived / 1024 / 1024;
            const mbNewSent = newSent / 1024 / 1024;
            const mbNewTotal = newTotal / 1024 / 1024;

            totalUsage += mbNewTotal;

            lastReceived = bytesReceived;
            lastSent = bytesSent;
            lastTotal = bytesTotal;

            const hostname = os.hostname();
            const myIP = Object.values(os.networkInterfaces())
                .flat()
                .find((details) => details.family === 'IPv4' && !details.internal).address;

            networkData = {
                downloadSpeed: networkData.downloadSpeed || 'N/A',
                uploadSpeed: networkData.uploadSpeed || 'N/A',
                ping: networkData.ping || 'N/A',
                dataUsage: {
                    received: mbNewReceived.toFixed(2),
                    sent: mbNewSent.toFixed(2),
                    total: mbNewTotal.toFixed(2)
                },
                totalUsage: totalUsage.toFixed(2),
                ip: myIP
            };
        } catch (error) {
            console.error(`Error updating network data: ${error}`);
        }
    }, 1000);
};

const updateSpeedtestData = () => {
    setInterval(async () => {
        try {
            const test = speedTest({ acceptLicense: true });
            const result = await test;

            networkData.downloadSpeed = (result.download.bandwidth / (1024 * 1024)).toFixed(2);
            networkData.uploadSpeed = (result.upload.bandwidth / (1024 * 1024)).toFixed(2);
            networkData.ping = result.ping.latency.toFixed(2);
        } catch (error) {
            console.error(`Error updating speedtest data: ${error}`);
        }
    }, 60000);
};

app.use(express.static(path.join(__dirname, '../build')));

app.get('/api/network-data', (req, res) => {
    res.json(networkData);
});

app.get('/api/ip-info', async (req, res) => {
    const ip = req.query.ip;
    const linkUrl = `https://api.techniknews.net/ipgeo/${ip}`;
    try {
        const response = await axios.get(linkUrl);
        res.json(response.data);
    } catch {
        res.status(404).json({ error: 'IP not found. Try another IP.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
    updateNetworkData();
    updateSpeedtestData();
});
