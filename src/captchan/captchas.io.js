// import axios 
import axios from 'axios';
// waiter
import wait from 'waiting-for-js';

let checkEvery = 10; // seconds
let timeout = 250; // seconds
let submitEndpoint = 'https://api.captchas.io/in.php'   
let checkEndpoint = 'https://api.captchas.io/res.php'


const captcha_solver = async (page, token) => {
    /* this function will solve the captcha using captchas.io service
     * it takes a page and looks for the captcha element
     * then it will send the captcha to the service
     * checks for the response every n seconds
     * then it will fill the captcha element with the response
     * and return true
     */

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

        //console.log('querying:', `${submitEndpoint}?key=${token}&googlekey=${captchanKey}&method=userrecaptcha&pageurl=${url}`);
	// get the response from 2captcha
	let response = await axios.post(`${submitEndpoint}?key=${token}&googlekey=${captchanKey}&method=userrecaptcha&pageurl=${url}`)

    //console.log('response:', response.data);

	// get captcha id
	let captchaID = (response.data.includes('OK')) ? response.data.split('|')[1] : null;
	//console.log('captchaID:', captchaID);
	// if we got a null ID, then we have an error
	if (captchaID === null){
        console.error('Error getting captcha ID');
        return false
    }

	// check if captcha is solved every 5 seconds
	let captchaToken = null;
    let timeWaited = 0;
	while (true) {
		// wait for 5 seconds
        await new Promise(r => setTimeout(r, checkEvery * 1000));
        timeWaited += checkEvery;
        console.log('checking captcha:', timeWaited, 'seconds');
        // check if captcha is solved
		const captchaResponse = await axios.get(`${checkEndpoint}?key=${token}&action=get&id=${captchaID}`);
        // if captcha is solved, then break the loop
		if (captchaResponse.data.includes('OK')) {
			captchaToken = captchaResponse.data.split('|')[1];
			console.log('captchaToken:', captchaToken);
			break;
		}
        if(timeWaited > timeout) {
            console.error('Error getting captcha token');
            return false
        }
	}

	// make the id g-recaptcha-response visible
	await page.evaluate( ({ captchaToken }) => {
		document.getElementById("g-recaptcha-response").innerHTML=captchaToken;	
	}, { captchaToken });

	return true
}


export default captcha_solver;


