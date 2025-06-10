const key_id = "D4lpbv7LaT7e"; // Vul hier je key_id in
const key = "ZpX7MQkepQYv";       // Vul hier je key in

// Het BTW-nummer dat je wilt checken (bijvoorbeeld: "PL7171642051")
const vatNumber = getVATNumber();

// URL voor VIES API endpoint
const url = `https://${key_id}:${key}@viesapi.eu/api/get/vies/euvat/${vatNumber}`;

fetch(url)
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  })
  .then(data => {
    console.log(data);
    // data.valid === true betekent dat het BTW-nummer bestaat en klopt
  })
  .catch(error => {
    console.error('Error:', error);
  });
