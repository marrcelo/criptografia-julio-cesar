const rp = require('request-promise');
const fs = require('fs');
const sha1 = require('sha1');
const token = '704a46331143d01b030fbc7b02a0b873fca723ab';
const ascii = { a: 97, z: 122 };

const getAnswer = async () => {
  return await rp({
    uri: `https://api.codenation.dev/v1/challenge/dev-ps/generate-data?token=${token}`,
    json: true
  });
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

const createSha1 = ({ decifrado: decryptedAnswer }) => {
  return sha1(decryptedAnswer);
};

const sendAnswer = async form => {
  return await rp({
    uri: `https://api.codenation.dev/v1/challenge/dev-ps/submit-solution?token=${token}`,
    method: 'POST',
    formData: {
      answer: {
        value: fs.createReadStream('answer.json'),
        options: {
          filename: 'answer.json',
          contentType: 'multipart/form-data'
        }
      }
    },
    headers: {
      'content-type': 'multipart/form-data'
    }
  })
    .then(body => {
      console.log(body);
    })
    .catch(err => {
      console.log(err);
    });
};

const getReadAndSendAnswer = async () => {
  const answer = await getAnswer();
  writeAnswer(answer);
  answer.decifrado = decryptAnswer(answer);
  answer.resumo_criptografico = createSha1(answer);
  writeAnswer(answer);
  await sendAnswer(answer);
};

getReadAndSendAnswer();
