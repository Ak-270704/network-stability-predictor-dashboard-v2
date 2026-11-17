import subprocess
import re
import csv
import time
import socket
import os
import requests
import speedtest
from datetime import datetime
from statistics import mean


# ==========================================================
# SETTINGS
# ==========================================================

PING_TARGET = "8.8.8.8"
DNS_HOST = "google.com"
HTTP_TARGET = "https://www.google.com"

# NEW: Target one reading every 15 seconds
COLLECTION_INTERVAL = 15

PING_COUNT = 5

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CSV_FILE = os.path.join(SCRIPT_DIR, "network_data.csv")


# ==========================================================
# GET WIFI INFORMATION
# ==========================================================

def get_wifi_info():

    try:

        result = subprocess.run(
            ["netsh", "wlan", "show", "interfaces"],
            capture_output=True,
            text=True,
            timeout=10
        )

        output = result.stdout

        ssid = "Unknown"
        signal = 0

        for line in output.splitlines():

            line = line.strip()

            if line.startswith("SSID") and "BSSID" not in line:

                ssid = line.split(":", 1)[1].strip()

            if line.startswith("Signal"):

                value = (
                    line.split(":", 1)[1]
                    .strip()
                    .replace("%", "")
                )

                try:

                    signal = int(value)

                except ValueError:

                    signal = 0

        return ssid, signal

    except Exception as e:

        print("Wi-Fi information error:", e)

        return "Unknown", 0


# ==========================================================
# GET LOCAL IP
# ==========================================================

def get_local_ip():

    sock = None

    try:

        sock = socket.socket(
            socket.AF_INET,
            socket.SOCK_DGRAM
        )

        sock.connect(
            (PING_TARGET, 80)
        )

        return sock.getsockname()[0]

    except Exception:

        try:

            hostname = socket.gethostname()

            return socket.gethostbyname(
                hostname
            )

        except Exception:

            return "Unknown"

    finally:

        if sock is not None:

            sock.close()


# ==========================================================
# GET NETWORK INTERFACE
# ==========================================================

def get_network_interface():

    try:

        result = subprocess.run(
            ["netsh", "wlan", "show", "interfaces"],
            capture_output=True,
            text=True,
            timeout=10
        )

        output = result.stdout

        for line in output.splitlines():

            line = line.strip()

            if line.startswith("Name"):

                return (
                    line.split(":", 1)[1]
                    .strip()
                )

        return "Unknown"

    except Exception as e:

        print(
            "Network interface error:",
            e
        )

        return "Unknown"


# ==========================================================
# PING TEST
# ==========================================================

def ping_test():

    latencies = []

    lost_packets = 0


    for _ in range(PING_COUNT):

        try:

            result = subprocess.run(
                [
                    "ping",
                    "-n",
                    "1",
                    "-w",
                    "2000",
                    PING_TARGET
                ],
                capture_output=True,
                text=True,
                timeout=5
            )

            output = result.stdout

            match = re.search(
                r"time[=<]\s*(\d+)\s*ms",
                output,
                re.IGNORECASE
            )

            if match:

                latency = float(
                    match.group(1)
                )

                latencies.append(
                    latency
                )

            else:

                lost_packets += 1

        except Exception:

            lost_packets += 1


    packet_loss = (
        lost_packets /
        PING_COUNT
    ) * 100


    if latencies:

        avg_latency = round(
            mean(latencies),
            2
        )

    else:

        avg_latency = 0


    if len(latencies) > 1:

        differences = []

        for i in range(
            1,
            len(latencies)
        ):

            difference = abs(
                latencies[i] -
                latencies[i - 1]
            )

            differences.append(
                difference
            )

        jitter = round(
            mean(differences),
            2
        )

    else:

        jitter = 0


    reachable = (
        1 if latencies else 0
    )


    return (
        avg_latency,
        round(packet_loss, 2),
        jitter,
        reachable
    )


# ==========================================================
# DNS TEST
# ==========================================================

def dns_test():

    try:

        start = time.perf_counter()

        socket.gethostbyname(
            DNS_HOST
        )

        end = time.perf_counter()

        dns_time = (
            end - start
        ) * 1000

        return round(
            dns_time,
            2
        )

    except Exception as e:

        print(
            "DNS test error:",
            e
        )

        return 0


# ==========================================================
# HTTP TEST
# ==========================================================

def http_test():

    try:

        start = time.perf_counter()

        response = requests.get(
            HTTP_TARGET,
            timeout=5
        )

        _ = response.content

        end = time.perf_counter()

        response_time = (
            end - start
        ) * 1000

        return round(
            response_time,
            2
        )

    except Exception as e:

        print(
            "HTTP test error:",
            e
        )

        return 0


# ==========================================================
# FRESH SPEED TEST
# ==========================================================

def speed_test():

    try:

        print()
        print(
            "Running fresh speed test..."
        )

        st = speedtest.Speedtest()

        st.get_best_server()

        download = st.download()

        upload = st.upload()


        download_mbps = round(
            download / 1_000_000,
            2
        )

        upload_mbps = round(
            upload / 1_000_000,
            2
        )


        print(
            "Download:",
            download_mbps,
            "Mbps"
        )

        print(
            "Upload:",
            upload_mbps,
            "Mbps"
        )


        return (
            download_mbps,
            upload_mbps,
            True
        )

    except Exception as e:

        print(
            "Speed test failed:",
            e
        )

        return 0.0, 0.0, False


# ==========================================================
# SPEED TEST WITH RETRY
# ==========================================================

def get_fresh_speed():

    for attempt in range(
        1,
        4
    ):

        (
            download,
            upload,
            success
        ) = speed_test()


        if success:

            return (
                download,
                upload
            )


        print(
            "Attempt",
            attempt,
            "failed."
        )


        if attempt < 3:

            print(
                "Retrying in 2 seconds..."
            )

            time.sleep(2)


    return 0.0, 0.0


# ==========================================================
# STABILITY
# ==========================================================

def calculate_stability(
        latency,
        packet_loss,
        jitter,
        reachable
):

    if reachable == 0:

        return "Unstable"


    if (
        packet_loss > 5
        or latency > 100
        or jitter > 30
    ):

        return "Unstable"


    elif (
        packet_loss > 1
        or latency > 50
        or jitter > 15
    ):

        return "Warning"


    else:

        return "Stable"


# ==========================================================
# CSV HEADERS
# ==========================================================

HEADERS = [

    "timestamp",

    "ssid",

    "network_interface",

    "local_ip",

    "latency_ms",

    "packet_loss_percent",

    "jitter_ms",

    "download_mbps",

    "upload_mbps",

    "wifi_signal_percent",

    "dns_response_ms",

    "http_response_ms",

    "target_reachable",

    "stability"

]


# ==========================================================
# CREATE CSV
# ==========================================================

def create_csv():

    if (
        not os.path.exists(
            CSV_FILE
        )
        or
        os.path.getsize(
            CSV_FILE
        ) == 0
    ):

        with open(
            CSV_FILE,
            "w",
            newline="",
            encoding="utf-8"
        ) as file:

            writer = csv.writer(
                file
            )

            writer.writerow(
                HEADERS
            )


# ==========================================================
# SAVE ROW
# ==========================================================

def save_row(row):

    try:

        with open(
            CSV_FILE,
            "a",
            newline="",
            encoding="utf-8"
        ) as file:

            writer = csv.writer(
                file
            )

            writer.writerow(
                row
            )

            file.flush()

            os.fsync(
                file.fileno()
            )


        print(
            "CSV row saved successfully."
        )

        return True


    except PermissionError:

        print()
        print(
            "ERROR: Close network_data.csv "
            "if it is open in Excel."
        )

        return False


    except Exception as e:

        print(
            "CSV error:",
            e
        )

        return False


# ==========================================================
# MAIN
# ==========================================================

def main():

    create_csv()


    print()
    print(
        "======================================"
    )

    print(
        "   NETWORK DATA COLLECTION SYSTEM"
    )

    print(
        "======================================"
    )

    print()

    print(
        "Target measurement interval:",
        COLLECTION_INTERVAL,
        "seconds"
    )

    print(
        "Fresh speed test:",
        "Every measurement"
    )

    print(
        "CSV:",
        CSV_FILE
    )

    print()

    print(
        "Press CTRL + C to stop."
    )

    print()


    measurement_number = 1


    while True:

        try:

            # Record exact start time
            cycle_start = (
                time.monotonic()
            )


            timestamp = (
                datetime.now()
                .strftime(
                    "%Y-%m-%d %H:%M:%S"
                )
            )


            print()
            print(
                "======================================"
            )

            print(
                "MEASUREMENT",
                measurement_number
            )

            print(
                "Start time:",
                timestamp
            )

            print(
                "======================================"
            )


            # ==========================================
            # WIFI
            # ==========================================

            ssid, signal = (
                get_wifi_info()
            )


            # ==========================================
            # INTERFACE
            # ==========================================

            interface = (
                get_network_interface()
            )


            # ==========================================
            # IP
            # ==========================================

            local_ip = (
                get_local_ip()
            )


            # ==========================================
            # PING
            # ==========================================

            (
                latency,
                packet_loss,
                jitter,
                reachable
            ) = ping_test()


            # ==========================================
            # DNS
            # ==========================================

            dns_time = (
                dns_test()
            )


            # ==========================================
            # HTTP
            # ==========================================

            http_time = (
                http_test()
            )


            # ==========================================
            # FRESH SPEED TEST
            # ==========================================

            download, upload = (
                get_fresh_speed()
            )


            # ==========================================
            # STABILITY
            # ==========================================

            stability = (
                calculate_stability(
                    latency,
                    packet_loss,
                    jitter,
                    reachable
                )
            )


            # ==========================================
            # ROW
            # ==========================================

            row = [

                timestamp,

                ssid,

                interface,

                local_ip,

                latency,

                packet_loss,

                jitter,

                download,

                upload,

                signal,

                dns_time,

                http_time,

                reachable,

                stability

            ]


            # ==========================================
            # SAVE
            # ==========================================

            save_row(
                row
            )


            # ==========================================
            # DISPLAY
            # ==========================================

            print()
            print(
                "--------------------------------------"
            )

            print(
                "Time:",
                timestamp
            )

            print(
                "SSID:",
                ssid
            )

            print(
                "Signal:",
                signal,
                "%"
            )

            print(
                "Latency:",
                latency,
                "ms"
            )

            print(
                "Packet Loss:",
                packet_loss,
                "%"
            )

            print(
                "Jitter:",
                jitter,
                "ms"
            )

            print(
                "Download:",
                download,
                "Mbps"
            )

            print(
                "Upload:",
                upload,
                "Mbps"
            )

            print(
                "DNS:",
                dns_time,
                "ms"
            )

            print(
                "HTTP:",
                http_time,
                "ms"
            )

            print(
                "Status:",
                stability
            )

            print(
                "--------------------------------------"
            )


            measurement_number += 1


            # ==========================================
            # 15 SECOND TARGET INTERVAL
            # ==========================================

            elapsed = (
                time.monotonic()
                -
                cycle_start
            )


            remaining_time = max(
                0,
                COLLECTION_INTERVAL
                -
                elapsed
            )


            print()
            print(
                "Measurement process took:",
                round(
                    elapsed,
                    2
                ),
                "seconds"
            )


            if remaining_time > 0:

                print(
                    "Next reading in:",
                    round(
                        remaining_time,
                        2
                    ),
                    "seconds"
                )

                time.sleep(
                    remaining_time
                )

            else:

                print(
                    "Measurement took longer "
                    "than 15 seconds."
                )

                print(
                    "Starting next reading immediately."
                )


        except KeyboardInterrupt:

            print()
            print(
                "======================================"
            )

            print(
                "DATA COLLECTION STOPPED"
            )

            print(
                "Saved file:",
                CSV_FILE
            )

            print(
                "======================================"
            )

            break


        except Exception as e:

            print(
                "Unexpected error:",
                e
            )

            time.sleep(5)


# ==========================================================
# RUN
# ==========================================================

if __name__ == "__main__":

    main()