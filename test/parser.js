/* test parser */
import transcribe from '../src/parsers/parser.js';
// Import the necessary modules
import chai from 'chai';
const expect = chai.expect;
// to make into steam   
import fs from 'fs';


// The test suite using Mocha's describe function
describe('whisper api response', () => {
    // Test case 1
    it('correcly transcribs the audio "The embellishment kits"', async () => {
        // make the post request
        let responsePromise = transcribe(
            fs.createReadStream("./test/files/The embellishment kits.mpeg")
        );
        await expect(responsePromise).to.eventually.be.fulfilled;
        // check the response
        let response = await responsePromise;
        expect(response).to.equal('The embellishment kits.');
    });
    it('correcly transcribs the audio "The Amazing Collaborative Process"', async () => {
        // make the post request
        let responsePromise = transcribe(
            fs.createReadStream("./test/files/amazing collaborative process.mpeg")
        );
        await expect(responsePromise).to.eventually.be.fulfilled;
        // check the response
        let response = await responsePromise;
        expect(response).to.equal("It's an amazing collaborative process.");
    });
});





