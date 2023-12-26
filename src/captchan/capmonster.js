// import axios 
import axios from 'axios';
// waiter
import wait from 'waiting-for-js';

const moster_solver = async (url, sitekey, token, options={}) => {

    let { checkEvery, timeout, submitEndpoint, checkEndpoint, debug } = options;
    
    // default values
    if(!checkEvery) checkEvery = 5; // seconds
    if(!timeout) timeout = 800; // seconds
    if(!submitEndpoint) submitEndpoint = 'https://api.capmonster.cloud/createTask';
    if(!checkEndpoint) checkEndpoint = 'https://api.capmonster.cloud/getTaskResult';
    if(!debug) debug = false;


	// wait for short time
	await wait.for.shortTime()

    debug && console.log(`[capmonster] querying ${submitEndpoint}`, {
        "clientKey": token,
        "task": 
        {
            "type":"NoCaptchaTaskProxyless",
            "websiteURL": url,
            "websiteKey": sitekey
        }
    });

    // get the response from 2captcha
    let response = await axios.post(submitEndpoint, {
        "clientKey": token,
        "task": 
        {
            "type":"NoCaptchaTaskProxyless",
            "websiteURL": url,
            "websiteKey": sitekey
        }
    })

    debug && console.log('[capmonster] response:', response.data);

	// get captcha id
	let captchaID = (response.data.taskId) ? response.data.taskId : null;
	//console.log('captchaID:', captchaID);
	// if we got a null ID, then we have an error
	if (captchaID === null){
        console.error('[capmonster] Error getting captcha ID', response.data);
        return false
    }

    // check if captcha is solved every 5 seconds
    let captchaToken = null;
    let timeWaited = 0;
    while (true) {
        // wait for 5 seconds
        await new Promise(r => setTimeout(r, checkEvery * 1000));
        timeWaited += checkEvery;
        debug && console.log('[capmonster] checking captcha:', timeWaited, 'seconds');
        // check if captcha is solved
        const captchaResponse = await axios.post(checkEndpoint,{
            "clientKey": token,
            "taskId": captchaID
        });
        debug && console.log('[capmonster] captchaResponse:', captchaResponse.data);
        // if captcha is solved, then break the loop
        if (captchaResponse.data.status === 'ready') {
            captchaToken = captchaResponse.data.solution.gRecaptchaResponse;
            break;
        }
        if(timeWaited > timeout) {
            debug && console.error('[captcha.io] Captchan timeout');
            throw new Error('Captcha timeout');
        }
    }
    // return token
	return captchaToken;
}


export default moster_solver;


