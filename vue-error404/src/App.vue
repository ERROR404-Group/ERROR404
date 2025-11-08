<template>
  <div id="app" class="container">
    <header>
      <h1>Web Interface</h1>
    </header>

    <!-- RFID layout -->
    <div class="rfid-layout">
      <!-- Left: RFID list -->
      <div class="rfid-list">
        <h3>Registered RFID Cards</h3>
        <ul>
          <li v-for="(item, index) in rfidList" :key="item.id">
            <span>{{ index + 1 }}. {{ item.rfid }}</span>
            <label class="switch">
              <input
                type="checkbox"
                :checked="item.status === 1"
                @click="toggleStatus(item)"
              />
              <span class="slider"></span>
            </label>
          </li>
        </ul>
      </div>

      <!-- Right: RFID logs -->
      <div class="table-container">
        <h3>RFID Logs</h3>
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>RFID</th>
              <th>Status</th>
              <th>Date & Time</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="(log, index) in rfidLogs" :key="log.id">
              <td>{{ index + 1 }}</td>
              <td>{{ log.rfid }}</td>
              <td>
                <!-- Cleaned-up display logic -->
                <span
                  v-if="log.status === 'RFID NOT FOUND'"
                  class="notfound-status"
                >
                  RFID NOT FOUND
                </span>
                <span
                  v-else-if="log.status === 1"
                  class="active-status"
                >
                  1
                </span>
                <span
                  v-else-if="log.status === 0"
                  class="inactive-status"
                >
                  0
                </span>
                <span v-else>-</span>
              </td>
              <td>{{ formatDate(log.date) }}</td>

            </tr>

            <tr v-if="rfidLogs.length === 0">
              <td colspan="4" class="no-result">No logs yet.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Toast -->
    <div v-if="showToast" class="toast">
      <i data-lucide="check-circle"></i> Updated!
    </div>
  </div>
</template>

<script>
import axios from "axios";

export default {
  data() {
    return {
      rfidList: [],
      rfidLogs: [],
      darkMode: false,
      showToast: false,
      autoRefresh: null,
      loading: false,
    };
  },

  mounted() {
    this.fetchAllData();
    this.autoRefresh = setInterval(this.fetchAllData, 5000);
    lucide.createIcons();
  },

  beforeUnmount() {
    clearInterval(this.autoRefresh);
  },

  methods: {
    async fetchAllData() {
      this.loading = true;
      try {
        const res = await axios.get("http://localhost/rfid_api/get_data.php");
        this.rfidList = res.data.rfid_reg.map((r, i) => ({
          id: r.id || i + 1,
          rfid: r.rfid_data,
          status: parseInt(r.rfid_status),
        }));

        this.rfidLogs = res.data.rfid_logs.map((l, i) => {
          let status = l.rfid_status;

          //Handle string vs number
          if (typeof status === "string" && status.toUpperCase().includes("RFID NOT FOUND")) {
            status = "RFID NOT FOUND";
          } else if (!isNaN(status)) {
            status = parseInt(status);
          }

          return {
            id: i + 1,
            rfid: l.rfid_data,
            status,
            date: l.time_log,
          };
        });
      } catch (err) {
        console.error("Failed to load data:", err);
      } finally {
        this.loading = false;
      }
    },

    formatDate(datetime) {
    if (!datetime) return "-";

    const date = new Date(datetime.replace(" ", "T")); // fix MySQL timestamp format
    const options = {
      year: "numeric",
      month: "long",
      day: "2-digit",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    };

    return date.toLocaleString("en-US", options);
  },

    async toggleStatus(log) {
      try {
        const res = await axios.get(
          `http://localhost/rfid_api/update_status.php?rfid_data=${log.rfid}`
        );
        const response = res.data.toString().trim();

        console.log("Server response:", response);

        if (response === "0" || response === "1") {
          //Normal toggle
          log.status = parseInt(response);
          this.rfidLogs.unshift({
            id: this.rfidLogs.length + 1,
            rfid: log.rfid,
            status: parseInt(response),
            date: new Date().toLocaleString(),
          });
          this.showToastMessage();
        } else if (response.includes("RFID NOT FOUND")) {
          // Unregistered RFID
          this.rfidLogs.unshift({
            id: this.rfidLogs.length + 1,
            rfid: log.rfid,
            status: "RFID NOT FOUND",
            date: new Date().toLocaleString(),
          });
          alert("RFID NOT FOUND");
        } else {
          alert("Unexpected response: " + response);
        }
      } catch (err) {
        alert("Connection error");
        console.error(err);
      }
    },

    showToastMessage() {
      this.showToast = true;
      setTimeout(() => (this.showToast = false), 1500);
    },
  },
};
</script>


