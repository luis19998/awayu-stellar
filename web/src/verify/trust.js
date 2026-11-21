export function assessTrust({ registered = false, endorsements = 0, verified = false, errors = 0 } = {}) {
  const reasons = [];
  if (!registered) {
    reasons.push("not_registered");
    return { level: "red", reasons };
  }
  reasons.push("registered");
  if (Number(endorsements) > 0) reasons.push("has_endorsements");
  else reasons.push("no_endorsements");
  if (verified) reasons.push("build_verified");
  else reasons.push("build_unverified");
  if (Number(errors) > 0) reasons.push("expert_errors");
  const level = verified && Number(endorsements) > 0 && Number(errors) === 0 ? "green" : "yellow";
  return { level, reasons };
}
