// src/JS/sendInvoice.js
document.getElementById('registratieForm').addEventListener('submit', async (e) => {
  e.preventDefault();

  const firstName = e.target.voornaam.value;
  const lastName = e.target.achternaam.value;
  const name = `${firstName} ${lastName}`;

  const email = e.target.email.value;

  const invoiceData = {
    email,
    name,
    product_name: 'CareerLaunch',
    total: '300€',
    due_date: '2025-06-15',
    action_url: 'https://careerlaunch.example.com/pay',
    invoice_id: crypto.randomUUID(),
    date: new Date().toLocaleDateString(),
    invoice_details: [
      {
        description: 'Deelname CareerLaunch event',
        amount: 300
      }
    ]
  };

  try {
    const res = await fetch('/api/send-invoice', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(invoiceData)
    });

    const result = await res.json();
    alert(result.message);
  } catch (err) {
    console.error('Verzenden mislukt:', err);
    alert('Er is iets misgegaan bij het verzenden.');
  }
});