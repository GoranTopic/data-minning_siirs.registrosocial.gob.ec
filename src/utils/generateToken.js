import crypto from 'crypto';

function generateToken(length = 512) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
    let token = '';
    // check if length is a positive integer
    if(!Number.isInteger(length) || length <= 0) 
        throw new Error("Length must be a positive integer.");
    // generate token
    for (let i = 0; i < length; i++) token += chars.charAt(crypto.randomInt(chars.length));
    return token;
}

export default generateToken;
