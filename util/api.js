import crypto from 'crypto';

import bcrypt from 'bcryptjs';

async function genAPIKey() {
    const saltRounds = 12;
    const token = crypto.randomUUID();
    const hashedToken = await bcrypt.hash(token, saltRounds);
    return { token: token, hashedToken: hashedToken };

    //create a base-36 string that contains 30 chars in a-z,0-9
    // return [...Array(30)]
    //     .map((e) => ((Math.random() * 36) | 0).toString(36))
    //     .join('');
}

export default genAPIKey;
