// în fișierul utils/termeneApi.js
import axios from 'axios';

export async function getCompanyInfo(cui) {
  const apiUrl = '/api/termene'; // Rută nouă pe serverul tău
  try {
    const response = await axios.post(apiUrl, { cui: cui });

const data = response.data;

// Verificăm dacă avem datele necesare
if (!data || !data.nume) {
  throw new Error('Date insuficiente sau incorecte primite de la API');
}

const companyInfo = {
  nume: data.nume,
  adresa: `${data.adresa || ''}, ${data.localitate || ''}, ${data.judet || ''}`,
  actionari: data.fizice ? data.fizice.map(a => a.nume_as) : [],
  administratori: data.administratori ? data.administratori.map(a => a.nume_adm) : []
};

return companyInfo;
} catch (error) {
console.error('Eroare la obținerea informațiilor companiei:', error);
throw error;
}
}