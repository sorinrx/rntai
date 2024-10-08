import axios from "axios";
import { parseStringPromise } from "xml2js";

const getExchangeRate = async () => {
  // Definim URL-ul bazat pe mediul de execuție
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
  const url = `${baseUrl}/api/exchangeRate`;

  try {
    console.log('Fetching exchange rate from:', url); // Log the full URL

    const response = await axios.get(url);
    console.log('XML Response:', response.data);

    const result = await parseStringPromise(response.data);
    console.log('Parsed Result:', JSON.stringify(result, null, 2));

    const rate = result.DataSet.Body[0].Cube[0].Rate.find(
      (r: any) => r.$.currency === 'EUR'
    )._;

    console.log('EUR Rate:', rate);

    return {
      currency: 'EUR',
      rate: parseFloat(rate),
    };
  } catch (error) {
    console.error("Error fetching exchange rate:", error);
    return null;
  }
};

export { getExchangeRate };