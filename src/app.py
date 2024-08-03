from flask import Flask, jsonify, request, send_from_directory
import os
import psutil
import socket
import requests
import threading
import time
import speedtest

app = Flask(__name__, static_folder='../build', static_url_path='/')

# Shared variables for storing network data
network_data = {}
last_received = psutil.net_io_counters().bytes_recv
last_sent = psutil.net_io_counters().bytes_sent
last_total = last_received + last_sent
total_usage = 0

def update_network_data():
    global last_received, last_sent, last_total, total_usage, network_data

    while True:
        try:
            bytes_received = psutil.net_io_counters().bytes_recv
            bytes_sent = psutil.net_io_counters().bytes_sent
            bytes_total = bytes_received + bytes_sent

            new_received = bytes_received - last_received
            new_sent = bytes_sent - last_sent
            new_total = bytes_total - last_total

            mb_new_received = new_received / 1024 / 1024
            mb_new_sent = new_sent / 1024 / 1024
            mb_new_total = new_total / 1024 / 1024

            total_usage += mb_new_total

            last_received = bytes_received
            last_sent = bytes_sent
            last_total = bytes_total

            hostname = socket.gethostname()
            my_ip = socket.gethostbyname(hostname)

            network_data = {
                'downloadSpeed': network_data.get('downloadSpeed', 'N/A'),
                'uploadSpeed': network_data.get('uploadSpeed', 'N/A'),
                'ping': network_data.get('ping', 'N/A'),
                'dataUsage': {
                    'received': f"{mb_new_received:.2f}",
                    'sent': f"{mb_new_sent:.2f}",
                    'total': f"{mb_new_total:.2f}"
                },
                'totalUsage': f"{total_usage:.2f}",
                'ip': my_ip
            }
        except Exception as e:
            print(f"Error updating network data: {e}")

        # Wait for 1 second before updating again
        time.sleep(1)

def update_speedtest_data():
    global network_data

    while True:
        try:
            st = speedtest.Speedtest()
            download_speed = st.download() / (1024 * 1024 * 8)
            upload_speed = st.upload() / (1024 * 1024 * 8)
            ping = st.results.ping

            network_data['downloadSpeed'] = f"{download_speed:.2f}"
            network_data['uploadSpeed'] = f"{upload_speed:.2f}"
            network_data['ping'] = f"{ping:.2f}"
        except Exception as e:
            print(f"Error updating speedtest data: {e}")

        # Wait for 60 seconds before updating speedtest data again
        time.sleep(60)

@app.route('/api/network-data', methods=['GET'])
def network_data_route():
    return jsonify(network_data)

@app.route('/api/ip-info', methods=['GET'])
def ip_info():
    ip = request.args.get('ip')
    link_url = "https://api.techniknews.net/ipgeo/"
    try:
        respond = requests.get(link_url + ip).json()
        return jsonify(respond)
    except:
        return jsonify({"error": "IP not found. Try another IP."}), 404

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    if path != "" and os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')

if __name__ == "__main__":
    # Start the threads to update network and speedtest data
    threading.Thread(target=update_network_data, daemon=True).start()
    threading.Thread(target=update_speedtest_data, daemon=True).start()
    app.run(debug=True)