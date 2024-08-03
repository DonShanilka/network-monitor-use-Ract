import React, { useEffect, useState } from 'react';
import axios from 'axios';

const NetworkMonitor = () => {
    const [downloadSpeed, setDownloadSpeed] = useState("Calculating...");
    const [uploadSpeed, setUploadSpeed] = useState("Calculating...");
    const [ping, setPing] = useState("Calculating...");
    const [dataUsage, setDataUsage] = useState({ received: 0, sent: 0, total: 0 });
    const [totalUsage, setTotalUsage] = useState(0);
    const [ip, setIp] = useState("Calculating...");
    const [ipInfo, setIpInfo] = useState("");
    const [ipInput, setIpInput] = useState("");

    useEffect(() => {
        const fetchNetworkData = async () => {
            try {
                const response = await axios.get('/api/network-data');
                setDownloadSpeed(response.data.downloadSpeed);
                setUploadSpeed(response.data.uploadSpeed);
                setPing(response.data.ping);
                setDataUsage(response.data.dataUsage);
                setTotalUsage(response.data.totalUsage);
                setIp(response.data.ip);
            } catch (error) {
                console.error("Error fetching network data", error);
            }
        };

        fetchNetworkData();
        const interval = setInterval(fetchNetworkData, 1000);

        return () => clearInterval(interval);
    }, []);

    const handleGetIpInfo = async () => {
        try {
            const response = await axios.get(`/api/ip-info?ip=${ipInput}`);
            setIpInfo(JSON.stringify(response.data, null, 2));
        } catch (error) {
            console.error("Error fetching IP info", error);
        }
    };

    return (
        <div style={{ padding: '20px' }}>
            <h1>Network Monitor</h1>
            <div>
                <p>Download Speed: {downloadSpeed} Mb</p>
                <p>Upload Speed: {uploadSpeed} Mb</p>
                <p>Ping: {ping} ms</p>
                <table border="1" style={{ marginTop: '20px', width: '100%', textAlign: 'left' }}>
                    <thead>
                        <tr>
                            <th>Data Usage</th>
                            <th>Amount (MB)</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td>Received</td>
                            <td>{dataUsage.received}</td>
                        </tr>
                        <tr>
                            <td>Sent</td>
                            <td>{dataUsage.sent}</td>
                        </tr>
                        <tr>
                            <td>Total</td>
                            <td>{dataUsage.total}</td>
                        </tr>
                    </tbody>
                </table>
                <p>Total Data Usage: {totalUsage} MB</p>
                <p>My IP Address: {ip}</p>
            </div>
            <div>
                <input
                    type="text"
                    placeholder="Enter IP to get details"
                    value={ipInput}
                    onChange={(e) => setIpInput(e.target.value)}
                />
                <button onClick={handleGetIpInfo}>Get IP Info</button>
                <textarea value={ipInfo} readOnly style={{ width: '100%', height: '200px' }}></textarea>
            </div>
        </div>
    );
};

export default NetworkMonitor;
