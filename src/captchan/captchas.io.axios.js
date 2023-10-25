// import axios 
import axios from 'axios';
// waiter
import wait from 'waiting-for-js';

const captcha_solver = async (url, sitekey, token, options={}) => {
    /* this function will solve the captcha using captchas.io service
     * it takes a html page object, and a token
     * then it will send the captcha to the service
     * checks for the response every n seconds
     * then it will fill the captcha element with the response
     * and return true */

    let { checkEvery, timeout, submitEndpoint, 
        checkEndpoint, debug, proxy, proxytype
    } = options;
    
    // default values
    if(!checkEvery) checkEvery = 5; // seconds
    if(!timeout) timeout = 800; // seconds
    if(!submitEndpoint) submitEndpoint = 'https://api.captchas.io/in.php'
    if(!checkEndpoint) checkEndpoint = 'https://api.captchas.io/res.php'
    if(!debug) debug = false;
    if(!proxy) proxy = null;
    if(!proxytype) proxytype = null;

    // make the query string
    let querying = `${submitEndpoint}?key=${token}&googlekey=${sitekey}&method=userrecaptcha` + (proxy? `&proxy=${proxy}` : '') + (proxytype? `&proxytype=${proxytype}` : '') + `&pageurl=${url}`;
    debug && console.log('[captcha.io] querying url:', querying);
	// get the response from 2captcha
	let response = await axios.post(querying);

    debug && console.log('[captcha.io] response:', response.data);

	let captchaID = (response.data.includes('OK')) ? response.data.split('|')[1] : null;
	debug && console.log('[captcha.io] captchaID:', captchaID);
    
	// if we got a null ID, then we have an error
	if (captchaID === null){
        console.error('[captcha.io] Error getting captcha ID');
        throw new Error('Error getting captcha ID');
    }

    // check if captcha is solved every 5 seconds
    let captchaToken = null;
    let timeWaited = 0;
    while (true) {
        // wait for 5 seconds
        await new Promise(r => setTimeout(r, checkEvery * 1000));
        timeWaited += checkEvery;
        debug && console.log('[captcha.io] checking captcha:', timeWaited, 'seconds');
        // check if captcha is solved
        const captchaResponse = await axios.get(`${checkEndpoint}?key=${token}&action=get&id=${captchaID}`);
        debug && console.log('[captcha.io] captchaResponse:', captchaResponse.data);
        // if captcha is solved, then break the loop
        if (captchaResponse.data.includes('OK')) {
            captchaToken = captchaResponse.data.split('|')[1];
            if(captchaToken === '') {
                debug && console.error('[captcha.io] Captcha is empty');
                throw new Error('Captcha is empty');
            }
            debug && console.log('[captcha.io] captchaToken:', captchaToken);
            break;
        }else if (captchaResponse.data.includes('ERROR_CAPTCHA_UNSOLVABLE')) {
            debug && console.error('[captcha.io] Captcha is unsolvable');
            throw new Error('Captcha is unsolvable');
        }
        if(timeWaited > timeout) {
            debug && console.error('[captcha.io] Captchan timeout');
            throw new Error('Captcha timeout');
        }
    }

    // return token
	return captchaToken;
}

export default captcha_solver;


