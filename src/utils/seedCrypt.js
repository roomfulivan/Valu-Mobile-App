import aes256 from './crypto/aes256';

// TODO: check pin strength

export const encryptkey = async (cipherKey, string) => {
  // test pin security
  // - at least 1 char in upper case
  // - at least 1 digit
  // - at least one special character
  // - min length 8

  // const _pinTest = _pin.match('^(?=.*[A-Z])(?=.*[^<>{}\"/|;:.,~!?@#$%^=&*\\]\\\\()\\[_+]*$)(?=.*[0-9])(?=.*[a-z]).{8}$');
  const encryptedString = await aes256.encrypt(cipherKey, string);

  return encryptedString;
}

export const decryptkey = (cipherKey, string) => {
  try {
    const decryptedKey = aes256.decrypt(cipherKey, string);

    return decryptedKey;
  } catch (error) {
    if (error.message == 'Unsupported state or unable to authenticate data') return legacy_decryptkey(cipherKey, string)
    else return false
  }
}

export const legacy_decryptkey = (cipherKey, string) => {
  const decryptedKey = aes256.legacy_decrypt(cipherKey, string);

  // test if stored encrypted passphrase is decrypted correctly
  // if not then the key is wrong
  const _regexTest = decryptedKey.match(/^[0-9a-zA-Z ]+$/g);

  return !_regexTest ? false : decryptedKey;
}

export const decryptGeneral = (cipherKey, string) => (
  aes256.decrypt(cipherKey, string)
)
