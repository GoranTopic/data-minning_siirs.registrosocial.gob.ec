// https://www.google.com/recaptcha/api2/payload?p=06ADUVZwCFcY_bz-5mjfK8PB8nR-RB-6q5khXbMBCx17IADmagstnvFWGX0lcmTT2Fj31NIWL2CbIVpc4KKOuqH7-E-a46z-Pq3e5v2TSqt7wuJWvPxXaEWVbYnmLmMJju1eDHdQZMNFdrOMtODOdVQhiYUB53EqMLIEPO70YEW_qFYqMLftfMLvFFRJKezWxoDx_fg2NcPikw&k=6LduoHoaAAAAAIydB9j8ldHtqeuHnPfiSgSDeVfZ


const set_captchan_audio_listener = (page, callback) => {
    // Set up a response event listener
    let base_url = 'https://www.google.com/recaptcha/api2/payload';
    // set up a response event listener
    page.on('request', async (request) => {
        // Access the response URL
        const url = request.url();
        console.log('intercepted request url', url);
        console.log('url.includes(base_url) request', url.includes(base_url));
        // Check if the response is from a specific source (e.g., example.com)
        if (url.includes(base_url)) {
            // Modify the response if needed
            // For example, you can read the response body and modify it using the following:
            await callback(request, page);
        }
        request.continue();
    });
}

export default set_captchan_audio_listener;
