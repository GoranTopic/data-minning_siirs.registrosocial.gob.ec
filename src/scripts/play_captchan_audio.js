import wait from 'waiting-for-js'

async function getTextContent(element) {
  try {
    const textContent = await element.evaluate((el) => el.textContent);
    return textContent.trim(); // Trimming to remove leading/trailing whitespaces
  } catch (error) {
    console.error('Error while getting text content:', error.message);
    return null;
  }
}


const play_capcha_audio = async (page) => {
    /* this script will push the button to play the audio captcha */

    // wait gor captcha to be element to appear
    await page.waitForSelector('iframe');
    
    // wait for short time
    await wait.for.shortTime()

    // get the iframes
    let iframes = page.frames();

    // Get the iframe where the reCAPTCHA is and click on checkbox
    let iframeHandle = await page.$x(`//iframe[@title="reCAPTCHA"]`);
    let frame = await iframeHandle[0].contentFrame();

    // Now you are inside the iframe, you can click on the checkbox
    await frame.waitForSelector('#recaptcha-anchor'); 
    await frame.click('#recaptcha-anchor');

    // wait for short time
    await wait.for.shortTime()

    // now get the iframe where the audio button is and click on it
    iframeHandle = await page.$x(`//iframe[@title="recaptcha challenge expires in two minutes"]`);
    frame = await iframeHandle[0].contentFrame();

    // now click on the audio button
    await frame.waitForSelector('#recaptcha-audio-button');
    await frame.click('#recaptcha-audio-button');
    console.log('clicked audio button');

    // wait for long time
    await wait.for.longTime()

    // if there is element with class .rc-doscaptcha-body-text
    // then error with body-text
    const error = await frame.$('.rc-doscaptcha-body-text');
    if (error) {
        const body_text_error = await getTextContent(error);
        // get text from element
        throw new Error(body_text_error);
    } 

    // wait until the play button appears
    // now click on the audio button
    await frame.waitForSelector('.rc-audiochallenge-play-button');
    await frame.click('.rc-audiochallenge-play-button');
    console.log('clicked play button');

    return true;    
}

export default play_capcha_audio;
