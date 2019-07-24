const rp = require('request-promise');
const fs = require('fs');
const sha1 = require('sha1');
const { codenationGetUri, codenationPostUri } = require('./tokens');

const ascii = { a: 97, z: 122 };

const getAnswer = async () => {
  try {
    return await rp({ uri: codenationGetUri, json: true });
  } catch (err) {
    console.log(err);
  }
};

const writeAnswer = answer => {
  fs.writeFileSync('answer.json', JSON.stringify(answer));
};

const readAnswer = () => {
  return JSON.parse(fs.readFileSync('answer.json'));
};

const decryptCharacter = (character, shift) => {
  if (character.charCodeAt() >= ascii.a && character.charCodeAt() <= ascii.z) {
    if (character.charCodeAt() - shift < ascii.a) {
      return String.fromCharCode(
        ascii.z - shift + (character.charCodeAt() - ascii.a + 1)
      );
    } else {
      return String.fromCharCode(character.charCodeAt() - shift);
    }
  } else {
    return character;
  }
};

const decryptAnswer = ({ cifrado: encrypt, numero_casas: shift }) => {
  let decryptString = '';
  [...encrypt].forEach(character => {
    decryptString = decryptString.concat(decryptCharacter(character, shift));
  });
  return decryptString;
};

const createSha1 = ({ decifrado: decryptedAnswer }) => sha1(decryptedAnswer);

const sendAnswer = async () => {
  try {
    return await rp({
      uri: codenationPostUri,
      method: 'POST',
      formData: {
        answer: {
          value: fs.createReadStream('answer.json'),
          options: {
            filename: 'answer.json',
            contentType: 'multipart/form-data'
          }
        }
      }
    });
  } catch (err) {
    console.log(err);
  }
};

const getReadAndSendAnswer = async () => {
  const answer = await getAnswer();
  writeAnswer(answer);
  answer.decifrado = decryptAnswer(answer);
  answer.resumo_criptografico = createSha1(answer);
  writeAnswer(answer);
  const result = await sendAnswer();
  console.log(result);
};

getReadAndSendAnswer();
