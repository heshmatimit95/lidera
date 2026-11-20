const bcrypt = require('bcryptjs');
const pass = '123456'; 
const hash = bcrypt.hashSync(pass, 12);
console.log('HASH:', hash);
console.log('match:', bcrypt.compareSync(pass, hash));