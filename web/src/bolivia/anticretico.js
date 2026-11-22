export function simulateAnticretico({ deposit, months, rent, rate, increase }) {
  if (![deposit, months, rent, rate, increase].every(Number.isFinite) || deposit <= 0 || rate <= 0 ||
      !Number.isSafeInteger(months) || months < 1 || rent < 0 || increase < 0) throw new RangeError("Invalid simulation");
  const savedRent = rent * months;
  const initialBOB = deposit * rate;
  const changeBOB = initialBOB * (increase / 100);
  const finalBOB = initialBOB + changeBOB;
  if (![savedRent, initialBOB, changeBOB, finalBOB].every(Number.isFinite)) throw new RangeError("Simulation overflow");
  return { savedRent, initialBOB, finalBOB, changeBOB };
}
