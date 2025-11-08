import axios from "axios";

const API = "http://localhost/rfid_api";

export const fetchData = () => axios.get(`${API}/get_data.php`);
export const toggleRFID = (rfid) =>
  axios.post(`${API}/update_status.php`, new URLSearchParams({ rfid }));
