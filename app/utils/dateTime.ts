const getCurrentDateTime = () => {
  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1, // Luna este indexată de la 0, adăugăm 1
    day: now.getDate(),
    hour: now.getHours(),
    minute: now.getMinutes()
  };
};

export { getCurrentDateTime };