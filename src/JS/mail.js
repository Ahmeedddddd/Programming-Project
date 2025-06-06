var postmark = require("postmark");

// Maak client aan
var client = new postmark.ServerClient("1471770d-6944-44c3-a692-a90cfcf31116");

// Verstuur e-mail met template
client.sendEmailWithTemplate({
  "From": "tom.dekoning@student.ehb.be",
  "To": "tom.dekoning@student.ehb.be",
  "TemplateId": 40313258,
  "TemplateModel": {
    "product_url": "product_url_Value",
	"product_name": "Registration",
	"name": "Tom",
	"total": "300€",
	"due_date": "8/6/2025",
	"action_url": "action_url_Value",
	"invoice_id": "01",
	"date": "6/6/2025",
	"invoice_details": [
		{
			"description": "Registration to the EHB CareerLaunch",
			"amount": "300"
		}
	],
	"support_url": "support_url_Value",
	"company_name": "company_name_Value",
	"company_address": "company_address_Value"
  },
  "MessageStream": "payment"
}).then(response => {
  console.log("✅ E-mail verzonden:", response);
}).catch(error => {
  console.error("❌ Fout bij verzenden:", error);
});