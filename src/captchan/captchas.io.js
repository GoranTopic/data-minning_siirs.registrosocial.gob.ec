// import axios 
import axios from 'axios';
// waiter
import wait from 'waiting-for-js';

const captcha_solver = async (page, token, options={}) => {
    /* this function will solve the captcha using captchas.io service
     * it takes a page and looks for the captcha element
     * then it will send the captcha to the service
     * checks for the response every n seconds
     * then it will fill the captcha element with the response
     * and return true */

    let { checkEvery, timeout, submitEndpoint, checkEndpoint, debug } = options;
    
    // default values
    if(!checkEvery) checkEvery = 5; // seconds
    if(!timeout) timeout = 400; // seconds
    if(!submitEndpoint) submitEndpoint = 'https://api.captchas.io/in.php'
    if(!checkEndpoint) checkEndpoint = 'https://api.captchas.io/res.php'
    if(!debug) debug = false;


	// get the domain from the page object
	const url = page.url();

	// wait gor captcha to be element to appear
	const iframeElement = await page.waitForSelector('iframe');

	// wait for short time
	await wait.for.shortTime()

	// Get the 'src' attribute value of the iframe element
	const iframeSrc = await iframeElement.getAttribute('src');

	// get key from src
	const captchanKey = iframeSrc.split('k=')[1].split('&')[0];

    debug && console.log('[captcha.io] querying:', `${submitEndpoint}?key=${token}&googlekey=${captchanKey}&method=userrecaptcha&pageurl=${url}`);
	// get the response from 2captcha
	let response = await axios.post(`${submitEndpoint}?key=${token}&googlekey=${captchanKey}&method=userrecaptcha&pageurl=${url}`)

    debug && console.log('[captcha.io] response:', response.data);

	// get captcha id
	let captchaID = (response.data.includes('OK')) ? response.data.split('|')[1] : null;
	//console.log('captchaID:', captchaID);
	// if we got a null ID, then we have an error
	if (captchaID === null){
        console.error('[captcha.io] Error getting captcha ID');
        return false
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
        // if captcha is solved, then break the loop
		if (captchaResponse.data.includes('OK')) {
			captchaToken = captchaResponse.data.split('|')[1];
			debug && console.log('[captcha.io] captchaToken:', captchaToken);
			break;
		}
        if(timeWaited > timeout) {
            debug && console.error('[captcha.io] Error getting captcha token');
            return false
        }
	}

    // wait for function to find the callback function
    let result = await page.evaluate( () => {
        if (typeof (___grecaptcha_cfg) !== 'undefined') {
            // eslint-disable-next-line camelcase, no-undef
            return Object.entries(___grecaptcha_cfg.clients).map(([cid, client]) => {
                const data = { id: cid, version: cid >= 10000 ? 'V3' : 'V2' };
                const objects = Object.entries(client).filter(([_, value]) => value && typeof value === 'object');
                objects.forEach(([toplevelKey, toplevel]) => {
                    const found = Object.entries(toplevel).find(([_, value]) => (
                        value && typeof value === 'object' && 'sitekey' in value && 'size' in value
                    ));
                    if (typeof toplevel === 'object' && toplevel instanceof HTMLElement && toplevel['tagName'] === 'DIV'){
                        data.pageurl = toplevel.baseURI;
                    }
                    if (found) {
                        const [sublevelKey, sublevel] = found;

						data.sitekey = sublevel.sitekey;
						const callbackKey = data.version === 'V2' ? 'callback' : 'promise-callback';
						const callback = sublevel[callbackKey];
						if (!callback) {
							data.callback = null;
							data.function = null;
						} else {
							data.function = callback;
							const keys = [cid, toplevelKey, sublevelKey, callbackKey].map((key) => `['${key}']`).join('');
							data.callback = `___grecaptcha_cfg.clients${keys}`;
						}
					}
				});
				return data;
			});
		}
		return [];
	});
	// return result
	let callback_function = result[0].callback;

	// make the id g-recaptcha-response visible
	await page.evaluate( ({ captchaToken }) => {
        // make textarea visible
        document.getElementById("g-recaptcha-response").style.display = "block";
		document.getElementById("g-recaptcha-response").value = captchaToken;	
	}, { captchaToken });

    await page.evaluate( ({ captchaToken, callback_function }) => {
        let callback = eval(callback_function)
        if(typeof callback === 'function'){
            callback(captchaToken)
        }
    }, { captchaToken, callback_function });

    // run callback function 
	return true
}


export default captcha_solver;


