const axios = require("axios");

const options = {
  method: "POST",
  url: "https://smsapi-com3.p.rapidapi.com/sms.do",
  params: {
    access_token: "<REQUIRED>",
  },
  headers: {
    "content-type": "application/json",
    "X-RapidAPI-Key": "SIGN-UP-FOR-KEY",
    "X-RapidAPI-Host": "smsapi-com3.p.rapidapi.com",
  },
  data: {
    to: "",
    message: "",
    from: "",
    normalize: "",
    group: "",
    encoding: "",
    flash: "",
    test: "",
    details: "",
    date: "",
    date_validate: "",
    time_restriction: "follow",
    allow_duplicates: "",
    idx: "",
    check_idx: "",
    max_parts: "",
    fast: "",
    notify_url: "",
    format: "json",
  },
};

try {
  const response = await axios.request(options);
  console.log(response.data);
} catch (error) {
  console.error(error);
}
