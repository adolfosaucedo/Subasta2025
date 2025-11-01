// helpers/validators.js
export function isStrongPassword(pwd = "") {
  // Mínimo 8, al menos: 1 minúscula, 1 mayúscula, 1 número, 1 símbolo
  const re =
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[ !"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]).{8,}$/;
  return re.test(pwd);
}
