const set_captchan_audio_listener = (page, callback) => {
    // Set up a response event listener
    // change to match the url source from google captcha <---!!!
    page.on('response', async (response) => {
        // Access the response URL
        const url = response.url();
        // Check if the response is from a specific source (e.g., example.com)
        if (url.includes('www.google.com/recaptcha/api2/payload')) {
            // Modify the response if needed
            // For example, you can read the response body and modify it using the following:
            await callback(response, page);
        }
    });

}

export default set_captchan_audio_listener;
